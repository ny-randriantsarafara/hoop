import { describe, it, expect, vi } from 'vitest';
import { createPlayer } from './createPlayer';
import type { PlayerEntity } from '../../domain/player/playerEntity';

const mockInput = {
  clubId: 'club-1',
  firstName: 'Andria',
  lastName: 'Naina',
  birthDate: new Date('2010-05-15'),
  gender: 'G' as const,
  address: '123 Rue Principale',
};

const mockPlayer: PlayerEntity = {
  id: 'player-1',
  ...mockInput,
  phone: null,
  email: null,
  photoUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('createPlayer', () => {
  it('creates a player via the repository', async () => {
    const deps = {
      playerRepository: {
        create: vi.fn().mockResolvedValue(mockPlayer),
        findById: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
    };

    const result = await createPlayer(deps, mockInput);

    expect(deps.playerRepository.create).toHaveBeenCalledWith(mockInput);
    expect(result).toEqual(mockPlayer);
  });
});
