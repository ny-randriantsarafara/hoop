import type { UserRepository } from '../../domain/user/user.repository';

export interface DeleteUserDeps {
  readonly userRepository: UserRepository;
}

export async function deleteUser(
  deps: DeleteUserDeps,
  userId: string,
  clubId: string,
): Promise<void> {
  const existingUser = await deps.userRepository.findById(userId);
  if (!existingUser || existingUser.clubId !== clubId) {
    throw new Error('User not found');
  }

  await deps.userRepository.delete(userId);
}
