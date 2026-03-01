'use client';

import { useMemo } from 'react';
import type { SpreadsheetPreview, CellMapping, CellStyle } from '@hoop/shared';
import { SpreadsheetCell } from './SpreadsheetCell';

interface SpreadsheetGridProps {
  readonly preview: SpreadsheetPreview;
  readonly cellMappings: ReadonlyArray<CellMapping>;
  readonly selectedCell: { row: number; col: number } | null;
  readonly onCellClick: (row: number, col: number) => void;
}

function columnLabel(index: number): string {
  let label = '';
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function SpreadsheetGrid({
  preview,
  cellMappings,
  selectedCell,
  onCellClick,
}: SpreadsheetGridProps) {
  const cellLookup = useMemo(() => {
    const map = new Map<string, (typeof preview.cells)[number]>();
    for (const cell of preview.cells) {
      map.set(`${cell.row}:${cell.col}`, cell);
    }
    return map;
  }, [preview.cells]);

  const mappingLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const mapping of cellMappings) {
      map.set(`${mapping.row}:${mapping.col}`, mapping.value);
    }
    return map;
  }, [cellMappings]);

  const mergedLookup = useMemo(() => {
    const hidden = new Set<string>();
    const spans = new Map<string, { rowSpan: number; colSpan: number }>();

    for (const region of preview.mergedCells) {
      spans.set(`${region.startRow}:${region.startCol}`, {
        rowSpan: region.endRow - region.startRow + 1,
        colSpan: region.endCol - region.startCol + 1,
      });

      for (let r = region.startRow; r <= region.endRow; r++) {
        for (let c = region.startCol; c <= region.endCol; c++) {
          if (r !== region.startRow || c !== region.startCol) {
            hidden.add(`${r}:${c}`);
          }
        }
      }
    }

    return { hidden, spans };
  }, [preview.mergedCells]);

  const defaultStyle: CellStyle = {
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
  };

  return (
    <div className="overflow-auto rounded-md border bg-background">
      <table role="grid" className="border-collapse">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-20 bg-muted px-2 py-1 text-xs text-muted-foreground border-b border-r min-w-[40px]" />
            {Array.from({ length: preview.colCount }, (_, col) => (
              <th
                key={col}
                className="sticky top-0 z-10 bg-muted px-2 py-1 text-xs font-medium text-muted-foreground border-b"
                style={{ minWidth: preview.columnWidths[col] ?? 64 }}
              >
                {columnLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: preview.rowCount }, (_, row) => (
            <tr key={row}>
              <td className="sticky left-0 z-10 bg-muted px-2 py-1 text-xs text-muted-foreground text-right border-r font-mono">
                {row + 1}
              </td>
              {Array.from({ length: preview.colCount }, (_, col) => {
                const key = `${row}:${col}`;

                if (mergedLookup.hidden.has(key)) return null;

                const cell = cellLookup.get(key);
                const mappedPlaceholder = mappingLookup.get(key);
                const placeholder = mappedPlaceholder ?? cell?.placeholder ?? null;
                const span = mergedLookup.spans.get(key);
                const isSelected =
                  selectedCell?.row === row && selectedCell?.col === col;

                return (
                  <SpreadsheetCell
                    key={col}
                    row={row}
                    col={col}
                    value={cell?.value ?? ''}
                    style={cell?.style ?? defaultStyle}
                    placeholder={placeholder}
                    isSelected={isSelected}
                    onClick={() => onCellClick(row, col)}
                    rowSpan={span?.rowSpan}
                    colSpan={span?.colSpan}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
