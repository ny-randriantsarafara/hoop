import type { PrismaClient, Prisma } from '@prisma/client';
import type { LicenseEntity } from '../../../domain/license/license.entity';
import type { LicenseRepository, LicenseFilters } from '../../../domain/license/license.repository';
import type { CreateLicenseInput, LicenseWithRelations } from '@hoop/shared';

function isDuplicateLicenseNumberError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const maybePrismaError = error as { code?: unknown; meta?: { target?: unknown } };
  if (maybePrismaError.code !== 'P2002') {
    return false;
  }

  const target = maybePrismaError.meta?.target;
  return Array.isArray(target) && target.includes('number');
}

function buildLicenseWhere(filters: LicenseFilters): Prisma.LicenseWhereInput {
  return {
    ...(filters.playerId ? { playerId: filters.playerId } : {}),
    ...(filters.seasonId ? { seasonId: filters.seasonId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.number
      ? { number: { contains: filters.number, mode: 'insensitive' as const } }
      : {}),
    ...(filters.startDateFrom || filters.startDateTo
      ? {
          startDate: {
            ...(filters.startDateFrom ? { gte: filters.startDateFrom } : {}),
            ...(filters.startDateTo ? { lte: filters.startDateTo } : {}),
          },
        }
      : {}),
    ...(filters.endDateFrom || filters.endDateTo
      ? {
          endDate: {
            ...(filters.endDateFrom ? { gte: filters.endDateFrom } : {}),
            ...(filters.endDateTo ? { lte: filters.endDateTo } : {}),
          },
        }
      : {}),
  };
}

export function createPrismaLicenseRepository(prisma: PrismaClient): LicenseRepository {
  return {
    async findById(id: string): Promise<LicenseEntity | null> {
      return prisma.license.findUnique({ where: { id } });
    },

    async findMany(filters: LicenseFilters): Promise<LicenseEntity[]> {
      return prisma.license.findMany({
        where: buildLicenseWhere(filters),
        orderBy: { createdAt: 'desc' },
      });
    },

    async findManyWithRelations(filters: LicenseFilters): Promise<LicenseWithRelations[]> {
      return prisma.license.findMany({
        where: buildLicenseWhere(filters),
        include: {
          player: { select: { firstName: true, lastName: true } },
          season: { select: { label: true } },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    async findActiveByPlayerId(playerId: string): Promise<LicenseEntity | null> {
      return prisma.license.findFirst({
        where: { playerId, status: 'active' },
      });
    },

    async create(input: CreateLicenseInput): Promise<LicenseEntity> {
      try {
        return await prisma.license.create({
          data: {
            playerId: input.playerId,
            seasonId: input.seasonId,
            categoryId: input.categoryId,
            number: input.number,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
          },
        });
      } catch (error) {
        if (isDuplicateLicenseNumberError(error)) {
          throw new Error('License number already exists');
        }

        throw error;
      }
    },

    async countBySeason(seasonId: string): Promise<number> {
      return prisma.license.count({ where: { seasonId } });
    },

    async getNextSequenceNumber(seasonId: string): Promise<number> {
      const count = await prisma.license.count({ where: { seasonId } });
      return count + 1;
    },
  };
}
