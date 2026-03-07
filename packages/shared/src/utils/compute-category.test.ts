import { describe, it, expect } from 'vitest';
import { computeCategory, computeCategoryId, type CategoryDefinition } from './compute-category';

const categories: ReadonlyArray<CategoryDefinition> = [
  { id: 'u10-g', name: 'U10', gender: 'G', minAge: 0, maxAge: 9 },
  { id: 'u10-f', name: 'U10', gender: 'F', minAge: 0, maxAge: 9 },
  { id: 'u12-g', name: 'U12', gender: 'G', minAge: 10, maxAge: 11 },
  { id: 'u12-f', name: 'U12', gender: 'F', minAge: 10, maxAge: 11 },
  { id: 'u14-g', name: 'U14', gender: 'G', minAge: 12, maxAge: 13 },
  { id: 'u14-f', name: 'U14', gender: 'F', minAge: 12, maxAge: 13 },
  { id: 'senior-h', name: 'Senior', gender: 'H', minAge: 18, maxAge: null },
  { id: 'senior-d', name: 'Senior', gender: 'D', minAge: 18, maxAge: null },
];

describe('computeCategory', () => {
  it('returns the matching category for a given age and gender', () => {
    const birthDate = new Date('2015-06-15');
    expect(computeCategory(birthDate, 2025, 'F', categories)).toBe('U12');
  });

  it('returns U10 for a very young player', () => {
    const birthDate = new Date('2020-01-01');
    expect(computeCategory(birthDate, 2025, 'G', categories)).toBe('U10');
  });

  it('returns Senior for an adult player', () => {
    const birthDate = new Date('2000-03-20');
    expect(computeCategory(birthDate, 2025, 'H', categories)).toBe('Senior');
  });

  it('handles the boundary between two categories', () => {
    const birthDate = new Date('2012-01-01');
    expect(computeCategory(birthDate, 2025, 'G', categories)).toBe('U14');
  });

  it('handles maxAge null (open-ended Senior)', () => {
    const birthDate = new Date('1960-01-01');
    expect(computeCategory(birthDate, 2025, 'D', categories)).toBe('Senior');
  });

  it('returns Unknown when no category matches', () => {
    const gappedCategories: ReadonlyArray<CategoryDefinition> = [
      { name: 'U10', gender: 'G', minAge: 0, maxAge: 9 },
      { name: 'Senior', gender: 'H', minAge: 18, maxAge: null },
    ];
    const birthDate = new Date('2012-01-01');
    expect(computeCategory(birthDate, 2025, 'G', gappedCategories)).toBe('Unknown');
  });

  it('returns Unknown when categories array is empty', () => {
    const birthDate = new Date('2010-01-01');
    expect(computeCategory(birthDate, 2025, 'G', [])).toBe('Unknown');
  });

  it('uses age based on birth year only (not month/day)', () => {
    const earlyBirth = new Date('2015-01-01');
    const lateBirth = new Date('2015-12-31');
    expect(computeCategory(earlyBirth, 2025, 'F', categories)).toBe('U12');
    expect(computeCategory(lateBirth, 2025, 'F', categories)).toBe('U12');
  });

  it('returns Unknown when only age matches but gender differs', () => {
    const birthDate = new Date('2015-06-15');
    expect(computeCategory(birthDate, 2025, 'H', categories)).toBe('Unknown');
  });
});

describe('computeCategoryId', () => {
  it('returns matching category id for age and gender', () => {
    const birthDate = new Date('2015-06-15');
    expect(computeCategoryId(birthDate, 2025, 'G', categories)).toBe('u12-g');
  });

  it('returns null when no category id can match', () => {
    const birthDate = new Date('2015-06-15');
    expect(computeCategoryId(birthDate, 2025, 'H', categories)).toBeNull();
  });
});
