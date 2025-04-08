import type { UserEntity } from './userEntity.js';

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  updateLastLogin(id: string): Promise<void>;
}
