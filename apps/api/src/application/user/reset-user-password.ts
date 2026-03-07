import bcrypt from 'bcrypt';
import type { UserRepository } from '../../domain/user/user.repository';

export interface ResetUserPasswordDeps {
  readonly userRepository: UserRepository;
}

export async function resetUserPassword(
  deps: ResetUserPasswordDeps,
  userId: string,
  clubId: string,
  password: string,
): Promise<void> {
  const existingUser = await deps.userRepository.findById(userId);
  if (!existingUser || existingUser.clubId !== clubId) {
    throw new Error('User not found');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await deps.userRepository.updatePassword(userId, passwordHash);
}
