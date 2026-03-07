import { z } from 'zod';

const genderValues = ['G', 'F', 'H', 'D'] as const;

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  gender: z.enum(genderValues),
  minAge: z.number().int().min(0),
  maxAge: z.number().int().min(0).nullable(),
  displayOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
