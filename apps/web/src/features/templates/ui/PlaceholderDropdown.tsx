'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { placeholderRegistry } from '@hoop/shared';
import type { PlaceholderDefinition } from '@hoop/shared';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

interface PlaceholderDropdownProps {
  readonly position: { top: number; left: number };
  readonly placement: 'below' | 'above';
  readonly currentValue: string;
  readonly onSelect: (key: string, updatedValue: string) => void;
  readonly onRemove: () => void;
  readonly onClose: () => void;
}

function groupByScope(
  definitions: ReadonlyArray<PlaceholderDefinition>,
): ReadonlyArray<{ scope: string; items: ReadonlyArray<PlaceholderDefinition> }> {
  const groups = new Map<string, PlaceholderDefinition[]>();

  for (const def of definitions) {
    const existing = groups.get(def.scope) ?? [];
    existing.push(def);
    groups.set(def.scope, existing);
  }

  return Array.from(groups.entries()).map(([scope, items]) => ({ scope, items }));
}

const SCOPE_LABELS: Record<string, string> = {
  document: 'Document',
  player: 'Player / License',
};

export function PlaceholderDropdown({
  position,
  placement,
  currentValue,
  onSelect,
  onRemove,
  onClose,
}: PlaceholderDropdownProps) {
  const [search, setSearch] = useState('');
  const [value, setValue] = useState(currentValue);
  const panelRef = useRef<HTMLDivElement>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    valueInputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onSelect('', value);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onSelect('', value);
      }
    }

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onSelect, value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return placeholderRegistry;

    const query = search.toLowerCase();
    return placeholderRegistry.filter(
      (p) =>
        p.label.toLowerCase().includes(query) ||
        p.key.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query),
    );
  }, [search]);

  const groups = useMemo(() => groupByScope(filtered), [filtered]);

  const clampedTop = Math.max(8, Math.min(position.top, window.innerHeight - 460));
  const clampedLeft = Math.max(8, Math.min(position.left, window.innerWidth - 296));

  function handleItemClick(key: string) {
    const input = valueInputRef.current;
    let newValue: string;
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      newValue = value.slice(0, start) + key + value.slice(end);
    } else {
      newValue = value + key;
    }
    setValue(newValue);
    // Keep focus on the value input after insertion
    setTimeout(() => valueInputRef.current?.focus(), 0);
  }

  function handleConfirm() {
    onSelect('', value);
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed z-50 w-72 rounded-lg border bg-white dark:bg-zinc-900 text-foreground shadow-lg',
        placement === 'below' ? 'animate-popover-in-below' : 'animate-popover-in-above',
      )}
      style={{ top: clampedTop, left: clampedLeft }}
    >
      <div
        className={cn(
          'absolute left-4 h-2 w-2 rotate-45 border bg-white dark:bg-zinc-900',
          placement === 'below'
            ? '-top-[5px] border-l border-t'
            : '-bottom-[5px] border-r border-b',
        )}
      />

      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">Assign Placeholder</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleConfirm}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-2 space-y-1.5">
        <div className="flex items-center gap-1">
          <Input
            ref={valueInputRef}
            placeholder="Type text or click a placeholder below..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 text-sm font-mono"
          />
          {value && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              onClick={() => { setValue(''); onRemove(); }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="max-h-56 overflow-y-auto px-1 pb-2">
        {groups.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No placeholders found
          </p>
        )}
        {groups.map((group) => (
          <div key={group.scope}>
            <p className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {SCOPE_LABELS[group.scope] ?? group.scope}
            </p>
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleItemClick(item.key)}
                className={cn(
                  'flex w-full flex-col rounded-md px-2 py-1.5 text-left transition-colors',
                  'hover:bg-accent',
                )}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
