import { describe, expect, it } from 'vitest';
import { createCategorySchema, updateCategorySchema } from './category-schema';

describe('createCategorySchema', () => {
  it('parses valid category payload', () => {
    const parsed = createCategorySchema.parse({
      name: 'U12',
      gender: 'F',
      minAge: 11,
      maxAge: 12,
      displayOrder: 2,
    });

    expect(parsed).toEqual({
      name: 'U12',
      gender: 'F',
      minAge: 11,
      maxAge: 12,
      displayOrder: 2,
    });
  });

  it('rejects invalid gender value', () => {
    expect(() =>
      createCategorySchema.parse({
        name: 'U12',
        gender: 'X',
        minAge: 11,
        maxAge: 12,
      }),
    ).toThrow();
  });
});

describe('updateCategorySchema', () => {
  it('accepts partial payload', () => {
    const parsed = updateCategorySchema.parse({ name: 'U14' });
    expect(parsed).toEqual({ name: 'U14' });
  });
});
