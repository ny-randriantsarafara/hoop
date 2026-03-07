import bcrypt from 'bcrypt';
import type { CreateUserInput, PublicUser } from '@hoop/shared';
import type { UserRepository } from '../../domain/user/user.repository';
import { toPublicUser } from './user-presenter';

export interface CreateUserDeps {
  readonly userRepository: UserRepository;
}

export async function createUser(
  deps: CreateUserDeps,
  clubId: string,
  input: CreateUserInput,
): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await deps.userRepository.create({
    clubId,
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
  });

  return toPublicUser(user);
}
