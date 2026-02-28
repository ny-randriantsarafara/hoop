import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createLicenseSchema, createLicensesBatchSchema } from '@hoop/shared';
import { listLicenses } from '../../application/license/listLicenses';
import { createLicense } from '../../application/license/createLicense';
import { createLicensesBatch } from '../../application/license/createLicensesBatch';
import type { LicenseRepository } from '../../domain/license/licenseRepository';
import type { SeasonRepository } from '../../domain/season/seasonRepository';
import type { PlayerRepository } from '../../domain/player/playerRepository';

const licenseStatusValues = ['active', 'expired'] as const;

const querySchema = z.object({
  seasonId: z.string().uuid().optional(),
  status: z.enum(licenseStatusValues).optional(),
  category: z.string().optional(),
  number: z.string().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  endDateFrom: z.coerce.date().optional(),
  endDateTo: z.coerce.date().optional(),
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
