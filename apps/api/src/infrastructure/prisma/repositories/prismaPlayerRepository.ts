import type { PrismaClient } from '@prisma/client';
import type { PlayerEntity } from '../../../domain/player/playerEntity';
import type { PlayerRepository, PlayerFilters } from '../../../domain/player/playerRepository';
import type { CreatePlayerInput, UpdatePlayerInput } from '@hoop/shared';

export function createPrismaPlayerRepository(prisma: PrismaClient): PlayerRepository {
  return {
    async findById(id: string): Promise<PlayerEntity | null> {
      return prisma.player.findUnique({ where: { id } });
    },

    async findMany(filters: PlayerFilters): Promise<PlayerEntity[]> {
      return prisma.player.findMany({
        where: {
          ...(filters.clubId ? { clubId: filters.clubId } : {}),
          ...(filters.gender ? { gender: filters.gender } : {}),
          ...(filters.search
            ? {
                AND: filters.search
                  .trim()
                  .split(/\s+/)
                  .map((word) => ({
                    OR: [
                      { firstName: { contains: word, mode: 'insensitive' as const } },
                      { lastName: { contains: word, mode: 'insensitive' as const } },
                    ],
                  })),
              }
            : {}),
          ...(filters.birthDateFrom || filters.birthDateTo
            ? {
                birthDate: {
                  ...(filters.birthDateFrom ? { gte: filters.birthDateFrom } : {}),
                  ...(filters.birthDateTo ? { lte: filters.birthDateTo } : {}),
                },
              }
            : {}),
        },
        orderBy: { lastName: 'asc' },
      });
    },

    async create(input: CreatePlayerInput): Promise<PlayerEntity> {
      return prisma.player.create({
        data: {
          clubId: input.clubId,
          firstName: input.firstName,
          lastName: input.lastName,
          birthDate: input.birthDate,
          gender: input.gender,
          address: input.address,
          phone: input.phone ?? null,
          email: input.email ?? null,
          photoUrl: input.photoUrl ?? null,
        },
      });
    },

    async update(id: string, input: UpdatePlayerInput): Promise<PlayerEntity> {
      return prisma.player.update({
        where: { id },
        data: {
          ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
          ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
          ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
          ...(input.gender !== undefined ? { gender: input.gender } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
          ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
          ...(input.email !== undefined ? { email: input.email ?? null } : {}),
          ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl ?? null } : {}),
        },
      });
    },

    async delete(id: string): Promise<void> {
      await prisma.player.delete({ where: { id } });
    },

    async countByClub(clubId: string): Promise<number> {
      return prisma.player.count({ where: { clubId } });
    },
  };
}
