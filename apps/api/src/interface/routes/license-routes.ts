import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createLicenseSchema, createLicensesBatchSchema } from '@hoop/shared';
import { listLicenses } from '../../application/license/listLicenses';
import { createLicense } from '../../application/license/create-license';
import { createLicensesBatch } from '../../application/license/create-licenses-batch';
import type { LicenseRepository } from '../../domain/license/license.repository';
import type { SeasonRepository } from '../../domain/season/season.repository';
import type { PlayerRepository } from '../../domain/player/player.repository';
import type { CategoryRepository } from '../../domain/category/category-repository';

const licenseStatusValues = ['active', 'expired'] as const;

const querySchema = z.object({
  seasonId: z.string().uuid().optional(),
  status: z.enum(licenseStatusValues).optional(),
  categoryId: z.string().uuid().optional(),
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
  readonly categoryRepository: CategoryRepository;
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
        categoryRepository: deps.categoryRepository,
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
        categoryRepository: deps.categoryRepository,
      },
      body.licenses,
    );
    reply.code(201).send({ licenses });
  });
}
