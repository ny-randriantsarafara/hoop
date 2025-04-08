import type { PlayerEntity } from './playerEntity.js';
import type { CreatePlayerInput, UpdatePlayerInput, Gender } from '@hoop/shared';

export interface PlayerFilters {
  readonly clubId?: string;
  readonly search?: string;
  readonly gender?: Gender;
  readonly birthDateFrom?: Date;
  readonly birthDateTo?: Date;
}

export interface PlayerRepository {
  findById(id: string): Promise<PlayerEntity | null>;
  findMany(filters: PlayerFilters): Promise<PlayerEntity[]>;
  create(input: CreatePlayerInput): Promise<PlayerEntity>;
  update(id: string, input: UpdatePlayerInput): Promise<PlayerEntity>;
  delete(id: string): Promise<void>;
  countByClub(clubId: string): Promise<number>;
}
