import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

describe('api proxy route', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    delete process.env.API_URL;
  });

  it('forwards GET requests to API_URL and preserves query string', async () => {
    process.env.API_URL = 'http://hoop-api:3001/api';

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ totalPlayers: 12 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const response = await GET(new Request('http://localhost/api/dashboard/stats?season=active'), {
      params: Promise.resolve({ path: ['dashboard', 'stats'] }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://hoop-api:3001/api/dashboard/stats?season=active',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ totalPlayers: 12 });
  });

  it('forwards request bodies and propagates upstream status codes', async () => {
    process.env.API_URL = 'http://hoop-api:3001/api';

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: 'validation failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const body = JSON.stringify({ firstName: 'Ada' });
    const response = await POST(
      new Request('http://localhost/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
        body,
      }),
      {
        params: Promise.resolve({ path: ['players'] }),
      },
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://hoop-api:3001/api/players');
    expect(options.method).toBe('POST');
    expect(options.body).toBe(body);
    expect(options.headers).toBeInstanceOf(Headers);
    expect((options.headers as Headers).get('authorization')).toBe('Bearer jwt-token');
    expect((options.headers as Headers).get('content-type')).toBe('application/json');
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'validation failed' });
  });
});
