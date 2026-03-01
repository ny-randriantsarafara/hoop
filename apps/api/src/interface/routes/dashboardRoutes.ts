import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { computeCategory } from '@hoop/shared';
import type { PlayerRepository } from '../../domain/player/playerRepository';
import type { LicenseRepository } from '../../domain/license/licenseRepository';
import type { SeasonRepository } from '../../domain/season/seasonRepository';

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
      minAge: c.minAge,
      maxAge: c.maxAge,
    }));

    const categoryCounts = new Map<string, number>();
    for (const player of players) {
      const cat = computeCategory(player.birthDate, seasonYear, categories);
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    const playersByCategory = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => {
        const orderA = categoryConfigs.findIndex((c) => c.name === a.category);
        const orderB = categoryConfigs.findIndex((c) => c.name === b.category);
        return (orderA === -1 ? Infinity : orderA) - (orderB === -1 ? Infinity : orderB);
      });

    return { totalPlayers, activeLicenses, expiringLicenses, playersByCategory };
  });
}
