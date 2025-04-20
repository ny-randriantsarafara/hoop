import type { FastifyInstance } from 'fastify';
import type { PlayerRepository } from '../../domain/player/playerRepository.js';
import type { LicenseRepository } from '../../domain/license/licenseRepository.js';
import type { SeasonRepository } from '../../domain/season/seasonRepository.js';

interface DashboardRoutesDeps {
  readonly playerRepository: PlayerRepository;
  readonly licenseRepository: LicenseRepository;
  readonly seasonRepository: SeasonRepository;
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
      return { totalPlayers: 0, activeLicenses: 0 };
    }

    const [totalPlayers, activeLicenses] = await Promise.all([
      deps.playerRepository.countByClub(clubId),
      deps.licenseRepository.countBySeason(season.id),
    ]);

    return { totalPlayers, activeLicenses };
  });
}
