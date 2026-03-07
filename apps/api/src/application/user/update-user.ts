import type { UpdateUserInput, PublicUser } from '@hoop/shared';
import type { UserRepository } from '../../domain/user/user.repository';
import { toPublicUser } from './user-presenter';

export interface UpdateUserDeps {
  readonly userRepository: UserRepository;
}

export async function updateUser(
  deps: UpdateUserDeps,
  userId: string,
  clubId: string,
  input: UpdateUserInput,
): Promise<PublicUser> {
  const existingUser = await deps.userRepository.findById(userId);
  if (!existingUser || existingUser.clubId !== clubId) {
    throw new Error('User not found');
  }

  const user = await deps.userRepository.update(userId, input);
  return toPublicUser(user);
}
