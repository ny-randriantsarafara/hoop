export const documentPlaceholders = [
  '{{seasonLabel}}',
  '{{clubName}}',
  '{{clubSection}}',
  '{{exportDate}}',
] as const;

export const playerRowPlaceholders = [
  '{{order}}',
  '{{playerLastName}}',
  '{{playerFirstName}}',
  '{{playerBirthDate}}',
  '{{playerGender}}',
  '{{playerAddress}}',
  '{{playerCategory}}',
] as const;

export const allPlaceholders = [...documentPlaceholders, ...playerRowPlaceholders] as const;

export type DocumentPlaceholder = (typeof documentPlaceholders)[number];
export type PlayerRowPlaceholder = (typeof playerRowPlaceholders)[number];
export type TemplatePlaceholder = (typeof allPlaceholders)[number];
