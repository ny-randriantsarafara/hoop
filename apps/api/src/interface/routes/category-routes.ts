import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createCategorySchema, updateCategorySchema } from '@hoop/shared';

interface CategoryRoutesDeps {
  readonly prisma: PrismaClient;
}

export async function categoryRoutes(
  fastify: FastifyInstance,
  deps: CategoryRoutesDeps,
): Promise<void> {
  fastify.get('/categories', async (request) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    return deps.prisma.categoryConfig.findMany({
      where: { clubId },
      orderBy: { displayOrder: 'asc' },
    });
  });

  fastify.post('/categories', async (request, reply) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    const input = createCategorySchema.parse(request.body);
    const category = await deps.prisma.categoryConfig.create({
      data: { ...input, clubId },
    });
    reply.code(201).send(category);
  });

  fastify.put('/categories/:id', async (request) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const input = updateCategorySchema.parse(request.body);

    const existing = await deps.prisma.categoryConfig.findUnique({ where: { id } });
    if (!existing || existing.clubId !== clubId) throw new Error('Category not found');

    return deps.prisma.categoryConfig.update({ where: { id }, data: input });
  });

  fastify.delete('/categories/:id', async (request, reply) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const existing = await deps.prisma.categoryConfig.findUnique({ where: { id } });
    if (!existing || existing.clubId !== clubId) throw new Error('Category not found');

    await deps.prisma.categoryConfig.delete({ where: { id } });
    reply.code(204).send();
  });
}
