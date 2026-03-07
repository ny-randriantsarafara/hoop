import { describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { createUser } from './create-user';

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn() },
}));

describe('createUser', () => {
  it('creates a user with hashed password', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    const deps = {
      userRepository: {
        findById: vi.fn(),
        findManyByClub: vi.fn(),
        findByEmail: vi.fn(),
        create: vi.fn().mockResolvedValue({
          id: 'user-1',
          clubId: 'club-1',
          name: 'Coach',
          email: 'coach@test.mg',
          passwordHash: 'hashed-password',
          role: 'adminClub',
          lastLogin: null,
          createdAt: new Date('2026-01-01'),
        }),
        update: vi.fn(),
        updatePassword: vi.fn(),
        delete: vi.fn(),
        updateLastLogin: vi.fn(),
      },
    };

    const result = await createUser(deps, 'club-1', {
      name: 'Coach',
      email: 'coach@test.mg',
      password: 'password123',
      role: 'adminClub',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(deps.userRepository.create).toHaveBeenCalledWith({
      clubId: 'club-1',
      name: 'Coach',
      email: 'coach@test.mg',
      passwordHash: 'hashed-password',
      role: 'adminClub',
    });
    expect(result).toEqual({
      id: 'user-1',
      clubId: 'club-1',
      name: 'Coach',
      email: 'coach@test.mg',
      role: 'adminClub',
      lastLogin: null,
      createdAt: new Date('2026-01-01'),
    });
  });
});
