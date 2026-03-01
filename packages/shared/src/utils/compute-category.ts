export interface CategoryDefinition {
  readonly name: string;
  readonly minAge: number;
  readonly maxAge: number | null;
}

export function computeCategory(
  birthDate: Date,
  seasonYear: number,
  categories: ReadonlyArray<CategoryDefinition>,
): string {
  const age = seasonYear - birthDate.getFullYear();

  for (const cat of categories) {
    if (age >= cat.minAge && (cat.maxAge === null || age <= cat.maxAge)) {
      return cat.name;
    }
  }

  return 'Unknown';
}
