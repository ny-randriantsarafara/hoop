import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractDocument, saveValidatedData } from './ocrApi';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extractDocument', () => {
  it('sends file as FormData and returns extraction response', async () => {
    const mockResponse = {
      extractionId: 'ext-1',
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
        number: null,
        category: null,
        startDate: null,
        endDate: null,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const file = new File(['test'], 'doc.jpg', { type: 'image/jpeg' });
    const result = await extractDocument('token-123', file);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/ocr/extract');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ Authorization: 'Bearer token-123' });
    expect(options.body).toBeInstanceOf(FormData);
    expect(result.extractionId).toBe('ext-1');
    expect(result.player.firstName).toBe('Jean');
  });

  it('throws on 503 not configured', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: 'OCR not configured' }),
    });

    const file = new File(['test'], 'doc.jpg', { type: 'image/jpeg' });

    await expect(extractDocument('token', file)).rejects.toThrow('not configured');
  });
});

describe('saveValidatedData', () => {
  it('sends PATCH request with validated data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

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

    const result = await saveValidatedData('token-123', 'ext-1', input);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/ocr/extractions/ext-1');
    expect(options.method).toBe('PATCH');
    expect(result).toEqual({ success: true });
  });
});
