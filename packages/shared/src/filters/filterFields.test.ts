import { describe, it, expect } from 'vitest';
import { playerFilterFields } from './playerFilterFields';
import { licenseFilterFields } from './licenseFilterFields';
import type { FilterFieldDefinition } from './filterFieldDefinition';

function assertValidRegistry(fields: ReadonlyArray<FilterFieldDefinition>) {
  it('has unique keys', () => {
    const keys = fields.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every entry has a non-empty label', () => {
    for (const field of fields) {
      expect(field.label.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a valid type', () => {
    const validTypes = new Set(['text', 'select', 'date', 'enum']);
    for (const field of fields) {
      expect(validTypes.has(field.type)).toBe(true);
    }
  });

  it('enum fields have at least one option', () => {
    for (const field of fields) {
      if (field.type === 'enum') {
        expect(field.options).toBeDefined();
        expect(field.options!.length).toBeGreaterThan(0);
      }
    }
  });

  it('select fields without static options are expected to use dynamicOptions', () => {
    for (const field of fields) {
      if (field.type === 'select' && !field.options) {
        expect(field.key).toBeTruthy();
      }
    }
  });
}

describe('playerFilterFields', () => {
  assertValidRegistry(playerFilterFields);

  it('includes search, gender, category, date, and seasonId fields', () => {
    const keys = playerFilterFields.map((f) => f.key);
    expect(keys).toContain('search');
    expect(keys).toContain('gender');
    expect(keys).toContain('category');
    expect(keys).toContain('birthDateFrom');
    expect(keys).toContain('birthDateTo');
    expect(keys).toContain('seasonId');
  });
});

describe('licenseFilterFields', () => {
  assertValidRegistry(licenseFilterFields);

  it('includes all expected filter fields', () => {
    const keys = licenseFilterFields.map((f) => f.key);
    expect(keys).toContain('seasonId');
    expect(keys).toContain('status');
    expect(keys).toContain('category');
    expect(keys).toContain('number');
    expect(keys).toContain('endDateFrom');
    expect(keys).toContain('endDateTo');
    expect(keys).toContain('startDateFrom');
    expect(keys).toContain('startDateTo');
  });

  it('status field has active and expired options', () => {
    const statusField = licenseFilterFields.find((f) => f.key === 'status');
    expect(statusField).toBeDefined();
    expect(statusField!.options).toEqual([
      { value: 'active', label: 'Active' },
      { value: 'expired', label: 'Expired' },
    ]);
  });
});
