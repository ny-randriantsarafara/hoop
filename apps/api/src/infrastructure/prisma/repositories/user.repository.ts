import type { PrismaClient } from '@prisma/client';
import type { UserEntity } from '../../../domain/user/user.entity';
import type {
  UserRepository,
  CreateUserRecord,
  UpdateUserRecord,
} from '../../../domain/user/user.repository';

export function createPrismaUserRepository(prisma: PrismaClient): UserRepository {
  return {
    async findById(id: string): Promise<UserEntity | null> {
      return prisma.user.findUnique({ where: { id } });
    },

    async findManyByClub(clubId: string): Promise<UserEntity[]> {
      return prisma.user.findMany({
        where: { clubId },
        orderBy: { createdAt: 'desc' },
      });
    },

    async findByEmail(email: string): Promise<UserEntity | null> {
      return prisma.user.findUnique({ where: { email } });
    },

    async create(input: CreateUserRecord): Promise<UserEntity> {
      return prisma.user.create({ data: input });
    },

    async update(id: string, input: UpdateUserRecord): Promise<UserEntity> {
      return prisma.user.update({ where: { id }, data: input });
    },

    async updatePassword(id: string, passwordHash: string): Promise<UserEntity> {
      return prisma.user.update({
        where: { id },
        data: { passwordHash },
      });
    },

    async delete(id: string): Promise<void> {
      await prisma.user.delete({ where: { id } });
    },

    async updateLastLogin(id: string): Promise<void> {
      await prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    },
  };
}
