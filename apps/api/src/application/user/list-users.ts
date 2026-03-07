import type { PublicUser } from '@hoop/shared';
import type { UserRepository } from '../../domain/user/user.repository';
import { toPublicUser } from './user-presenter';

export interface ListUsersDeps {
  readonly userRepository: UserRepository;
}

export async function listUsers(deps: ListUsersDeps, clubId: string): Promise<PublicUser[]> {
  const users = await deps.userRepository.findManyByClub(clubId);
  return users.map(toPublicUser);
}
