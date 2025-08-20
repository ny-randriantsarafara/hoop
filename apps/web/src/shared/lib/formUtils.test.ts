import { describe, it, expect } from 'vitest';
import { getFormString } from './formUtils';

describe('getFormString', () => {
  it('returns the string value for a given key', () => {
    const formData = new FormData();
    formData.set('name', 'Andria');

    expect(getFormString(formData, 'name')).toBe('Andria');
  });

  it('returns empty string for a missing key', () => {
    const formData = new FormData();

    expect(getFormString(formData, 'missing')).toBe('');
  });

  it('returns empty string for a File value', () => {
    const formData = new FormData();
    formData.set('file', new Blob(['content']), 'test.txt');

    expect(getFormString(formData, 'file')).toBe('');
  });
});
