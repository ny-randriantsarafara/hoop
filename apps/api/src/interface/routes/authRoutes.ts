import type { FastifyInstance } from 'fastify';
import { loginSchema } from '@hoop/shared';
import { authenticateUser } from '../../application/auth/authenticateUser.js';
import type { UserRepository } from '../../domain/user/userRepository.js';

interface AuthRoutesDeps {
  readonly userRepository: UserRepository;
}

export async function authRoutes(fastify: FastifyInstance, deps: AuthRoutesDeps): Promise<void> {
  fastify.post('/auth/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const result = await authenticateUser({ userRepository: deps.userRepository }, input);

    const token = fastify.jwt.sign(
      { userId: result.userId, role: result.role, clubId: result.clubId },
      { expiresIn: '24h' },
    );

    reply.send({ token, user: result });
  });

  fastify.get('/auth/me', { preHandler: [fastify.authenticate] }, async (request) => {
    return request.jwtPayload;
  });
}
