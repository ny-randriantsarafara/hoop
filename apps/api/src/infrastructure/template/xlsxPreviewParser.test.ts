import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { parseXlsxForPreview } from './xlsxPreviewParser';

async function createTestWorkbook(
  setup: (sheet: ExcelJS.Worksheet) => void,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  setup(sheet);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

describe('parseXlsxForPreview', () => {
  it('parses cell values from a simple spreadsheet', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      sheet.addRow(['Name', 'Age']);
      sheet.addRow(['Alice', 30]);
    });

    const preview = await parseXlsxForPreview(buffer);

    expect(preview.rowCount).toBe(2);
    expect(preview.colCount).toBe(2);

    const nameCell = preview.cells.find((c) => c.row === 0 && c.col === 0);
    expect(nameCell?.value).toBe('Name');

    const ageCell = preview.cells.find((c) => c.row === 0 && c.col === 1);
    expect(ageCell?.value).toBe('Age');

    const aliceCell = preview.cells.find((c) => c.row === 1 && c.col === 0);
    expect(aliceCell?.value).toBe('Alice');

    const thirtyCell = preview.cells.find((c) => c.row === 1 && c.col === 1);
    expect(thirtyCell?.value).toBe('30');
  });

  it('detects known placeholders in cells', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      sheet.addRow(['{{playerFirstName}}', '{{playerLastName}}']);
      sheet.addRow(['{{unknownPlaceholder}}', 'plain text']);
    });

    const preview = await parseXlsxForPreview(buffer);

    const firstNameCell = preview.cells.find((c) => c.row === 0 && c.col === 0);
    expect(firstNameCell?.placeholder).toBe('{{playerFirstName}}');

    const lastNameCell = preview.cells.find((c) => c.row === 0 && c.col === 1);
    expect(lastNameCell?.placeholder).toBe('{{playerLastName}}');

    const unknownCell = preview.cells.find((c) => c.row === 1 && c.col === 0);
    expect(unknownCell?.placeholder).toBeNull();

    const plainCell = preview.cells.find((c) => c.row === 1 && c.col === 1);
    expect(plainCell?.placeholder).toBeNull();
  });

  it('extracts bold and italic styles', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      const row = sheet.addRow(['Bold', 'Italic']);
      row.getCell(1).font = { bold: true };
      row.getCell(2).font = { italic: true };
    });

    const preview = await parseXlsxForPreview(buffer);

    const boldCell = preview.cells.find((c) => c.row === 0 && c.col === 0);
    expect(boldCell?.style.bold).toBe(true);
    expect(boldCell?.style.italic).toBe(false);

    const italicCell = preview.cells.find((c) => c.row === 0 && c.col === 1);
    expect(italicCell?.style.italic).toBe(true);
    expect(italicCell?.style.bold).toBe(false);
  });

  it('extracts border information', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      const row = sheet.addRow(['Bordered']);
      row.getCell(1).border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    const preview = await parseXlsxForPreview(buffer);

    const cell = preview.cells.find((c) => c.row === 0 && c.col === 0);
    expect(cell?.style.borderTop).toBe(true);
    expect(cell?.style.borderBottom).toBe(true);
    expect(cell?.style.borderLeft).toBe(true);
    expect(cell?.style.borderRight).toBe(true);
  });

  it('extracts column widths', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      sheet.getColumn(1).width = 20;
      sheet.getColumn(2).width = 10;
      sheet.addRow(['Wide', 'Narrow']);
    });

    const preview = await parseXlsxForPreview(buffer);

    expect(preview.columnWidths).toHaveLength(2);
    expect(preview.columnWidths[0]).toBe(140);
    expect(preview.columnWidths[1]).toBe(70);
  });

  it('detects merged cells', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      sheet.addRow(['Merged', '', 'Other']);
      sheet.mergeCells('A1:B1');
    });

    const preview = await parseXlsxForPreview(buffer);

    expect(preview.mergedCells).toHaveLength(1);
    expect(preview.mergedCells[0]).toEqual({
      startRow: 0,
      startCol: 0,
      endRow: 0,
      endCol: 1,
    });
  });

  it('returns empty preview for a workbook with no sheets', async () => {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const preview = await parseXlsxForPreview(buffer);

    expect(preview.cells).toEqual([]);
    expect(preview.rowCount).toBe(0);
    expect(preview.colCount).toBe(0);
  });

  it('detects document-level placeholders', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      sheet.addRow(['Season: {{seasonLabel}}']);
      sheet.addRow(['Club: {{clubName}}']);
    });

    const preview = await parseXlsxForPreview(buffer);

    const seasonCell = preview.cells.find((c) => c.row === 0 && c.col === 0);
    expect(seasonCell?.placeholder).toBe('{{seasonLabel}}');

    const clubCell = preview.cells.find((c) => c.row === 1 && c.col === 0);
    expect(clubCell?.placeholder).toBe('{{clubName}}');
  });
});
