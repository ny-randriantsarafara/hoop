import { describe, expect, it } from 'vitest';
import { createUserSchema, updateUserSchema, resetUserPasswordSchema } from './user-schema';
import { Role } from '../constants/enums';

describe('createUserSchema', () => {
  it('parses valid payload', () => {
    const parsed = createUserSchema.parse({
      name: 'Coach',
      email: 'coach@test.mg',
      password: 'password123',
      role: Role.Staff,
    });

    expect(parsed.role).toBe(Role.Staff);
  });

  it('rejects short passwords', () => {
    expect(() =>
      createUserSchema.parse({
        name: 'Coach',
        email: 'coach@test.mg',
        password: 'short',
        role: Role.Staff,
      }),
    ).toThrow();
  });
});

describe('updateUserSchema', () => {
  it('requires at least one updatable field', () => {
    expect(() => updateUserSchema.parse({})).toThrow();
  });
});

describe('resetUserPasswordSchema', () => {
  it('accepts valid password reset payload', () => {
    const parsed = resetUserPasswordSchema.parse({ password: 'password123' });
    expect(parsed.password).toBe('password123');
  });
});
