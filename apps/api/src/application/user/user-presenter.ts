import type { PublicUser } from '@hoop/shared';
import type { UserEntity } from '../../domain/user/user.entity';

export function toPublicUser(user: UserEntity): PublicUser {
  return {
    id: user.id,
    clubId: user.clubId,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
}
