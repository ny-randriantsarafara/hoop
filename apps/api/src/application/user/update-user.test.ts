import { describe, expect, it, vi } from 'vitest';
import { updateUser } from './update-user';

function createDeps(userExists: boolean) {
  const existingUser = userExists
    ? {
        id: 'user-1',
        clubId: 'club-1',
        name: 'Coach',
        email: 'coach@test.mg',
        passwordHash: 'hash',
        role: 'adminClub',
        lastLogin: null,
        createdAt: new Date('2026-01-01'),
      }
    : null;

  return {
    userRepository: {
      findById: vi.fn().mockResolvedValue(existingUser),
      findManyByClub: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({
        id: 'user-1',
        clubId: 'club-1',
        name: 'Head Coach',
        email: 'coach@test.mg',
        passwordHash: 'hash',
        role: 'adminClub',
        lastLogin: null,
        createdAt: new Date('2026-01-01'),
      }),
      updatePassword: vi.fn(),
      delete: vi.fn(),
      updateLastLogin: vi.fn(),
    },
  };
}

describe('updateUser', () => {
  it('updates user when belongs to club', async () => {
    const deps = createDeps(true);
    const result = await updateUser(deps, 'user-1', 'club-1', { name: 'Head Coach' });

    expect(deps.userRepository.update).toHaveBeenCalledWith('user-1', { name: 'Head Coach' });
    expect(result.name).toBe('Head Coach');
  });

  it('throws when user is missing', async () => {
    const deps = createDeps(false);
    await expect(updateUser(deps, 'user-1', 'club-1', { name: 'Head Coach' })).rejects.toThrow(
      'User not found',
    );
    expect(deps.userRepository.update).not.toHaveBeenCalled();
  });
});
