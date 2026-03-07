import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { computeCategoryId } from '@hoop/shared';
import type { PlayerRepository } from '../../domain/player/player.repository';
import type { LicenseRepository } from '../../domain/license/license.repository';
import type { SeasonRepository } from '../../domain/season/season.repository';

interface DashboardRoutesDeps {
  readonly playerRepository: PlayerRepository;
  readonly licenseRepository: LicenseRepository;
  readonly seasonRepository: SeasonRepository;
  readonly prisma: PrismaClient;
}

export async function dashboardRoutes(
  fastify: FastifyInstance,
  deps: DashboardRoutesDeps,
): Promise<void> {
  fastify.get('/dashboard/stats', async (request) => {
    if (!request.jwtPayload) {
      throw new Error('Unauthorized');
    }
    const clubId = request.jwtPayload.clubId;
    const season = await deps.seasonRepository.findActive();

    if (!clubId || !season) {
      return {
        totalPlayers: 0,
        activeLicenses: 0,
        expiringLicenses: 0,
        playersByCategory: [],
      };
    }

    const [totalPlayers, activeLicenses, expiringLicenses, players, categoryConfigs] =
      await Promise.all([
        deps.playerRepository.countByClub(clubId),
        deps.licenseRepository.countBySeason(season.id),
        deps.licenseRepository
          .findMany({
            endDateFrom: season.startDate,
            endDateTo: season.endDate,
          })
          .then((list) => list.length),
        deps.playerRepository.findMany({ clubId }),
        deps.prisma.categoryConfig.findMany({
          where: { clubId },
          orderBy: { displayOrder: 'asc' },
        }),
      ]);

    const seasonYear = season.startDate.getFullYear();
    const categories = categoryConfigs.map((c) => ({
      name: c.name,
      gender: c.gender,
      minAge: c.minAge,
      maxAge: c.maxAge,
    }));

    const categoryById = new Map(categoryConfigs.map((entry) => [entry.id, entry]));
    const categoryCounts = new Map<string, number>();
    for (const player of players) {
      const categoryId = computeCategoryId(player.birthDate, seasonYear, player.gender, categories);
      if (!categoryId) {
        categoryCounts.set('Unknown', (categoryCounts.get('Unknown') ?? 0) + 1);
        continue;
      }
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
    }

    const playersByCategory = Array.from(categoryCounts.entries())
      .map(([categoryKey, count]) => {
        if (categoryKey === 'Unknown') {
          return { category: 'Unknown', count, displayOrder: Number.MAX_SAFE_INTEGER };
        }
        const categoryConfig = categoryById.get(categoryKey);
        if (!categoryConfig) {
          return { category: 'Unknown', count, displayOrder: Number.MAX_SAFE_INTEGER };
        }
        return {
          category: `${categoryConfig.name} (${categoryConfig.gender})`,
          count,
          displayOrder: categoryConfig.displayOrder,
        };
      })
      .sort((a, b) => {
        return a.displayOrder - b.displayOrder;
      })
      .map(({ category, count }) => ({ category, count }));

    return { totalPlayers, activeLicenses, expiringLicenses, playersByCategory };
  });
}
