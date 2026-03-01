import { describe, it, expect } from 'vitest';
import { spreadsheetPreviewSchema, cellMappingSchema } from './spreadsheetPreviewSchema';

describe('spreadsheetPreviewSchema', () => {
  it('parses a valid preview', () => {
    const input = {
      cells: [
        {
          row: 0,
          col: 0,
          value: 'Name',
          style: {
            bold: true,
            italic: false,
            fontSize: 12,
            fontColor: '#000000',
            backgroundColor: null,
            borderTop: true,
            borderBottom: true,
            borderLeft: false,
            borderRight: false,
            horizontalAlignment: 'center',
          },
          placeholder: null,
        },
      ],
      mergedCells: [{ startRow: 0, startCol: 0, endRow: 0, endCol: 1 }],
      columnWidths: [100, 80],
      rowCount: 1,
      colCount: 2,
    };

    const result = spreadsheetPreviewSchema.parse(input);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0].style.bold).toBe(true);
    expect(result.mergedCells).toHaveLength(1);
  });

  it('parses cells with placeholder', () => {
    const input = {
      cells: [
        {
          row: 0,
          col: 0,
          value: '{{playerFirstName}}',
          style: {
            bold: false,
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
          placeholder: '{{playerFirstName}}',
        },
      ],
      mergedCells: [],
      columnWidths: [64],
      rowCount: 1,
      colCount: 1,
    };

    const result = spreadsheetPreviewSchema.parse(input);
    expect(result.cells[0].placeholder).toBe('{{playerFirstName}}');
  });

  it('rejects invalid horizontalAlignment', () => {
    const input = {
      cells: [
        {
          row: 0,
          col: 0,
          value: '',
          style: {
            bold: false,
            italic: false,
            fontSize: null,
            fontColor: null,
            backgroundColor: null,
            borderTop: false,
            borderBottom: false,
            borderLeft: false,
            borderRight: false,
            horizontalAlignment: 'justify',
          },
          placeholder: null,
        },
      ],
      mergedCells: [],
      columnWidths: [],
      rowCount: 1,
      colCount: 1,
    };

    expect(() => spreadsheetPreviewSchema.parse(input)).toThrow();
  });
});

describe('cellMappingSchema', () => {
  it('parses a valid mapping', () => {
    const result = cellMappingSchema.parse({
      row: 2,
      col: 3,
      value: '{{playerLastName}}',
    });

    expect(result.row).toBe(2);
    expect(result.col).toBe(3);
    expect(result.value).toBe('{{playerLastName}}');
  });

  it('parses a mapping with multiple placeholders and free text', () => {
    const result = cellMappingSchema.parse({
      row: 0,
      col: 0,
      value: 'Nom: {{playerLastName}} {{playerFirstName}}',
    });
    expect(result.value).toBe('Nom: {{playerLastName}} {{playerFirstName}}');
  });

  it('rejects negative row', () => {
    expect(() =>
      cellMappingSchema.parse({ row: -1, col: 0, value: '{{test}}' }),
    ).toThrow();
  });
});
