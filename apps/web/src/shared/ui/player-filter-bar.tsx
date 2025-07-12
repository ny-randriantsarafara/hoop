'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { genderLabels } from '@hoop/shared';

interface PlayerFilterBarProps {
  readonly categories: ReadonlyArray<{ readonly name: string }>;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly gender: string;
  readonly onGenderChange: (value: string) => void;
  readonly category: string;
  readonly onCategoryChange: (value: string) => void;
  readonly birthDateFrom: string;
  readonly onBirthDateFromChange: (value: string) => void;
  readonly birthDateTo: string;
  readonly onBirthDateToChange: (value: string) => void;
  readonly onClear: () => void;
}

export function PlayerFilterBar({
  categories,
  search,
  onSearchChange,
  gender,
  onGenderChange,
  category,
  onCategoryChange,
  birthDateFrom,
  onBirthDateFromChange,
  birthDateTo,
  onBirthDateToChange,
  onClear,
}: PlayerFilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters = !!gender || !!category || !!birthDateFrom || !!birthDateTo;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
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
              {[gender, category, birthDateFrom, birthDateTo].filter(Boolean).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="shrink-0">
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Gender</label>
            <Select value={gender} onChange={(e) => onGenderChange(e.target.value)}>
              <option value="">All</option>
              {Object.entries(genderLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Born after</label>
            <Input
              type="date"
              value={birthDateFrom}
              onChange={(e) => onBirthDateFromChange(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Born before</label>
            <Input
              type="date"
              value={birthDateTo}
              onChange={(e) => onBirthDateToChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
