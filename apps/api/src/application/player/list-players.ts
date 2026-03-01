import type { PlayerRepository, PlayerFilters } from '../../domain/player/player.repository';
import type { PlayerEntity } from '../../domain/player/player.entity';

export interface ListPlayersDeps {
  readonly playerRepository: PlayerRepository;
}

export async function listPlayers(
  deps: ListPlayersDeps,
  filters: PlayerFilters,
): Promise<PlayerEntity[]> {
  return deps.playerRepository.findMany(filters);
}
