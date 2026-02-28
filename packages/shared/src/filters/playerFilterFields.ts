import type { FilterFieldDefinition } from './filterFieldDefinition';
import { genderLabels } from '../constants/genderLabels';

export const playerFilterFields: ReadonlyArray<FilterFieldDefinition> = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Name...' },
  {
    key: 'gender',
    label: 'Gender',
    type: 'enum',
    options: Object.entries(genderLabels).map(([value, label]) => ({ value, label })),
  },
  { key: 'category', label: 'Category', type: 'select' },
  { key: 'birthDateFrom', label: 'Born after', type: 'date' },
  { key: 'birthDateTo', label: 'Born before', type: 'date' },
  { key: 'seasonId', label: 'Season', type: 'select' },
] as const;
