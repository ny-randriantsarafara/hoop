import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

interface ClubRoutesDeps {
  readonly prisma: PrismaClient;
}

export async function clubRoutes(fastify: FastifyInstance, deps: ClubRoutesDeps): Promise<void> {
  fastify.get('/clubs/me', async (request) => {
    if (!request.jwtPayload) {
      throw new Error('Unauthorized');
    }
    const clubId = request.jwtPayload.clubId;
    if (!clubId) {
      throw new Error('No club associated');
    }
    const club = await deps.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      throw new Error('Club not found');
    }
    return club;
  });
}
