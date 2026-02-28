import type { PlayerRepository, PlayerFilters } from '../../domain/player/playerRepository';
import type { PlayerEntity } from '../../domain/player/playerEntity';

export interface ListPlayersDeps {
  readonly playerRepository: PlayerRepository;
}

export async function listPlayers(
  deps: ListPlayersDeps,
  filters: PlayerFilters,
): Promise<PlayerEntity[]> {
  return deps.playerRepository.findMany(filters);
}
