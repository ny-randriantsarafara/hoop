import type { LicenseRepository } from '../../domain/license/license.repository';
import type { PlayerRepository } from '../../domain/player/player.repository';
import type { SeasonRepository } from '../../domain/season/season.repository';
import type { LicenseEntity } from '../../domain/license/license.entity';
import type { CategoryRepository } from '../../domain/category/category-repository';
import type { CreateLicenseInput } from '@hoop/shared';

export interface CreateLicenseDeps {
  readonly licenseRepository: LicenseRepository;
  readonly playerRepository: PlayerRepository;
  readonly seasonRepository: SeasonRepository;
  readonly categoryRepository: CategoryRepository;
}

export async function createLicense(
  deps: CreateLicenseDeps,
  input: CreateLicenseInput,
): Promise<LicenseEntity> {
  const player = await deps.playerRepository.findById(input.playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  const season = await deps.seasonRepository.findById(input.seasonId);
  if (!season) {
    throw new Error('Season not found');
  }

  const category = await deps.categoryRepository.findById(input.categoryId);
  if (!category) {
    throw new Error('Category not found');
  }

  if (category.clubId !== player.clubId) {
    throw new Error('Category not allowed for club');
  }

  return deps.licenseRepository.create(input);
}
