import type { PrismaClient } from '@prisma/client';
import type { UserEntity } from '../../../domain/user/userEntity';
import type { UserRepository } from '../../../domain/user/userRepository';

export function createPrismaUserRepository(prisma: PrismaClient): UserRepository {
  return {
    async findById(id: string): Promise<UserEntity | null> {
      return prisma.user.findUnique({ where: { id } });
    },

    async findByEmail(email: string): Promise<UserEntity | null> {
      return prisma.user.findUnique({ where: { email } });
    },

    async updateLastLogin(id: string): Promise<void> {
      await prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    },
  };
}
