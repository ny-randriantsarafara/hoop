import ExcelJS from 'exceljs';
import { allPlaceholders } from '@hoop/shared';
import type {
  SpreadsheetPreview,
  PreviewCell,
  CellStyle,
  MergedRegion,
} from '@hoop/shared';

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;

const CELL_REF_REGEX = /^([A-Z]+)(\d+)$/;

function parseCellRef(ref: string): { row: number; col: number } | null {
  const match = CELL_REF_REGEX.exec(ref);
  if (!match) return null;

  const letters = match[1];
  const rowNumber = parseInt(match[2], 10);

  let colNumber = 0;
  for (let i = 0; i < letters.length; i++) {
    colNumber = colNumber * 26 + (letters.charCodeAt(i) - 64);
  }

  return { row: rowNumber - 1, col: colNumber - 1 };
}

const DEFAULT_COLUMN_WIDTH = 64;

function extractCellStyle(cell: ExcelJS.Cell): CellStyle {
  const font = cell.font ?? {};
  const border = cell.border ?? {};
  const alignment = cell.alignment ?? {};
  const fill = cell.fill;

  let backgroundColor: string | null = null;
  if (fill && fill.type === 'pattern' && fill.fgColor?.argb) {
    backgroundColor = `#${fill.fgColor.argb.slice(2)}`;
  }

  let fontColor: string | null = null;
  if (font.color?.argb) {
    fontColor = `#${font.color.argb.slice(2)}`;
  }

  const horizontal = alignment.horizontal;
  const normalizedAlignment =
    horizontal === 'left' || horizontal === 'center' || horizontal === 'right'
      ? horizontal
      : null;

  return {
    bold: font.bold === true,
    italic: font.italic === true,
    fontSize: typeof font.size === 'number' ? font.size : null,
    fontColor,
    backgroundColor,
    borderTop: border.top !== undefined,
    borderBottom: border.bottom !== undefined,
    borderLeft: border.left !== undefined,
    borderRight: border.right !== undefined,
    horizontalAlignment: normalizedAlignment,
  };
}

function cellValueToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map((part) => part.text).join('');
  }
  if (typeof value === 'object' && 'text' in value) {
    return String(value.text);
  }
  return String(value);
}

function detectPlaceholder(cellText: string): string | null {
  PLACEHOLDER_REGEX.lastIndex = 0;
  const match = PLACEHOLDER_REGEX.exec(cellText);
  if (!match) return null;

  const placeholder = `{{${match[1]}}}`;
  if ((allPlaceholders as readonly string[]).includes(placeholder)) {
    return placeholder;
  }
  return null;
}

export async function parseXlsxForPreview(buffer: Buffer): Promise<SpreadsheetPreview> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<ExcelJS.Workbook['xlsx']['load']>[0]);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { cells: [], mergedCells: [], columnWidths: [], rowCount: 0, colCount: 0 };
  }

  const cells: PreviewCell[] = [];
  let maxCol = 0;
  let maxRow = 0;

  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const rowIndex = rowNumber - 1;
    if (rowIndex > maxRow) maxRow = rowIndex;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colIndex = colNumber - 1;
      if (colIndex > maxCol) maxCol = colIndex;

      const value = cellValueToString(cell.value);
      const style = extractCellStyle(cell);
      const placeholder = detectPlaceholder(value);

      cells.push({ row: rowIndex, col: colIndex, value, style, placeholder });
    });
  });

  const columnWidths: number[] = [];
  for (let i = 0; i <= maxCol; i++) {
    const column = sheet.getColumn(i + 1);
    const width = typeof column.width === 'number' ? Math.round(column.width * 7) : DEFAULT_COLUMN_WIDTH;
    columnWidths.push(width);
  }

  const mergedCells: MergedRegion[] = [];
  const mergeRanges = sheet.model.merges ?? [];
  for (const rangeRef of mergeRanges) {
    const parts = rangeRef.split(':');
    if (parts.length !== 2) continue;

    const topLeft = parseCellRef(parts[0]);
    const bottomRight = parseCellRef(parts[1]);
    if (!topLeft || !bottomRight) continue;

    mergedCells.push({
      startRow: topLeft.row,
      startCol: topLeft.col,
      endRow: bottomRight.row,
      endCol: bottomRight.col,
    });
  }

  return {
    cells,
    mergedCells,
    columnWidths,
    rowCount: maxRow + 1,
    colCount: maxCol + 1,
  };
}
