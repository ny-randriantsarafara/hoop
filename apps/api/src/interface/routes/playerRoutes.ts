import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createPlayerSchema, updatePlayerSchema, computeCategory } from '@hoop/shared';
import { createPlayer } from '../../application/player/createPlayer.js';
import { updatePlayer } from '../../application/player/updatePlayer.js';
import { listPlayers } from '../../application/player/listPlayers.js';
import { deletePlayer } from '../../application/player/deletePlayer.js';
import type { PlayerRepository } from '../../domain/player/playerRepository.js';
import type { LicenseRepository } from '../../domain/license/licenseRepository.js';

const playerIdParamSchema = z.object({ id: z.string().uuid() });
const genderValues = ['G', 'F', 'H', 'D'] as const;

const querySchema = z.object({
  search: z.string().optional(),
  gender: z.enum(genderValues).optional(),
  clubId: z.string().uuid().optional(),
  birthDateFrom: z.coerce.date().optional(),
  birthDateTo: z.coerce.date().optional(),
  category: z.string().optional(),
});

interface PlayerRoutesDeps {
  readonly playerRepository: PlayerRepository;
  readonly licenseRepository: LicenseRepository;
  readonly prisma: PrismaClient;
}

export async function playerRoutes(
  fastify: FastifyInstance,
  deps: PlayerRoutesDeps,
): Promise<void> {
  fastify.get('/players', async (request) => {
    if (!request.jwtPayload) {
      throw new Error('Unauthorized');
    }
    const query = querySchema.parse(request.query ?? {});
    const clubId = query.clubId ?? request.jwtPayload.clubId ?? undefined;

    const players = await listPlayers(
      { playerRepository: deps.playerRepository },
      {
        clubId,
        search: query.search,
        gender: query.gender,
        birthDateFrom: query.birthDateFrom,
        birthDateTo: query.birthDateTo,
      },
    );

    if (!query.category) return players;

    const clubIdForCategories = clubId ?? request.jwtPayload?.clubId ?? undefined;
    if (!clubIdForCategories) {
      throw new Error('No club associated');
    }

    const categoryConfigs = await deps.prisma.categoryConfig.findMany({
      where: { clubId: clubIdForCategories },
      orderBy: { displayOrder: 'asc' },
    });

    const currentYear = new Date().getFullYear();
    return players.filter(
      (player) =>
        computeCategory(
          new Date(player.birthDate),
          currentYear,
          categoryConfigs.map((c) => ({ name: c.name, minAge: c.minAge, maxAge: c.maxAge })),
        ) === query.category,
    );
  });

  fastify.get('/players/:id', async (request) => {
    const { id } = playerIdParamSchema.parse(request.params);
    const player = await deps.playerRepository.findById(id);
    if (!player) {
      throw new Error('Player not found');
    }
    return player;
  });

  fastify.post('/players', async (request, reply) => {
    const input = createPlayerSchema.parse(request.body);
    const player = await createPlayer({ playerRepository: deps.playerRepository }, input);
    reply.code(201).send(player);
  });

  fastify.put('/players/:id', async (request) => {
    const { id } = playerIdParamSchema.parse(request.params);
    const input = updatePlayerSchema.parse(request.body);
    return updatePlayer({ playerRepository: deps.playerRepository }, id, input);
  });

  fastify.delete('/players/:id', async (request, reply) => {
    const { id } = playerIdParamSchema.parse(request.params);
    await deletePlayer({ playerRepository: deps.playerRepository }, id);
    reply.code(204).send();
  });

  fastify.get('/players/:id/licenses', async (request) => {
    const { id } = playerIdParamSchema.parse(request.params);
    return deps.licenseRepository.findMany({ playerId: id });
  });
}
