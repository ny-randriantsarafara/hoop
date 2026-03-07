import type { PublicUser } from '@hoop/shared';
import type { UserRepository } from '../../domain/user/user.repository';
import { toPublicUser } from './user-presenter';

export interface GetUserDeps {
  readonly userRepository: UserRepository;
}

export async function getUser(
  deps: GetUserDeps,
  userId: string,
  clubId: string,
): Promise<PublicUser> {
  const user = await deps.userRepository.findById(userId);
  if (!user || user.clubId !== clubId) {
    throw new Error('User not found');
  }

  return toPublicUser(user);
}
