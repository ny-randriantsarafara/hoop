import type { LicenseRepository, LicenseFilters } from '../../domain/license/licenseRepository.js';
import type { LicenseWithRelations } from '@hoop/shared';

export interface ListLicensesDeps {
  readonly licenseRepository: LicenseRepository;
}

export async function listLicenses(
  deps: ListLicensesDeps,
  filters: LicenseFilters,
): Promise<LicenseWithRelations[]> {
  return deps.licenseRepository.findManyWithRelations(filters);
}
