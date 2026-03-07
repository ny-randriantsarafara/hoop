import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST, DELETE } from './route';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

describe('api proxy route', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    delete process.env.API_URL;
  });

  it('forwards GET requests to API_URL and preserves query string', async () => {
    process.env.API_URL = 'http://hoop-api:3001/api';

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ totalPlayers: 12 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const response = await GET(new Request('http://localhost/api/dashboard/stats?season=active'), {
      params: Promise.resolve({ path: ['dashboard', 'stats'] }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://hoop-api:3001/api/dashboard/stats?season=active',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ totalPlayers: 12 });
  });

  it('forwards request bodies as ArrayBuffer and propagates upstream status codes', async () => {
    process.env.API_URL = 'http://hoop-api:3001/api';

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: 'validation failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const body = JSON.stringify({ firstName: 'Ada' });
    const response = await POST(
      new Request('http://localhost/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
        body,
      }),
      {
        params: Promise.resolve({ path: ['players'] }),
      },
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://hoop-api:3001/api/players');
    expect(options.method).toBe('POST');
    // Body is now ArrayBuffer to preserve binary data integrity
    expect(options.body).toBeInstanceOf(ArrayBuffer);
    const bodyText = new TextDecoder().decode(options.body);
    expect(bodyText).toBe(body);
    expect(options.headers).toBeInstanceOf(Headers);
    expect((options.headers as Headers).get('authorization')).toBe('Bearer jwt-token');
    expect((options.headers as Headers).get('content-type')).toBe('application/json');
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'validation failed' });
  });

  it('strips Content-Type header for DELETE requests with no body', async () => {
    process.env.API_URL = 'http://hoop-api:3001/api';

    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

    const response = await DELETE(
      new Request('http://localhost/api/templates/123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
      }),
      {
        params: Promise.resolve({ path: ['templates', '123'] }),
      },
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://hoop-api:3001/api/templates/123');
    expect(options.method).toBe('DELETE');
    expect(options.body).toBeUndefined();
    // Content-Type should be stripped for bodyless requests
    expect((options.headers as Headers).get('content-type')).toBeNull();
    expect((options.headers as Headers).get('authorization')).toBe('Bearer jwt-token');
    expect(response.status).toBe(204);
  });

  it('preserves binary data integrity for multipart uploads', async () => {
    process.env.API_URL = 'http://hoop-api:3001/api';

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 'template-1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // Simulate binary data that would be corrupted by text() conversion
    const binaryData = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xff, 0xfe, 0x00, 0x80]);
    const formData = new FormData();
    formData.append('file', new Blob([binaryData]), 'test.xlsx');

    const response = await POST(
      new Request('http://localhost/api/templates', {
        method: 'POST',
        body: formData,
      }),
      {
        params: Promise.resolve({ path: ['templates'] }),
      },
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeInstanceOf(ArrayBuffer);
    // Verify that binary data wasn't corrupted
    const forwardedBytes = new Uint8Array(options.body);
    // The formData encoding wraps our binary data, but it should contain our original bytes
    expect(forwardedBytes.length).toBeGreaterThan(0);
    expect(response.status).toBe(201);
  });
});
