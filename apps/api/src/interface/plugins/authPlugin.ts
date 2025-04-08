import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export interface JwtPayload {
  readonly userId: string;
  readonly role: string;
  readonly clubId: string | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    jwtPayload: JwtPayload | undefined;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const jwtPayloadDefault: JwtPayload | undefined = undefined;

async function authPluginCallback(fastify: FastifyInstance): Promise<void> {
  fastify.decorateRequest('jwtPayload', jwtPayloadDefault);

  fastify.decorate('authenticate', async function (request: FastifyRequest) {
    try {
      const decoded = await request.jwtVerify<JwtPayload>();
      request.jwtPayload = decoded;
    } catch {
      throw new Error('Unauthorized');
    }
  });
}

export const authPlugin = fp(authPluginCallback, { name: 'auth-plugin' });
