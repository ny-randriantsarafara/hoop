import type { OcrLicenseData } from '@hoop/shared';
import type { Gender } from '@hoop/shared';

type LicenseField = 'number' | 'category' | 'startDate' | 'endDate';

export interface PreparedLicenseInput {
  readonly number: string;
  readonly categoryId: string;
  readonly startDate: Date;
  readonly endDate: Date;
}

export interface CategoryOption {
  readonly id: string;
  readonly name: string;
  readonly gender: Gender;
}

type LicensePreparationResult =
  | { kind: 'ready'; data: PreparedLicenseInput }
  | { kind: 'invalid'; missing: ReadonlyArray<LicenseField> };

function normalizeText(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeCategoryName(value: string): string {
  return value.trim().toLowerCase();
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveCategoryIdByName(
  value: string | null,
  playerGender: Gender | null,
  categories: ReadonlyArray<CategoryOption>,
): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const normalizedKey = normalizeCategoryName(normalized);
  const matched = categories.find(
    (category) =>
      normalizeCategoryName(category.name) === normalizedKey &&
      (playerGender ? category.gender === playerGender : true),
  );

  return matched?.id ?? null;
}

export function prepareLicenseInput(
  license: OcrLicenseData,
  categoryId: string | null,
): LicensePreparationResult {
  const number = normalizeText(license.number);
  const normalizedCategoryId = normalizeText(categoryId);
  const startDate = parseDate(license.startDate);
  const endDate = parseDate(license.endDate);

  const missing: LicenseField[] = [];

  if (!number) missing.push('number');
  if (number && number.length > 50) missing.push('number');
  if (!normalizedCategoryId) missing.push('category');
  if (!startDate) missing.push('startDate');
  if (!endDate) missing.push('endDate');

  if (missing.length > 0 || !number || !normalizedCategoryId || !startDate || !endDate) {
    return { kind: 'invalid', missing };
  }

  return {
    kind: 'ready',
    data: {
      number,
      categoryId: normalizedCategoryId,
      startDate,
      endDate,
    },
  };
}
