import type { FilterFieldDefinition } from './filterFieldDefinition';

export const licenseFilterFields: ReadonlyArray<FilterFieldDefinition> = [
  { key: 'seasonId', label: 'Season', type: 'select' },
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'expired', label: 'Expired' },
    ],
  },
  { key: 'category', label: 'Category', type: 'select' },
  { key: 'number', label: 'License Number', type: 'text', placeholder: 'Number...' },
  { key: 'endDateFrom', label: 'Expires after', type: 'date' },
  { key: 'endDateTo', label: 'Expires before', type: 'date' },
  { key: 'startDateFrom', label: 'Starts after', type: 'date' },
  { key: 'startDateTo', label: 'Starts before', type: 'date' },
] as const;
