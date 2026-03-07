import { beforeEach, describe, expect, it, vi } from 'vitest';

interface MockedAuthConfig {
  basePath?: string;
  pages?: {
    signIn?: string;
  };
}

interface MockedCredentialsConfig {
  authorize: (credentials: Record<string, unknown>) => Promise<unknown>;
}

const nextAuthMock = vi.fn(() => ({
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
}));

const credentialsMock = vi.fn((config: MockedCredentialsConfig) => config);

vi.mock('next-auth', () => ({
  default: nextAuthMock,
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: credentialsMock,
}));

describe('auth config', () => {
  beforeEach(() => {
    vi.resetModules();
    nextAuthMock.mockClear();
    credentialsMock.mockClear();
    vi.unstubAllGlobals();
    delete process.env.API_URL;
  });

  it('uses /auth as the NextAuth base path and keeps internal login on the API service', async () => {
    process.env.API_URL = 'http://hoop-api:3001/api';

    await import('./auth');

    expect(nextAuthMock).toHaveBeenCalledTimes(1);
    const config = nextAuthMock.mock.calls[0]?.[0] as MockedAuthConfig | undefined;
    expect(config).toBeDefined();
    expect(config!.basePath).toBe('/auth');
    expect(config!.pages?.signIn).toBe('/login');

    const providerConfig = credentialsMock.mock.calls[0]?.[0] as MockedCredentialsConfig | undefined;
    expect(providerConfig).toBeDefined();
    const authorize = providerConfig!.authorize;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'jwt-token',
        user: {
          userId: 'user-1',
          name: 'Coach',
          email: 'coach@example.com',
          role: 'ADMIN',
          clubId: 'club-1',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = await authorize({ email: 'coach@example.com', password: 'secret' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://hoop-api:3001/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(user).toEqual({
      id: 'user-1',
      name: 'Coach',
      email: 'coach@example.com',
      role: 'ADMIN',
      clubId: 'club-1',
      accessToken: 'jwt-token',
    });
  });
});
