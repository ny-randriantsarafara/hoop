import { z } from 'zod';

const licenseStatusValues = ['active', 'expired'] as const;

export const createLicenseSchema = z.object({
  playerId: z.string().uuid(),
  seasonId: z.string().uuid(),
  number: z.string().min(1).max(50),
  status: z.enum(licenseStatusValues),
  category: z.string().min(1).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type CreateLicenseInput = z.infer<typeof createLicenseSchema>;

export const createLicensesBatchSchema = z.object({
  licenses: z.array(createLicenseSchema).min(1).max(50),
});

export type CreateLicensesBatchInput = z.infer<typeof createLicensesBatchSchema>;
