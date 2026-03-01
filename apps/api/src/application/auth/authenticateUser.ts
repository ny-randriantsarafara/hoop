import bcrypt from 'bcrypt';
import type { UserRepository } from '../../domain/user/userRepository';
import type { LoginInput } from '@hoop/shared';

export interface AuthResult {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly clubId: string | null;
}

export interface AuthenticateUserDeps {
  readonly userRepository: UserRepository;
}

export async function authenticateUser(
  deps: AuthenticateUserDeps,
  input: LoginInput,
): Promise<AuthResult> {
  const user = await deps.userRepository.findByEmail(input.email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw new Error('Invalid credentials');
  }

  await deps.userRepository.updateLastLogin(user.id);

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    clubId: user.clubId,
  };
}
