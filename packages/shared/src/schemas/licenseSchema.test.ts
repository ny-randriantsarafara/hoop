import { describe, it, expect } from 'vitest';
import { createLicenseSchema, createLicensesBatchSchema } from './licenseSchema';

const validLicense = {
  playerId: '550e8400-e29b-41d4-a716-446655440000',
  seasonId: '660e8400-e29b-41d4-a716-446655440000',
  number: 'LIC-2025-001',
  status: 'active' as const,
  category: 'U14',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
};

describe('createLicenseSchema', () => {
  it('accepts a valid license', () => {
    const result = createLicenseSchema.safeParse(validLicense);
    expect(result.success).toBe(true);
  });

  it('coerces date strings to Date objects', () => {
    const result = createLicenseSchema.parse(validLicense);
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
  });

  it('rejects invalid status', () => {
    const result = createLicenseSchema.safeParse({ ...validLicense, status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects empty license number', () => {
    const result = createLicenseSchema.safeParse({ ...validLicense, number: '' });
    expect(result.success).toBe(false);
  });

  it('rejects non-uuid playerId', () => {
    const result = createLicenseSchema.safeParse({ ...validLicense, playerId: 'abc' });
    expect(result.success).toBe(false);
  });
});

describe('createLicensesBatchSchema', () => {
  it('accepts a batch of valid licenses', () => {
    const result = createLicensesBatchSchema.safeParse({ licenses: [validLicense, validLicense] });
    expect(result.success).toBe(true);
  });

  it('rejects an empty batch', () => {
    const result = createLicensesBatchSchema.safeParse({ licenses: [] });
    expect(result.success).toBe(false);
  });

  it('rejects when any license in batch is invalid', () => {
    const result = createLicensesBatchSchema.safeParse({
      licenses: [validLicense, { ...validLicense, playerId: 'bad' }],
    });
    expect(result.success).toBe(false);
  });
});
