import type { PlayerRepository } from '../../domain/player/playerRepository';
import type { PlayerEntity } from '../../domain/player/playerEntity';
import type { UpdatePlayerInput } from '@hoop/shared';

export interface UpdatePlayerDeps {
  readonly playerRepository: PlayerRepository;
}

export async function updatePlayer(
  deps: UpdatePlayerDeps,
  id: string,
  input: UpdatePlayerInput,
): Promise<PlayerEntity> {
  const existing = await deps.playerRepository.findById(id);
  if (!existing) {
    throw new Error('Player not found');
  }
  return deps.playerRepository.update(id, input);
}
