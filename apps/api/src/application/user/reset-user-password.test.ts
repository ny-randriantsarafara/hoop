import { describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { resetUserPassword } from './reset-user-password';

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn() },
}));

describe('resetUserPassword', () => {
  it('hashes password then updates target user', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
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
        updatePassword: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn(),
        updateLastLogin: vi.fn(),
      },
    };

    await resetUserPassword(deps, 'user-1', 'club-1', 'password123');

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(deps.userRepository.updatePassword).toHaveBeenCalledWith('user-1', 'new-hash');
  });

  it('throws when user not found in club', async () => {
    const deps = {
      userRepository: {
        findById: vi.fn().mockResolvedValue(null),
        findManyByClub: vi.fn(),
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updatePassword: vi.fn(),
        delete: vi.fn(),
        updateLastLogin: vi.fn(),
      },
    };

    await expect(resetUserPassword(deps, 'user-1', 'club-1', 'password123')).rejects.toThrow(
      'User not found',
    );
    expect(deps.userRepository.updatePassword).not.toHaveBeenCalled();
  });
});
