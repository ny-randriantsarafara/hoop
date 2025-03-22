import { z } from 'zod';

export const createClubSchema = z.object({
  name: z.string().min(1).max(255),
  section: z.string().min(1).max(255),
  address: z.string().min(1).max(500),
  phone: z.string().min(1).max(50),
  email: z.string().email(),
  logoUrl: z.string().url().nullable().optional(),
});

export const updateClubSchema = createClubSchema.partial();

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
