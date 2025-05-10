import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createSeasonSchema, updateSeasonSchema } from '@hoop/shared';
import type { SeasonRepository } from '../../domain/season/seasonRepository.js';

interface SeasonRoutesDeps {
  readonly seasonRepository: SeasonRepository;
}

export async function seasonRoutes(fastify: FastifyInstance, deps: SeasonRoutesDeps): Promise<void> {
  fastify.get('/seasons', async () => {
    return deps.seasonRepository.findAll();
  });

  fastify.post('/seasons', async (request, reply) => {
    const input = createSeasonSchema.parse(request.body);
    if (input.active) {
      await deps.seasonRepository.deactivateAll();
    }
    const season = await deps.seasonRepository.create(input);
    reply.code(201).send(season);
  });

  fastify.put('/seasons/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = updateSeasonSchema.parse(request.body);
    if (input.active === true) {
      await deps.seasonRepository.deactivateAll();
    }
    return deps.seasonRepository.update(id, input);
  });

  fastify.delete('/seasons/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    await deps.seasonRepository.delete(id);
    reply.code(204).send();
  });
}
