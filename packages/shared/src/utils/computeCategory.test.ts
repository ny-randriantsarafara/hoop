import { describe, it, expect } from 'vitest';
import { computeCategory, type CategoryDefinition } from './computeCategory';

const categories: ReadonlyArray<CategoryDefinition> = [
  { name: 'U10', minAge: 0, maxAge: 9 },
  { name: 'U12', minAge: 10, maxAge: 11 },
  { name: 'U14', minAge: 12, maxAge: 13 },
  { name: 'U16', minAge: 14, maxAge: 15 },
  { name: 'U18', minAge: 16, maxAge: 17 },
  { name: 'Senior', minAge: 18, maxAge: null },
];

describe('computeCategory', () => {
  it('returns the matching category for a given age', () => {
    const birthDate = new Date('2015-06-15');
    expect(computeCategory(birthDate, 2025, categories)).toBe('U12');
  });

  it('returns U10 for a very young player', () => {
    const birthDate = new Date('2020-01-01');
    expect(computeCategory(birthDate, 2025, categories)).toBe('U10');
  });

  it('returns Senior for an adult player', () => {
    const birthDate = new Date('2000-03-20');
    expect(computeCategory(birthDate, 2025, categories)).toBe('Senior');
  });

  it('handles the boundary between two categories', () => {
    const birthDate = new Date('2012-01-01');
    expect(computeCategory(birthDate, 2025, categories)).toBe('U14');
  });

  it('handles maxAge null (open-ended Senior)', () => {
    const birthDate = new Date('1960-01-01');
    expect(computeCategory(birthDate, 2025, categories)).toBe('Senior');
  });

  it('returns Unknown when no category matches', () => {
    const gappedCategories: ReadonlyArray<CategoryDefinition> = [
      { name: 'U10', minAge: 0, maxAge: 9 },
      { name: 'Senior', minAge: 18, maxAge: null },
    ];
    const birthDate = new Date('2012-01-01');
    expect(computeCategory(birthDate, 2025, gappedCategories)).toBe('Unknown');
  });

  it('returns Unknown when categories array is empty', () => {
    const birthDate = new Date('2010-01-01');
    expect(computeCategory(birthDate, 2025, [])).toBe('Unknown');
  });

  it('uses age based on birth year only (not month/day)', () => {
    const earlyBirth = new Date('2015-01-01');
    const lateBirth = new Date('2015-12-31');
    expect(computeCategory(earlyBirth, 2025, categories)).toBe('U12');
    expect(computeCategory(lateBirth, 2025, categories)).toBe('U12');
  });
});
