import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { previewTemplate, uploadTemplate } from './templateApi';
import type { SpreadsheetPreview } from '@hoop/shared';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mockPreview: SpreadsheetPreview = {
  cells: [
    {
      row: 0,
      col: 0,
      value: 'Name',
      style: {
        bold: true,
        italic: false,
        fontSize: null,
        fontColor: null,
        backgroundColor: null,
        borderTop: false,
        borderBottom: false,
        borderLeft: false,
        borderRight: false,
        horizontalAlignment: null,
      },
      placeholder: null,
    },
  ],
  mergedCells: [],
  columnWidths: [64],
  rowCount: 1,
  colCount: 1,
};

describe('previewTemplate', () => {
  it('sends file as FormData and returns preview', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreview),
    });

    const file = new File(['test'], 'template.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const result = await previewTemplate('token-123', file);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/templates/preview');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ Authorization: 'Bearer token-123' });
    expect(options.body).toBeInstanceOf(FormData);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0].value).toBe('Name');
  });

  it('throws on failed preview', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Only .xlsx files can be previewed' }),
    });

    const file = new File(['test'], 'template.docx');
    await expect(previewTemplate('token', file)).rejects.toThrow('.xlsx');
  });
});

describe('uploadTemplate with cellMappings', () => {
  it('sends cellMappings as JSON field when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'tmpl-1',
          name: 'Test',
          format: 'xlsx',
          placeholders: ['{{playerFirstName}}'],
        }),
    });

    const file = new File(['test'], 'template.xlsx');
    const mappings = [{ row: 0, col: 0, value: '{{playerFirstName}}' }];
    const result = await uploadTemplate('token-123', file, 'Test', '', mappings);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = options.body as FormData;
    expect(body.get('cellMappings')).toBe(JSON.stringify(mappings));
    expect(result.id).toBe('tmpl-1');
  });

  it('does not include cellMappings when not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'tmpl-2',
          name: 'Test',
          format: 'xlsx',
          placeholders: [],
        }),
    });

    const file = new File(['test'], 'template.xlsx');
    await uploadTemplate('token-123', file, 'Test', '');

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = options.body as FormData;
    expect(body.get('cellMappings')).toBeNull();
  });
});
