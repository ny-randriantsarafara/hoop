import type { Role } from '@hoop/shared';

export interface UserEntity {
  readonly id: string;
  readonly clubId: string | null;
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
  readonly lastLogin: Date | null;
  readonly createdAt: Date;
}
