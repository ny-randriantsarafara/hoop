'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { FilterFieldDefinition, FilterFieldOption } from '@hoop/shared';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';

interface FilterBarProps {
  readonly fields: ReadonlyArray<FilterFieldDefinition>;
  readonly values: Record<string, string>;
  readonly onChange: (key: string, value: string) => void;
  readonly onClear: () => void;
  readonly dynamicOptions?: Record<string, ReadonlyArray<FilterFieldOption>>;
}

function getTextFields(
  fields: ReadonlyArray<FilterFieldDefinition>,
): ReadonlyArray<FilterFieldDefinition> {
  return fields.filter((f) => f.type === 'text');
}

function getExpandableFields(
  fields: ReadonlyArray<FilterFieldDefinition>,
): ReadonlyArray<FilterFieldDefinition> {
  return fields.filter((f) => f.type !== 'text');
}

export function FilterBar({ fields, values, onChange, onClear, dynamicOptions }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const textFields = getTextFields(fields);
  const expandableFields = getExpandableFields(fields);

  const activeFilterCount = expandableFields.filter((f) => !!values[f.key]).length;
  const hasActiveFilters = activeFilterCount > 0;

  function resolveOptions(field: FilterFieldDefinition): ReadonlyArray<FilterFieldOption> {
    if (field.options) return field.options;
    return dynamicOptions?.[field.key] ?? [];
  }

  function renderField(field: FilterFieldDefinition) {
    const value = values[field.key] ?? '';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={field.placeholder ?? field.label}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="pl-9"
            />
          </div>
        );

      case 'enum':
      case 'select': {
        const options = resolveOptions(field);
        return (
          <div key={field.key} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
            <Select value={value} onChange={(e) => onChange(field.key, e.target.value)}>
              <option value="">All</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        );
      }

      case 'date':
        return (
          <div key={field.key} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
            <Input
              type="date"
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          </div>
        );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {textFields.map((f) => renderField(f))}
        {expandableFields.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            className="shrink-0"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="shrink-0">
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {expanded && expandableFields.length > 0 && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {expandableFields.map((f) => renderField(f))}
        </div>
      )}
    </div>
  );
}
