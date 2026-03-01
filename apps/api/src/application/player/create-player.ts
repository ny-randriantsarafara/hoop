import type { PlayerRepository } from '../../domain/player/player.repository';
import type { PlayerEntity } from '../../domain/player/player.entity';
import type { CreatePlayerInput } from '@hoop/shared';

export interface CreatePlayerDeps {
  readonly playerRepository: PlayerRepository;
}

export async function createPlayer(
  deps: CreatePlayerDeps,
  input: CreatePlayerInput,
): Promise<PlayerEntity> {
  return deps.playerRepository.create(input);
}
