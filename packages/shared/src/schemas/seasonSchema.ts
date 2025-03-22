import { z } from 'zod';

export const createSeasonSchema = z.object({
  label: z.string().min(1).max(10),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  active: z.boolean().default(false),
});

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;

export const updateSeasonSchema = z.object({
  label: z.string().min(1).max(10).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  active: z.boolean().optional(),
});

export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
