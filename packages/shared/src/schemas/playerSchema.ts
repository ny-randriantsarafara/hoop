import { z } from 'zod';

const genderValues = ['G', 'F', 'H', 'D'] as const;

export const createPlayerSchema = z.object({
  clubId: z.string().uuid(),
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  birthDate: z.coerce.date(),
  gender: z.enum(genderValues),
  address: z.string().min(1).max(500),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
});

export const updatePlayerSchema = createPlayerSchema.omit({ clubId: true }).partial();

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
