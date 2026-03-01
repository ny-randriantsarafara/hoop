'use client';

import type { CellStyle } from '@hoop/shared';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

interface SpreadsheetCellProps {
  readonly row: number;
  readonly col: number;
  readonly value: string;
  readonly style: CellStyle;
  readonly placeholder: string | null;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly rowSpan?: number;
  readonly colSpan?: number;
}

function buildCellStyles(style: CellStyle): React.CSSProperties {
  const css: React.CSSProperties = {};

  if (style.bold) css.fontWeight = 'bold';
  if (style.italic) css.fontStyle = 'italic';
  if (style.fontSize) css.fontSize = `${style.fontSize}px`;
  if (style.fontColor) css.color = style.fontColor;
  if (style.backgroundColor) css.backgroundColor = style.backgroundColor;

  if (style.horizontalAlignment) {
    css.textAlign = style.horizontalAlignment;
  }

  return css;
}

function buildBorderClasses(style: CellStyle, isSelected: boolean): string {
  if (isSelected) return 'border-2 border-primary ring-2 ring-primary/25';

  const borders: string[] = [];
  borders.push(style.borderTop ? 'border-t' : 'border-t border-t-transparent');
  borders.push(style.borderBottom ? 'border-b' : 'border-b border-b-transparent');
  borders.push(style.borderLeft ? 'border-l' : 'border-l border-l-transparent');
  borders.push(style.borderRight ? 'border-r' : 'border-r border-r-transparent');
  return borders.join(' ');
}

export function SpreadsheetCell({
  row,
  col,
  value,
  style,
  placeholder,
  isSelected,
  onClick,
  rowSpan,
  colSpan,
}: SpreadsheetCellProps) {
  const inlineStyles = buildCellStyles(style);
  const borderClasses = buildBorderClasses(style, isSelected);

  return (
    <td
      role="gridcell"
      tabIndex={0}
      data-cell={`${row}:${col}`}
      onClick={onClick}
      rowSpan={rowSpan}
      colSpan={colSpan}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'relative px-2 py-1 text-sm cursor-pointer whitespace-nowrap select-none',
        'hover:bg-accent/50 transition-colors',
        borderClasses,
        placeholder && !isSelected && 'bg-primary/5',
      )}
      style={inlineStyles}
    >
      <span className="block truncate max-w-[200px]">{value || '\u00A0'}</span>
      {placeholder && (
        <div className="absolute top-0 right-0 flex flex-wrap gap-0.5 justify-end max-w-full">
          {[...placeholder.matchAll(/\{\{(\w+(?:\.\w+)*)\}\}/g)].map((m) => (
            <Badge
              key={m[1]}
              variant="secondary"
              className="text-[10px] px-1 py-0 leading-tight rounded-bl rounded-tr-none"
            >
              {m[1]}
            </Badge>
          ))}
          {!/\{\{/.test(placeholder) && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1 py-0 leading-tight rounded-bl rounded-tr-none"
            >
              {placeholder}
            </Badge>
          )}
        </div>
      )}
    </td>
  );
}
