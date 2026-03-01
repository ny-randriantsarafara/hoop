import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { writePlaceholdersToXlsx } from './xlsxPlaceholderWriter';
import type { CellMapping } from '@hoop/shared';

async function createTestWorkbook(
  setup: (sheet: ExcelJS.Worksheet) => void,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  setup(sheet);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

async function readCellValue(buffer: Buffer, row: number, col: number): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<ExcelJS.Workbook['xlsx']['load']>[0]);
  const sheet = workbook.worksheets[0];
  const cell = sheet.getRow(row + 1).getCell(col + 1);
  return typeof cell.value === 'string' ? cell.value : String(cell.value ?? '');
}

describe('writePlaceholdersToXlsx', () => {
  it('writes placeholder values into specified cells', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      sheet.addRow(['Name', 'Age']);
      sheet.addRow(['Alice', '30']);
    });

    const mappings: CellMapping[] = [
      { row: 1, col: 0, placeholder: '{{playerFirstName}}' },
      { row: 1, col: 1, placeholder: '{{playerBirthDate}}' },
    ];

    const result = await writePlaceholdersToXlsx(buffer, mappings);

    expect(await readCellValue(result, 1, 0)).toBe('{{playerFirstName}}');
    expect(await readCellValue(result, 1, 1)).toBe('{{playerBirthDate}}');
    expect(await readCellValue(result, 0, 0)).toBe('Name');
  });

  it('preserves existing cell values for unmapped cells', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      sheet.addRow(['Header1', 'Header2', 'Header3']);
    });

    const mappings: CellMapping[] = [
      { row: 0, col: 1, placeholder: '{{clubName}}' },
    ];

    const result = await writePlaceholdersToXlsx(buffer, mappings);

    expect(await readCellValue(result, 0, 0)).toBe('Header1');
    expect(await readCellValue(result, 0, 1)).toBe('{{clubName}}');
    expect(await readCellValue(result, 0, 2)).toBe('Header3');
  });

  it('handles empty mappings without modifying the file', async () => {
    const buffer = await createTestWorkbook((sheet) => {
      sheet.addRow(['Original']);
    });

    const result = await writePlaceholdersToXlsx(buffer, []);

    expect(await readCellValue(result, 0, 0)).toBe('Original');
  });

  it('throws when workbook has no worksheets', async () => {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await expect(
      writePlaceholdersToXlsx(buffer, [{ row: 0, col: 0, placeholder: '{{test}}' }]),
    ).rejects.toThrow('Workbook has no worksheets');
  });
});
