import type { UserEntity } from './user.entity';
import type { Role } from '@hoop/shared';

export interface CreateUserRecord {
  readonly clubId: string;
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
}

export interface UpdateUserRecord {
  readonly name?: string;
  readonly email?: string;
  readonly role?: Role;
}

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findManyByClub(clubId: string): Promise<UserEntity[]>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(input: CreateUserRecord): Promise<UserEntity>;
  update(id: string, input: UpdateUserRecord): Promise<UserEntity>;
  updatePassword(id: string, passwordHash: string): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
}
