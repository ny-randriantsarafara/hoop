import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { hasPermission, type Permission, type FeatureKey } from '@hoop/shared';

export interface AuthorizeOptions {
  readonly permission?: Permission;
  readonly featureKey?: FeatureKey;
}

declare module 'fastify' {
  interface FastifyInstance {
    authorize: (
      options: AuthorizeOptions,
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

interface AuthorizationPluginDeps {
  readonly prisma: PrismaClient;
}

async function authorizationPluginCallback(
  fastify: FastifyInstance,
  deps: AuthorizationPluginDeps,
): Promise<void> {
  fastify.decorate(
    'authorize',
    (options: AuthorizeOptions) =>
      async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        if (!request.jwtPayload) {
          throw new Error('Unauthorized');
        }

        const { role, clubId } = request.jwtPayload;

        // Check permission
        if (options.permission) {
          const allowed = hasPermission(
            role as Parameters<typeof hasPermission>[0],
            options.permission,
          );
          if (!allowed) {
            throw new Error('Forbidden');
          }
        }

        // Check feature flag
        if (options.featureKey && clubId) {
          const flag = await deps.prisma.featureFlag.findUnique({
            where: {
              clubId_key: {
                clubId,
                key: options.featureKey,
              },
            },
          });

          // If flag exists and is disabled, block access
          // If flag doesn't exist, default to enabled (except for OCR which we'll seed as disabled)
          if (flag && !flag.enabled) {
            throw new Error('Feature disabled');
          }
        }
      },
  );
}

export const authorizationPlugin = fp(authorizationPluginCallback, {
  name: 'authorization-plugin',
  dependencies: ['auth-plugin'],
});
