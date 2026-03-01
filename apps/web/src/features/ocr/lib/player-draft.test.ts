import { describe, expect, it } from 'vitest';
import { preparePlayerInput } from './player-draft';

describe('preparePlayerInput', () => {
  it('returns ready result for valid data', () => {
    const result = preparePlayerInput(
      {
        firstName: '  Jean  ',
        lastName: ' Dupont ',
        birthDate: '2010-05-15',
        gender: 'g',
        address: ' 12 Rue de Paris ',
        phone: ' 0600000000 ',
        email: '  jean@example.com ',
      },
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      expect(result.data).toEqual({
        clubId: '11111111-1111-1111-1111-111111111111',
        firstName: 'Jean',
        lastName: 'Dupont',
        birthDate: '2010-05-15',
        gender: 'G',
        address: '12 Rue de Paris',
        phone: '0600000000',
        email: 'jean@example.com',
      });
    }
  });

  it('returns invalid for missing required fields', () => {
    const result = preparePlayerInput(
      {
        firstName: null,
        lastName: 'Dupont',
        birthDate: null,
        gender: null,
        address: null,
        phone: null,
        email: null,
      },
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') {
      expect(result.fields).toEqual(['firstName', 'birthDate', 'gender', 'address']);
    }
  });

  it('returns invalid for malformed email', () => {
    const result = preparePlayerInput(
      {
        firstName: 'Jean',
        lastName: 'Dupont',
        birthDate: '2010-05-15',
        gender: 'G',
        address: '12 Rue de Paris',
        phone: null,
        email: 'not-an-email',
      },
      '11111111-1111-1111-1111-111111111111',
    );

    expect(result).toEqual({ kind: 'invalid', fields: ['email'] });
  });
});
