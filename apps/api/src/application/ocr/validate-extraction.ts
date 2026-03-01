import type { PrismaClient } from '@prisma/client';
import type { ValidateExtractionInput } from '@hoop/shared';

export interface ValidateExtractionDeps {
  readonly prisma: PrismaClient;
}

export async function validateExtraction(
  deps: ValidateExtractionDeps,
  extractionId: string,
  clubId: string,
  input: ValidateExtractionInput,
): Promise<void> {
  const extraction = await deps.prisma.ocrExtraction.findUnique({
    where: { id: extractionId },
  });

  if (!extraction || extraction.clubId !== clubId) {
    throw new Error('Extraction not found');
  }

  await deps.prisma.ocrExtraction.update({
    where: { id: extractionId },
    data: { validatedData: input.validatedData },
  });
}
