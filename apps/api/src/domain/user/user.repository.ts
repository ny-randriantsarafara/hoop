import type { UserEntity } from './user.entity';

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  updateLastLogin(id: string): Promise<void>;
}
