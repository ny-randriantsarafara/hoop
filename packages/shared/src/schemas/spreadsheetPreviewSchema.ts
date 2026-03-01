import { z } from 'zod';

const cellStyleSchema = z.object({
  bold: z.boolean(),
  italic: z.boolean(),
  fontSize: z.number().nullable(),
  fontColor: z.string().nullable(),
  backgroundColor: z.string().nullable(),
  borderTop: z.boolean(),
  borderBottom: z.boolean(),
  borderLeft: z.boolean(),
  borderRight: z.boolean(),
  horizontalAlignment: z.enum(['left', 'center', 'right']).nullable(),
});

const previewCellSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  value: z.string(),
  style: cellStyleSchema,
  placeholder: z.string().nullable(),
});

const mergedRegionSchema = z.object({
  startRow: z.number().int().min(0),
  startCol: z.number().int().min(0),
  endRow: z.number().int().min(0),
  endCol: z.number().int().min(0),
});

export const cellMappingSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  value: z.string(),
});

export const spreadsheetPreviewSchema = z.object({
  cells: z.array(previewCellSchema),
  mergedCells: z.array(mergedRegionSchema),
  columnWidths: z.array(z.number()),
  rowCount: z.number().int().min(0),
  colCount: z.number().int().min(0),
});

export type SpreadsheetPreviewInput = z.infer<typeof spreadsheetPreviewSchema>;
export type CellMappingInput = z.infer<typeof cellMappingSchema>;
