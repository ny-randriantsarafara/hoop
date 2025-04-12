import { describe, it, expect } from 'vitest';
import { createSeasonSchema, updateSeasonSchema } from './seasonSchema';

describe('createSeasonSchema', () => {
  it('accepts a valid season', () => {
    const result = createSeasonSchema.safeParse({
      label: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-06-30',
      active: true,
    });
    expect(result.success).toBe(true);
  });

  it('defaults active to false', () => {
    const result = createSeasonSchema.parse({
      label: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-06-30',
    });
    expect(result.active).toBe(false);
  });

  it('rejects empty label', () => {
    const result = createSeasonSchema.safeParse({
      label: '',
      startDate: '2025-09-01',
      endDate: '2026-06-30',
    });
    expect(result.success).toBe(false);
  });

  it('rejects label exceeding 10 characters', () => {
    const result = createSeasonSchema.safeParse({
      label: '12345678901',
      startDate: '2025-09-01',
      endDate: '2026-06-30',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateSeasonSchema', () => {
  it('accepts partial updates', () => {
    const result = updateSeasonSchema.safeParse({ label: '2026' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object', () => {
    const result = updateSeasonSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
