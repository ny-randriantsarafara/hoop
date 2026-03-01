import type { PrismaClient, Prisma } from '@prisma/client';
import type { LicenseEntity } from '../../../domain/license/licenseEntity';
import type { LicenseRepository, LicenseFilters } from '../../../domain/license/licenseRepository';
import type { CreateLicenseInput, LicenseWithRelations } from '@hoop/shared';

function buildLicenseWhere(filters: LicenseFilters): Prisma.LicenseWhereInput {
  return {
    ...(filters.playerId ? { playerId: filters.playerId } : {}),
    ...(filters.seasonId ? { seasonId: filters.seasonId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
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
      return prisma.license.create({
        data: {
          playerId: input.playerId,
          seasonId: input.seasonId,
          number: input.number,
          status: input.status,
          category: input.category,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      });
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
