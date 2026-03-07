import type { Gender } from '../constants/enums';

export interface CategoryDefinition {
  readonly id?: string;
  readonly name: string;
  readonly gender: Gender;
  readonly minAge: number;
  readonly maxAge: number | null;
}

function isMatchingAge(age: number, category: CategoryDefinition): boolean {
  return age >= category.minAge && (category.maxAge === null || age <= category.maxAge);
}

function isMatchingGender(playerGender: Gender, categoryGender: Gender): boolean {
  return playerGender === categoryGender;
}

export function computeCategory(
  birthDate: Date,
  seasonYear: number,
  playerGender: Gender,
  categories: ReadonlyArray<CategoryDefinition>,
): string {
  const age = seasonYear - birthDate.getFullYear();

  for (const cat of categories) {
    if (isMatchingAge(age, cat) && isMatchingGender(playerGender, cat.gender)) {
      return cat.name;
    }
  }

  return 'Unknown';
}

export function computeCategoryId(
  birthDate: Date,
  seasonYear: number,
  playerGender: Gender,
  categories: ReadonlyArray<CategoryDefinition>,
): string | null {
  const age = seasonYear - birthDate.getFullYear();

  for (const cat of categories) {
    if (isMatchingAge(age, cat) && isMatchingGender(playerGender, cat.gender) && cat.id) {
      return cat.id;
    }
  }

  return null;
}
