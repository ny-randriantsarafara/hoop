import { describe, it, expect, vi } from 'vitest';
import { deletePlayer } from './deletePlayer';
import type { PlayerEntity } from '../../domain/player/playerEntity';

const mockPlayer: PlayerEntity = {
  id: 'player-1',
  clubId: 'club-1',
  firstName: 'Andria',
  lastName: 'Naina',
  birthDate: new Date('2010-05-15'),
  gender: 'G',
  address: '123 Rue Principale',
  phone: null,
  email: null,
  photoUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createDeps(playerExists: boolean) {
  return {
    playerRepository: {
      findById: vi.fn().mockResolvedValue(playerExists ? mockPlayer : null),
      delete: vi.fn().mockResolvedValue(undefined),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  };
}

describe('deletePlayer', () => {
  it('deletes an existing player', async () => {
    const deps = createDeps(true);

    await deletePlayer(deps, 'player-1');

    expect(deps.playerRepository.findById).toHaveBeenCalledWith('player-1');
    expect(deps.playerRepository.delete).toHaveBeenCalledWith('player-1');
  });

  it('throws when player does not exist', async () => {
    const deps = createDeps(false);

    await expect(deletePlayer(deps, 'nonexistent')).rejects.toThrow('Player not found');
    expect(deps.playerRepository.delete).not.toHaveBeenCalled();
  });
});
