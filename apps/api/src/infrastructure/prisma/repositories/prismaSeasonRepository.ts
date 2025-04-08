import type { PrismaClient } from '@prisma/client';
import type { SeasonEntity } from '../../../domain/season/seasonEntity.js';
import type { SeasonRepository } from '../../../domain/season/seasonRepository.js';

export function createPrismaSeasonRepository(prisma: PrismaClient): SeasonRepository {
  return {
    async findById(id: string): Promise<SeasonEntity | null> {
      return prisma.season.findUnique({ where: { id } });
    },

    async findActive(): Promise<SeasonEntity | null> {
      return prisma.season.findFirst({ where: { active: true } });
    },

    async findAll(): Promise<SeasonEntity[]> {
      return prisma.season.findMany({ orderBy: { label: 'desc' } });
    },

    async create(input: {
      label: string;
      startDate: Date;
      endDate: Date;
      active: boolean;
    }): Promise<SeasonEntity> {
      if (input.active) {
        await prisma.season.updateMany({ where: { active: true }, data: { active: false } });
      }
      return prisma.season.create({ data: input });
    },

    async update(
      id: string,
      input: Partial<{ label: string; startDate: Date; endDate: Date; active: boolean }>,
    ): Promise<SeasonEntity> {
      if (input.active === true) {
        await prisma.season.updateMany({ where: { active: true }, data: { active: false } });
      }
      return prisma.season.update({ where: { id }, data: input });
    },

    async delete(id: string): Promise<void> {
      await prisma.season.delete({ where: { id } });
    },

    async deactivateAll(): Promise<void> {
      await prisma.season.updateMany({ where: { active: true }, data: { active: false } });
    },
  };
}
