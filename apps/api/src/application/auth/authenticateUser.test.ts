import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { authenticateUser, type AuthenticateUserDeps } from './authenticateUser';

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn() },
}));

const mockUser = {
  id: 'user-1',
  name: 'Admin',
  email: 'admin@test.mg',
  passwordHash: '$2b$10$hashed',
  role: 'admin',
  clubId: 'club-1',
  lastLogin: null,
};

function createDeps(
  overrides: Partial<AuthenticateUserDeps['userRepository']> = {},
): AuthenticateUserDeps {
  return {
    userRepository: {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(mockUser),
      updateLastLogin: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    },
  };
}

describe('authenticateUser', () => {
  it('returns auth result on valid credentials', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const deps = createDeps();

    const result = await authenticateUser(deps, {
      email: 'admin@test.mg',
      password: 'password123',
    });

    expect(result).toEqual({
      userId: 'user-1',
      name: 'Admin',
      email: 'admin@test.mg',
      role: 'admin',
      clubId: 'club-1',
    });
    expect(deps.userRepository.updateLastLogin).toHaveBeenCalledWith('user-1');
  });

  it('throws when user is not found', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(null) });

    await expect(
      authenticateUser(deps, { email: 'unknown@test.mg', password: 'password123' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('throws when password does not match', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const deps = createDeps();

    await expect(
      authenticateUser(deps, { email: 'admin@test.mg', password: 'wrongpassword' }),
    ).rejects.toThrow('Invalid credentials');
  });
});
