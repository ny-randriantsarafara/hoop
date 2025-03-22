import type { LicenseStatus } from '../constants/enums';

export interface License {
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

export interface LicenseWithRelations extends License {
  readonly player: { readonly firstName: string; readonly lastName: string };
  readonly season: { readonly label: string };
}
