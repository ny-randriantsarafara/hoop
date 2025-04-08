import type { LicenseStatus } from '@hoop/shared';

export interface LicenseEntity {
  readonly id: string;
  readonly playerId: string;
  readonly seasonId: string;
  readonly number: string;
  readonly status: LicenseStatus;
  readonly category: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function isLicenseActive(license: LicenseEntity): boolean {
  return license.status === 'active';
}

export function isLicenseExpired(license: LicenseEntity): boolean {
  return license.status === 'expired' || license.endDate < new Date();
}
