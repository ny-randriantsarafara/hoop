import { z } from 'zod';

const ocrConfidenceValues = ['high', 'medium', 'low'] as const;

export const ocrPlayerDataSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  birthDate: z.string().nullable(),
  gender: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
});

export const ocrLicenseDataSchema = z.object({
  number: z.string().nullable(),
  category: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

export const ocrExtractionResultSchema = z.object({
  confidence: z.enum(ocrConfidenceValues),
  player: ocrPlayerDataSchema.nullable(),
  license: ocrLicenseDataSchema.nullable(),
});

export const ocrExtractionResponseSchema = ocrExtractionResultSchema.extend({
  extractionId: z.string().uuid(),
});

export const validateExtractionSchema = z.object({
  validatedData: z.object({
    player: ocrPlayerDataSchema.nullable(),
    license: ocrLicenseDataSchema.nullable(),
  }),
});

export type OcrConfidence = (typeof ocrConfidenceValues)[number];
export type OcrPlayerData = z.infer<typeof ocrPlayerDataSchema>;
export type OcrLicenseData = z.infer<typeof ocrLicenseDataSchema>;
export type OcrExtractionResult = z.infer<typeof ocrExtractionResultSchema>;
export type OcrExtractionResponse = z.infer<typeof ocrExtractionResponseSchema>;
export type ValidateExtractionInput = z.infer<typeof validateExtractionSchema>;
