import { describe, it, expect } from 'vitest';
import {
  ocrExtractionResultSchema,
  ocrExtractionResponseSchema,
  validateExtractionSchema,
} from './ocrSchema';

describe('ocrExtractionResultSchema', () => {
  it('parses a complete extraction result', () => {
    const input = {
      confidence: 'high',
      player: {
        firstName: 'Jean',
        lastName: 'Dupont',
        birthDate: '2010-05-15',
        gender: 'G',
        address: '12 Rue de Paris',
        phone: '0612345678',
        email: 'jean@example.com',
      },
      license: {
        number: 'LIC-001',
        category: 'U14',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      },
    };

    const result = ocrExtractionResultSchema.parse(input);
    expect(result.confidence).toBe('high');
    expect(result.player.firstName).toBe('Jean');
    expect(result.license.number).toBe('LIC-001');
  });

  it('parses a result with all null fields', () => {
    const input = {
      confidence: 'low',
      player: {
        firstName: null,
        lastName: null,
        birthDate: null,
        gender: null,
        address: null,
        phone: null,
        email: null,
      },
      license: {
        number: null,
        category: null,
        startDate: null,
        endDate: null,
      },
    };

    const result = ocrExtractionResultSchema.parse(input);
    expect(result.confidence).toBe('low');
    expect(result.player.firstName).toBeNull();
  });

  it('rejects invalid confidence value', () => {
    const input = {
      confidence: 'unknown',
      player: { firstName: null, lastName: null, birthDate: null, gender: null, address: null, phone: null, email: null },
      license: { number: null, category: null, startDate: null, endDate: null },
    };

    expect(() => ocrExtractionResultSchema.parse(input)).toThrow();
  });

  it('rejects missing player object', () => {
    const input = {
      confidence: 'high',
      license: { number: null, category: null, startDate: null, endDate: null },
    };

    expect(() => ocrExtractionResultSchema.parse(input)).toThrow();
  });
});

describe('ocrExtractionResponseSchema', () => {
  it('requires extractionId on top of extraction result', () => {
    const input = {
      extractionId: '550e8400-e29b-41d4-a716-446655440000',
      confidence: 'medium',
      player: { firstName: 'Marie', lastName: null, birthDate: null, gender: null, address: null, phone: null, email: null },
      license: { number: null, category: null, startDate: null, endDate: null },
    };

    const result = ocrExtractionResponseSchema.parse(input);
    expect(result.extractionId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.player.firstName).toBe('Marie');
  });

  it('rejects non-UUID extractionId', () => {
    const input = {
      extractionId: 'not-a-uuid',
      confidence: 'high',
      player: { firstName: null, lastName: null, birthDate: null, gender: null, address: null, phone: null, email: null },
      license: { number: null, category: null, startDate: null, endDate: null },
    };

    expect(() => ocrExtractionResponseSchema.parse(input)).toThrow();
  });
});

describe('validateExtractionSchema', () => {
  it('parses valid validation input', () => {
    const input = {
      validatedData: {
        player: {
          firstName: 'Jean',
          lastName: 'Dupont',
          birthDate: '2010-05-15',
          gender: 'G',
          address: '12 Rue de Paris',
          phone: null,
          email: null,
        },
        license: {
          number: null,
          category: null,
          startDate: null,
          endDate: null,
        },
      },
    };

    const result = validateExtractionSchema.parse(input);
    expect(result.validatedData.player.firstName).toBe('Jean');
  });

  it('rejects missing validatedData', () => {
    expect(() => validateExtractionSchema.parse({})).toThrow();
  });
});
