import type { PrismaClient } from '@prisma/client';
import type { CategoryRepository, CategoryRecord } from '../../../domain/category/category-repository';

export function createPrismaCategoryRepository(prisma: PrismaClient): CategoryRepository {
  return {
    async findById(id: string): Promise<CategoryRecord | null> {
      return prisma.categoryConfig.findUnique({ where: { id } });
    },
  };
}
