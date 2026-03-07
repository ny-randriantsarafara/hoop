import { describe, expect, it, vi } from 'vitest';
import { listUsers } from './list-users';

describe('listUsers', () => {
  it('returns public users for a club', async () => {
    const deps = {
      userRepository: {
        findById: vi.fn(),
        findManyByClub: vi.fn().mockResolvedValue([
          {
            id: 'user-1',
            clubId: 'club-1',
            name: 'Coach',
            email: 'coach@test.mg',
            passwordHash: 'hash',
            role: 'adminClub',
            lastLogin: null,
            createdAt: new Date('2026-01-01'),
          },
        ]),
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updatePassword: vi.fn(),
        delete: vi.fn(),
        updateLastLogin: vi.fn(),
      },
    };

    const result = await listUsers(deps, 'club-1');
    expect(result).toEqual([
      {
        id: 'user-1',
        clubId: 'club-1',
        name: 'Coach',
        email: 'coach@test.mg',
        role: 'adminClub',
        lastLogin: null,
        createdAt: new Date('2026-01-01'),
      },
    ]);
  });
});
