import { describe, expect, it } from 'vitest';
import { prepareLicenseInput, resolveCategoryIdByName } from './license-draft';

const categories = [
  { id: 'cat-u13', name: 'U13' },
  { id: 'cat-u15', name: 'U15' },
];

describe('resolveCategoryIdByName', () => {
  it('returns matching category id case-insensitively', () => {
    expect(resolveCategoryIdByName(' u13 ', categories)).toBe('cat-u13');
  });

  it('returns null when there is no matching category name', () => {
    expect(resolveCategoryIdByName('UNKNOWN', categories)).toBeNull();
  });
});

describe('prepareLicenseInput', () => {
  it('returns ready result for complete and valid data', () => {
    const result = prepareLicenseInput(
      {
        number: '  LIC-2026-001  ',
        category: 'ignored-for-write-contract',
        startDate: '2026-09-01',
        endDate: '2027-06-30',
      },
      'cat-u13',
    );

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      expect(result.data.number).toBe('LIC-2026-001');
      expect(result.data.categoryId).toBe('cat-u13');
      expect(result.data.startDate).toEqual(new Date('2026-09-01'));
      expect(result.data.endDate).toEqual(new Date('2027-06-30'));
    }
  });

  it('returns missing fields when number and category are empty', () => {
    const result = prepareLicenseInput(
      {
        number: '   ',
        category: null,
        startDate: '2026-09-01',
        endDate: '2027-06-30',
      },
      null,
    );

    expect(result).toEqual({ kind: 'invalid', missing: ['number', 'category'] });
  });

  it('returns missing fields when dates are invalid', () => {
    const result = prepareLicenseInput(
      {
        number: 'LIC-2026-001',
        category: 'U13',
        startDate: 'not-a-date',
        endDate: null,
      },
      'cat-u13',
    );

    expect(result).toEqual({ kind: 'invalid', missing: ['startDate', 'endDate'] });
  });

  it('returns number as invalid when it exceeds max length', () => {
    const result = prepareLicenseInput(
      {
        number: 'A'.repeat(51),
        category: 'U13',
        startDate: '2026-09-01',
        endDate: '2027-06-30',
      },
      'cat-u13',
    );

    expect(result).toEqual({ kind: 'invalid', missing: ['number'] });
  });
});
