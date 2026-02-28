import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createLicenseSchema, createLicensesBatchSchema } from '@hoop/shared';
import { listLicenses } from '../../application/license/listLicenses.js';
import { createLicense } from '../../application/license/createLicense.js';
import { createLicensesBatch } from '../../application/license/createLicensesBatch.js';
import type { LicenseRepository } from '../../domain/license/licenseRepository.js';
import type { SeasonRepository } from '../../domain/season/seasonRepository.js';
import type { PlayerRepository } from '../../domain/player/playerRepository.js';

const licenseStatusValues = ['active', 'expired'] as const;

const querySchema = z.object({
  seasonId: z.string().uuid().optional(),
  status: z.enum(licenseStatusValues).optional(),
  category: z.string().optional(),
});

interface LicenseRoutesDeps {
  readonly licenseRepository: LicenseRepository;
  readonly seasonRepository: SeasonRepository;
  readonly playerRepository: PlayerRepository;
}

export async function licenseRoutes(
  fastify: FastifyInstance,
  deps: LicenseRoutesDeps,
): Promise<void> {
  fastify.get('/licenses', async (request) => {
    const query = querySchema.parse(request.query ?? {});
    return listLicenses({ licenseRepository: deps.licenseRepository }, query);
  });

  fastify.post('/licenses', async (request, reply) => {
    const body = createLicenseSchema.parse(request.body);
    const license = await createLicense(
      {
        licenseRepository: deps.licenseRepository,
        seasonRepository: deps.seasonRepository,
        playerRepository: deps.playerRepository,
      },
      body,
    );
    reply.code(201).send(license);
  });

  fastify.post('/licenses/batch', async (request, reply) => {
    const body = createLicensesBatchSchema.parse(request.body);
    const licenses = await createLicensesBatch(
      {
        licenseRepository: deps.licenseRepository,
        seasonRepository: deps.seasonRepository,
        playerRepository: deps.playerRepository,
      },
      body.licenses,
    );
    reply.code(201).send({ licenses });
  });
}
