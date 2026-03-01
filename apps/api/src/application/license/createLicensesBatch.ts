import type { LicenseRepository } from '../../domain/license/licenseRepository';
import type { PlayerRepository } from '../../domain/player/playerRepository';
import type { SeasonRepository } from '../../domain/season/seasonRepository';
import type { LicenseEntity } from '../../domain/license/licenseEntity';
import type { CreateLicenseInput } from '@hoop/shared';

export interface CreateLicensesBatchDeps {
  readonly licenseRepository: LicenseRepository;
  readonly playerRepository: PlayerRepository;
  readonly seasonRepository: SeasonRepository;
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
    const license = await deps.licenseRepository.create(input);
    results.push(license);
  }
  return results;
}
