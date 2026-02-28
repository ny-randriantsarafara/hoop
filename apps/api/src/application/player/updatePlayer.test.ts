import { describe, it, expect, vi } from 'vitest';
import { updatePlayer } from './updatePlayer';
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

const updatedPlayer: PlayerEntity = { ...mockPlayer, firstName: 'Rakoto' };

function createDeps(playerExists: boolean) {
  return {
    playerRepository: {
      findById: vi.fn().mockResolvedValue(playerExists ? mockPlayer : null),
      update: vi.fn().mockResolvedValue(updatedPlayer),
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      countByClub: vi.fn(),
    },
  };
}

describe('updatePlayer', () => {
  it('updates an existing player', async () => {
    const deps = createDeps(true);
    const input = { firstName: 'Rakoto' };

    const result = await updatePlayer(deps, 'player-1', input);

    expect(deps.playerRepository.update).toHaveBeenCalledWith('player-1', input);
    expect(result.firstName).toBe('Rakoto');
  });

  it('throws when player does not exist', async () => {
    const deps = createDeps(false);

    await expect(updatePlayer(deps, 'nonexistent', { firstName: 'Rakoto' })).rejects.toThrow(
      'Player not found',
    );
    expect(deps.playerRepository.update).not.toHaveBeenCalled();
  });
});
