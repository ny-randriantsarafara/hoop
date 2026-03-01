import type { PlayerRepository } from '../../domain/player/playerRepository';

export interface DeletePlayerDeps {
  readonly playerRepository: PlayerRepository;
}

export async function deletePlayer(deps: DeletePlayerDeps, id: string): Promise<void> {
  const existing = await deps.playerRepository.findById(id);
  if (!existing) {
    throw new Error('Player not found');
  }
  return deps.playerRepository.delete(id);
}
