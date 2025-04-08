import type { LicenseEntity } from './licenseEntity.js';
import type { CreateLicenseInput, LicenseStatus, LicenseWithRelations } from '@hoop/shared';

export interface LicenseFilters {
  readonly playerId?: string;
  readonly seasonId?: string;
  readonly status?: LicenseStatus;
  readonly category?: string;
}

export interface LicenseRepository {
  findById(id: string): Promise<LicenseEntity | null>;
  findMany(filters: LicenseFilters): Promise<LicenseEntity[]>;
  findManyWithRelations(filters: LicenseFilters): Promise<LicenseWithRelations[]>;
  findActiveByPlayerId(playerId: string): Promise<LicenseEntity | null>;
  create(input: CreateLicenseInput): Promise<LicenseEntity>;
  countBySeason(seasonId: string): Promise<number>;
  getNextSequenceNumber(seasonId: string): Promise<number>;
}
