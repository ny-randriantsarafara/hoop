import type { LicenseRepository } from '../../domain/license/license.repository';
import type { PlayerRepository } from '../../domain/player/player.repository';
import type { SeasonRepository } from '../../domain/season/season.repository';
import type { LicenseEntity } from '../../domain/license/license.entity';
import type { CategoryRepository } from '../../domain/category/category-repository';
import type { CreateLicenseInput } from '@hoop/shared';

export interface CreateLicensesBatchDeps {
  readonly licenseRepository: LicenseRepository;
  readonly playerRepository: PlayerRepository;
  readonly seasonRepository: SeasonRepository;
  readonly categoryRepository: CategoryRepository;
}

export async function createLicensesBatch(
  deps: CreateLicensesBatchDeps,
  inputs: ReadonlyArray<CreateLicenseInput>,
): Promise<ReadonlyArray<LicenseEntity>> {
  const results: LicenseEntity[] = [];
  for (const input of inputs) {
    const player = await deps.playerRepository.findById(input.playerId);
    if (!player) {
      throw new Error(`Player ${input.playerId} not found`);
    }
    const season = await deps.seasonRepository.findById(input.seasonId);
    if (!season) {
      throw new Error(`Season ${input.seasonId} not found`);
    }

    const category = await deps.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new Error(`Category ${input.categoryId} not found`);
    }
    if (category.clubId !== player.clubId) {
      throw new Error(`Category ${input.categoryId} not allowed for player ${input.playerId}`);
    }

    const license = await deps.licenseRepository.create(input);
    results.push(license);
  }
  return results;
}
