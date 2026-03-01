import ExcelJS from 'exceljs';
import type { CellMapping } from '@hoop/shared';

export async function writePlaceholdersToXlsx(
  buffer: Buffer,
  mappings: ReadonlyArray<CellMapping>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<ExcelJS.Workbook['xlsx']['load']>[0]);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Workbook has no worksheets');
  }

  for (const mapping of mappings) {
    const row = sheet.getRow(mapping.row + 1);
    const cell = row.getCell(mapping.col + 1);
    cell.value = mapping.value;
  }

  const outputBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(outputBuffer);
}
