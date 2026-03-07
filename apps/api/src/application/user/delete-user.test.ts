import { describe, expect, it, vi } from 'vitest';
import { deleteUser } from './delete-user';

describe('deleteUser', () => {
  it('deletes a user from same club', async () => {
    const deps = {
      userRepository: {
        findById: vi.fn().mockResolvedValue({
          id: 'user-1',
          clubId: 'club-1',
        }),
        findManyByClub: vi.fn(),
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updatePassword: vi.fn(),
        delete: vi.fn().mockResolvedValue(undefined),
        updateLastLogin: vi.fn(),
      },
    };

    await deleteUser(deps, 'user-1', 'club-1');
    expect(deps.userRepository.delete).toHaveBeenCalledWith('user-1');
  });

  it('throws when user is outside club scope', async () => {
    const deps = {
      userRepository: {
        findById: vi.fn().mockResolvedValue({
          id: 'user-1',
          clubId: 'club-2',
        }),
        findManyByClub: vi.fn(),
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updatePassword: vi.fn(),
        delete: vi.fn(),
        updateLastLogin: vi.fn(),
      },
    };

    await expect(deleteUser(deps, 'user-1', 'club-1')).rejects.toThrow('User not found');
    expect(deps.userRepository.delete).not.toHaveBeenCalled();
  });
});
