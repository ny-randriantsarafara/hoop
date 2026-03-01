import { describe, it, expect } from 'vitest';
import {
  placeholderRegistry,
  documentPlaceholders,
  playerRowPlaceholders,
  allPlaceholders,
} from './templatePlaceholders';

describe('placeholderRegistry', () => {
  it('has unique keys across all entries', () => {
    const keys = placeholderRegistry.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every entry has a non-empty label and description', () => {
    for (const entry of placeholderRegistry) {
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('every key follows the {{name}} format', () => {
    for (const entry of placeholderRegistry) {
      expect(entry.key).toMatch(/^\{\{\w+\}\}$/);
    }
  });

  it('every entry has a valid scope', () => {
    const validScopes = new Set(['document', 'player']);
    for (const entry of placeholderRegistry) {
      expect(validScopes.has(entry.scope)).toBe(true);
    }
  });
});

describe('derived placeholder arrays', () => {
  it('documentPlaceholders contains only document-scoped entries', () => {
    const documentKeys = placeholderRegistry
      .filter((p) => p.scope === 'document')
      .map((p) => p.key);
    expect(documentPlaceholders).toEqual(documentKeys);
  });

  it('playerRowPlaceholders contains only player-scoped entries', () => {
    const playerKeys = placeholderRegistry.filter((p) => p.scope === 'player').map((p) => p.key);
    expect(playerRowPlaceholders).toEqual(playerKeys);
  });

  it('allPlaceholders is the union of document and player placeholders', () => {
    expect(allPlaceholders).toEqual([...documentPlaceholders, ...playerRowPlaceholders]);
  });

  it('includes the original player placeholders', () => {
    const expectedOriginals = [
      '{{order}}',
      '{{playerLastName}}',
      '{{playerFirstName}}',
      '{{playerBirthDate}}',
      '{{playerGender}}',
      '{{playerAddress}}',
      '{{playerCategory}}',
    ];
    for (const key of expectedOriginals) {
      expect(playerRowPlaceholders).toContain(key);
    }
  });

  it('includes the new licence placeholders', () => {
    const newLicensePlaceholders = [
      '{{licenseNumber}}',
      '{{licenseStatus}}',
      '{{licenseStartDate}}',
      '{{licenseEndDate}}',
      '{{licenseCategory}}',
    ];
    for (const key of newLicensePlaceholders) {
      expect(playerRowPlaceholders).toContain(key);
    }
  });

  it('includes the new player contact placeholders', () => {
    expect(playerRowPlaceholders).toContain('{{playerPhone}}');
    expect(playerRowPlaceholders).toContain('{{playerEmail}}');
  });
});
