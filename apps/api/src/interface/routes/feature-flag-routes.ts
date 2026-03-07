import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Permission, FeatureKey } from '@hoop/shared';

interface FeatureFlagRoutesDeps {
  readonly prisma: PrismaClient;
}

const updateFeatureFlagSchema = z.object({
  key: z.nativeEnum(FeatureKey),
  enabled: z.boolean(),
});

export async function featureFlagRoutes(
  fastify: FastifyInstance,
  deps: FeatureFlagRoutesDeps,
): Promise<void> {
  const authorizeSettings = fastify.authorize({ permission: Permission.SettingsManage });
  const authorizeAuthenticated = fastify.authorize({});

  // Get all feature flags for the current club
  fastify.get('/feature-flags', { preHandler: authorizeAuthenticated }, async (request) => {
    if (!request.jwtPayload) {
      throw new Error('Unauthorized');
    }
    const clubId = request.jwtPayload.clubId;
    if (!clubId) {
      throw new Error('No club associated');
    }

    const flags = await deps.prisma.featureFlag.findMany({
      where: { clubId },
    });

    // Return all defined feature keys with their status
    const allKeys = Object.values(FeatureKey);
    return allKeys.map((key) => {
      const flag = flags.find((f: { key: string; enabled: boolean }) => f.key === key);
      return {
        key,
        enabled: flag?.enabled ?? key !== FeatureKey.OcrImport,
      };
    });
  });

  // Update a feature flag
  fastify.put('/feature-flags', { preHandler: authorizeSettings }, async (request) => {
    if (!request.jwtPayload) {
      throw new Error('Unauthorized');
    }
    const clubId = request.jwtPayload.clubId;
    if (!clubId) {
      throw new Error('No club associated');
    }

    const input = updateFeatureFlagSchema.parse(request.body);

    const flag = await deps.prisma.featureFlag.upsert({
      where: {
        clubId_key: {
          clubId,
          key: input.key,
        },
      },
      update: {
        enabled: input.enabled,
      },
      create: {
        clubId,
        key: input.key,
        enabled: input.enabled,
      },
    });

    return {
      key: flag.key,
      enabled: flag.enabled,
    };
  });
}
