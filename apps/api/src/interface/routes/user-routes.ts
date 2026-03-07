import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createUserSchema, updateUserSchema, resetUserPasswordSchema } from '@hoop/shared';
import type { UserRepository } from '../../domain/user/user.repository';
import { listUsers } from '../../application/user/list-users';
import { getUser } from '../../application/user/get-user';
import { createUser } from '../../application/user/create-user';
import { updateUser } from '../../application/user/update-user';
import { deleteUser } from '../../application/user/delete-user';
import { resetUserPassword } from '../../application/user/reset-user-password';

interface UserRoutesDeps {
  readonly userRepository: UserRepository;
}

const userIdParamSchema = z.object({ id: z.string().uuid() });

function resolveClubId(payload: { clubId?: string | null } | null | undefined): string {
  const clubId = payload?.clubId;
  if (!clubId) {
    throw new Error('No club associated');
  }

  return clubId;
}

export async function userRoutes(fastify: FastifyInstance, deps: UserRoutesDeps): Promise<void> {
  fastify.get('/users', async (request) => {
    const clubId = resolveClubId(request.jwtPayload);
    return listUsers({ userRepository: deps.userRepository }, clubId);
  });

  fastify.get('/users/:id', async (request) => {
    const clubId = resolveClubId(request.jwtPayload);
    const { id } = userIdParamSchema.parse(request.params);
    return getUser({ userRepository: deps.userRepository }, id, clubId);
  });

  fastify.post('/users', async (request, reply) => {
    const clubId = resolveClubId(request.jwtPayload);
    const input = createUserSchema.parse(request.body);
    const user = await createUser({ userRepository: deps.userRepository }, clubId, input);
    reply.code(201).send(user);
  });

  fastify.put('/users/:id', async (request) => {
    const clubId = resolveClubId(request.jwtPayload);
    const { id } = userIdParamSchema.parse(request.params);
    const input = updateUserSchema.parse(request.body);
    return updateUser({ userRepository: deps.userRepository }, id, clubId, input);
  });

  fastify.delete('/users/:id', async (request, reply) => {
    const clubId = resolveClubId(request.jwtPayload);
    const { id } = userIdParamSchema.parse(request.params);
    await deleteUser({ userRepository: deps.userRepository }, id, clubId);
    reply.code(204).send();
  });

  fastify.post('/users/:id/reset-password', async (request, reply) => {
    const clubId = resolveClubId(request.jwtPayload);
    const { id } = userIdParamSchema.parse(request.params);
    const input = resetUserPasswordSchema.parse(request.body);
    await resetUserPassword({ userRepository: deps.userRepository }, id, clubId, input.password);
    reply.code(204).send();
  });
}
