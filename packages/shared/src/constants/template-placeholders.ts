export type PlaceholderScope = 'document' | 'player';

export interface PlaceholderDefinition {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly scope: PlaceholderScope;
}

export const placeholderRegistry: ReadonlyArray<PlaceholderDefinition> = [
  // Document-level
  {
    key: '{{seasonLabel}}',
    label: 'Season',
    description: 'Season label (e.g. 2025)',
    scope: 'document',
  },
  { key: '{{clubName}}', label: 'Club Name', description: 'Name of the club', scope: 'document' },
  {
    key: '{{clubSection}}',
    label: 'Club Section',
    description: 'Section of the club (e.g. Basketball)',
    scope: 'document',
  },
  {
    key: '{{exportDate}}',
    label: 'Export Date',
    description: 'Date of document generation',
    scope: 'document',
  },

  // Player-level
  { key: '{{order}}', label: 'Row Number', description: 'Row index (1, 2, 3...)', scope: 'player' },
  {
    key: '{{playerLastName}}',
    label: 'Last Name',
    description: "Player's family name",
    scope: 'player',
  },
  {
    key: '{{playerFirstName}}',
    label: 'First Name',
    description: "Player's first name",
    scope: 'player',
  },
  {
    key: '{{playerBirthDate}}',
    label: 'Birth Date',
    description: "Player's date of birth",
    scope: 'player',
  },
  {
    key: '{{playerGender}}',
    label: 'Gender',
    description: "Player's gender code (G, F, H, D)",
    scope: 'player',
  },
  { key: '{{playerAddress}}', label: 'Address', description: "Player's address", scope: 'player' },
  { key: '{{playerPhone}}', label: 'Phone', description: "Player's phone number", scope: 'player' },
  {
    key: '{{playerEmail}}',
    label: 'Email',
    description: "Player's email address",
    scope: 'player',
  },
  {
    key: '{{playerCategory}}',
    label: 'Category',
    description: 'Computed category for the season (e.g. U18, Senior)',
    scope: 'player',
  },

  // License-level (resolved from the licence for the selected season)
  {
    key: '{{licenseNumber}}',
    label: 'License Number',
    description: 'Federation licence number',
    scope: 'player',
  },
  {
    key: '{{licenseStatus}}',
    label: 'License Status',
    description: 'License status (active, expired)',
    scope: 'player',
  },
  {
    key: '{{licenseStartDate}}',
    label: 'License Start Date',
    description: 'Start date of the licence',
    scope: 'player',
  },
  {
    key: '{{licenseEndDate}}',
    label: 'License End Date',
    description: 'End date of the licence',
    scope: 'player',
  },
  {
    key: '{{licenseCategory}}',
    label: 'License Category',
    description: 'Category recorded on the licence',
    scope: 'player',
  },
] as const;

function filterByScope(scope: PlaceholderScope): ReadonlyArray<string> {
  return placeholderRegistry.filter((p) => p.scope === scope).map((p) => p.key);
}

export const documentPlaceholders = filterByScope('document');
export const playerRowPlaceholders = filterByScope('player');
export const allPlaceholders = placeholderRegistry.map((p) => p.key);

export type DocumentPlaceholder = string;
export type PlayerRowPlaceholder = string;
export type TemplatePlaceholder = string;
