import type { LicenseRepository } from '../../domain/license/licenseRepository';
import type { PlayerRepository } from '../../domain/player/playerRepository';
import type { SeasonRepository } from '../../domain/season/seasonRepository';
import type { LicenseEntity } from '../../domain/license/licenseEntity';
import type { CreateLicenseInput } from '@hoop/shared';

export interface CreateLicenseDeps {
  readonly licenseRepository: LicenseRepository;
  readonly playerRepository: PlayerRepository;
  readonly seasonRepository: SeasonRepository;
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

  return deps.licenseRepository.create(input);
}
