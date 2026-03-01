import { createPlayerSchema } from '@hoop/shared';
import type { OcrPlayerData } from '@hoop/shared';

type PlayerField =
  | 'firstName'
  | 'lastName'
  | 'birthDate'
  | 'gender'
  | 'address'
  | 'phone'
  | 'email';

interface PreparedPlayerInput {
  readonly clubId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: string;
  readonly gender: string;
  readonly address: string;
  readonly phone?: string;
  readonly email?: string;
}

type PlayerPreparationResult =
  | { kind: 'ready'; data: PreparedPlayerInput }
  | { kind: 'invalid'; fields: ReadonlyArray<PlayerField> };

const allowedGenderValues = new Set(['G', 'F', 'H', 'D']);

function normalizeText(value: string | null): string {
  return value?.trim() ?? '';
}

function normalizeOptionalText(value: string | null): string | undefined {
  const normalized = normalizeText(value);
  return normalized || undefined;
}

function normalizeGender(value: string | null): string {
  const normalized = normalizeText(value).toUpperCase();
  return allowedGenderValues.has(normalized) ? normalized : '';
}

export function preparePlayerInput(player: OcrPlayerData, clubId: string): PlayerPreparationResult {
  const candidate: PreparedPlayerInput = {
    clubId,
    firstName: normalizeText(player.firstName),
    lastName: normalizeText(player.lastName),
    birthDate: normalizeText(player.birthDate),
    gender: normalizeGender(player.gender),
    address: normalizeText(player.address),
    phone: normalizeOptionalText(player.phone),
    email: normalizeOptionalText(player.email),
  };

  const parsed = createPlayerSchema.safeParse(candidate);
  if (parsed.success) {
    return { kind: 'ready', data: candidate };
  }

  const fields = Array.from(
    new Set(
      parsed.error.issues
        .map((issue) => issue.path[0])
        .filter((path): path is PlayerField => typeof path === 'string'),
    ),
  );

  return { kind: 'invalid', fields };
}
