import { describe, it, expect } from 'vitest';
import { createPlayerSchema, updatePlayerSchema } from './playerSchema';

const validPlayer = {
  clubId: '550e8400-e29b-41d4-a716-446655440000',
  firstName: 'Andria',
  lastName: 'Naina',
  birthDate: '2010-05-15',
  gender: 'G' as const,
  address: '123 Rue Principale, Antananarivo',
};

describe('createPlayerSchema', () => {
  it('accepts a valid player', () => {
    const result = createPlayerSchema.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it('coerces birthDate string to Date', () => {
    const result = createPlayerSchema.parse(validPlayer);
    expect(result.birthDate).toBeInstanceOf(Date);
  });

  it('rejects missing firstName', () => {
    const result = createPlayerSchema.safeParse({ ...validPlayer, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid gender value', () => {
    const result = createPlayerSchema.safeParse({ ...validPlayer, gender: 'X' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid clubId format', () => {
    const result = createPlayerSchema.safeParse({ ...validPlayer, clubId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('accepts optional nullable fields', () => {
    const result = createPlayerSchema.safeParse({
      ...validPlayer,
      phone: null,
      email: null,
      photoUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = createPlayerSchema.safeParse({ ...validPlayer, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('updatePlayerSchema', () => {
  it('accepts a partial update', () => {
    const result = updatePlayerSchema.safeParse({ firstName: 'Rakoto' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object (all fields optional)', () => {
    const result = updatePlayerSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('does not accept clubId', () => {
    const result = updatePlayerSchema.safeParse({ clubId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('clubId');
  });
});
