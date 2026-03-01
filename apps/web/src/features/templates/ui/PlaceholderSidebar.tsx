'use client';

import { X, Tag } from 'lucide-react';
import type { CellMapping } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';

interface PlaceholderSidebarProps {
  readonly mappings: ReadonlyArray<CellMapping>;
  readonly onRemove: (row: number, col: number) => void;
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

function cellRef(row: number, col: number): string {
  return `${columnLabel(col)}${row + 1}`;
}

export function PlaceholderSidebar({ mappings, onRemove }: PlaceholderSidebarProps) {
  if (mappings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Tag className="h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No placeholders assigned</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click a cell to assign a placeholder
        </p>
      </div>
    );
  }

  const sorted = [...mappings].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">
          Assigned ({mappings.length})
        </p>
      </div>
      {sorted.map((mapping) => (
        <div
          key={`${mapping.row}:${mapping.col}`}
          className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="shrink-0 font-mono text-xs">
              {cellRef(mapping.row, mapping.col)}
            </Badge>
            <span className="truncate text-xs font-mono">
              {mapping.value}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(mapping.row, mapping.col)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
