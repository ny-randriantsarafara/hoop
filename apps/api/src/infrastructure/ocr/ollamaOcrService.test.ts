import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSupportedMimeType,
  OcrConnectionError,
  OcrExtractionError,
  createOllamaOcrService,
} from './ollamaOcrService';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isSupportedMimeType', () => {
  it('accepts JPEG', () => {
    expect(isSupportedMimeType('image/jpeg')).toBe(true);
  });

  it('accepts PNG', () => {
    expect(isSupportedMimeType('image/png')).toBe(true);
  });

  it('accepts WebP', () => {
    expect(isSupportedMimeType('image/webp')).toBe(true);
  });

  it('accepts PDF', () => {
    expect(isSupportedMimeType('application/pdf')).toBe(true);
  });

  it('rejects text/plain', () => {
    expect(isSupportedMimeType('text/plain')).toBe(false);
  });

  it('rejects application/json', () => {
    expect(isSupportedMimeType('application/json')).toBe(false);
  });

  it('rejects image/gif', () => {
    expect(isSupportedMimeType('image/gif')).toBe(false);
  });
});

describe('OcrConnectionError', () => {
  it('has the correct message and is instanceof Error', () => {
    const error = new OcrConnectionError();
    expect(error.message).toBe('OCR service is unreachable. Ensure Ollama is running.');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('OcrExtractionError', () => {
  it('preserves the provided message and is instanceof Error', () => {
    const error = new OcrExtractionError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('createOllamaOcrService', () => {
  const validOllamaResponse = {
    response: JSON.stringify({
      confidence: 'high',
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
        number: 'LIC-2025-001',
        category: 'U14',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      },
    }),
  };

  it('sends correct request to Ollama and parses response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(validOllamaResponse),
    });

    const service = createOllamaOcrService('http://localhost:11434', 'gemma3');
    const result = await service.extract(Buffer.from('fake-image'), 'image/jpeg');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/api/generate');
    expect(JSON.parse(options.body as string)).toMatchObject({
      model: 'gemma3',
      stream: false,
    });
    expect(result.confidence).toBe('high');
    expect(result.player.firstName).toBe('Jean');
  });

  it('throws OcrConnectionError when fetch rejects', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

    const service = createOllamaOcrService('http://localhost:11434', 'gemma3');

    await expect(
      service.extract(Buffer.from('fake'), 'image/jpeg'),
    ).rejects.toThrow(OcrConnectionError);
  });

  it('throws OcrExtractionError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('model not found'),
    });

    const service = createOllamaOcrService('http://localhost:11434', 'gemma3');

    await expect(
      service.extract(Buffer.from('fake'), 'image/jpeg'),
    ).rejects.toThrow(OcrExtractionError);
  });

  it('throws OcrExtractionError on unexpected response shape', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ unexpected: true }),
    });

    const service = createOllamaOcrService('http://localhost:11434', 'gemma3');

    await expect(
      service.extract(Buffer.from('fake'), 'image/jpeg'),
    ).rejects.toThrow(OcrExtractionError);
  });
});
