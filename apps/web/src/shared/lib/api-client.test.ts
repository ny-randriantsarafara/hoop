import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './api-client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.NEXT_PUBLIC_API_URL;
});

describe('apiClient', () => {
  it('makes a GET request with correct URL without Content-Type header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const result = await apiClient('/players');

    expect(mockFetch).toHaveBeenCalledWith('/api/players', expect.any(Object));
    // GET requests should not have Content-Type header (no body)
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(result).toEqual({ data: 'test' });
  });

  it('uses NEXT_PUBLIC_API_URL when provided', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api';

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    await apiClient('/players');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/players', expect.any(Object));
  });

  it('includes Content-Type header only when body is present', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: '123' }),
    });

    await apiClient('/players', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Ada' }),
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('includes authorization header when token is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await apiClient('/players', { token: 'jwt-token' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    });

    await expect(apiClient('/protected')).rejects.toThrow('Forbidden');
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
    });

    const result = await apiClient('/resource');
    expect(result).toBeUndefined();
  });

  it('handles json parse failure on error response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });

    await expect(apiClient('/broken')).rejects.toThrow('Request failed');
  });
});
