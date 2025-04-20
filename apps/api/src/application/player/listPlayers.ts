import type { PlayerRepository, PlayerFilters } from '../../domain/player/playerRepository.js';
import type { PlayerEntity } from '../../domain/player/playerEntity.js';

export interface ListPlayersDeps {
  readonly playerRepository: PlayerRepository;
}

export async function listPlayers(
  deps: ListPlayersDeps,
  filters: PlayerFilters,
): Promise<PlayerEntity[]> {
  return deps.playerRepository.findMany(filters);
}
