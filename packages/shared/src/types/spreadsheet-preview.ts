export interface CellStyle {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly fontSize: number | null;
  readonly fontColor: string | null;
  readonly backgroundColor: string | null;
  readonly borderTop: boolean;
  readonly borderBottom: boolean;
  readonly borderLeft: boolean;
  readonly borderRight: boolean;
  readonly horizontalAlignment: 'left' | 'center' | 'right' | null;
}

export interface PreviewCell {
  readonly row: number;
  readonly col: number;
  readonly value: string;
  readonly style: CellStyle;
  readonly placeholder: string | null;
}

export interface MergedRegion {
  readonly startRow: number;
  readonly startCol: number;
  readonly endRow: number;
  readonly endCol: number;
}

export interface CellMapping {
  readonly row: number;
  readonly col: number;
  readonly value: string;
}

export interface SpreadsheetPreview {
  readonly cells: ReadonlyArray<PreviewCell>;
  readonly mergedCells: ReadonlyArray<MergedRegion>;
  readonly columnWidths: ReadonlyArray<number>;
  readonly rowCount: number;
  readonly colCount: number;
}
