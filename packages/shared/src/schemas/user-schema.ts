import { z } from 'zod';
import { Role } from '../constants/enums';

const roleValues = [Role.Admin, Role.Staff, Role.Viewer] as const;

export const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  role: z.enum(roleValues).default(Role.Staff),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    role: z.enum(roleValues).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field must be provided',
  });

export const resetUserPasswordSchema = z.object({
  password: z.string().min(8).max(255),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
