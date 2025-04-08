import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { loadConfig } from './config.js';
import { prisma } from './infrastructure/prisma/prismaClient.js';
import { authPlugin } from './interface/plugins/authPlugin.js';
import { errorPlugin } from './interface/plugins/errorPlugin.js';
import { createPrismaPlayerRepository } from './infrastructure/prisma/repositories/prismaPlayerRepository.js';
import { createPrismaLicenseRepository } from './infrastructure/prisma/repositories/prismaLicenseRepository.js';
import { createPrismaSeasonRepository } from './infrastructure/prisma/repositories/prismaSeasonRepository.js';
import { createPrismaUserRepository } from './infrastructure/prisma/repositories/prismaUserRepository.js';
import { authRoutes } from './interface/routes/authRoutes.js';
import { clubRoutes } from './interface/routes/clubRoutes.js';
import { playerRoutes } from './interface/routes/playerRoutes.js';
import { licenseRoutes } from './interface/routes/licenseRoutes.js';
import { seasonRoutes } from './interface/routes/seasonRoutes.js';
import { dashboardRoutes } from './interface/routes/dashboardRoutes.js';
import { templateRoutes } from './interface/routes/templateRoutes.js';
import { documentRoutes } from './interface/routes/documentRoutes.js';
import { categoryRoutes } from './interface/routes/categoryRoutes.js';

const config = loadConfig();

const fastify = Fastify({ logger: true });

const playerRepository = createPrismaPlayerRepository(prisma);
const licenseRepository = createPrismaLicenseRepository(prisma);
const seasonRepository = createPrismaSeasonRepository(prisma);
const userRepository = createPrismaUserRepository(prisma);

async function start(): Promise<void> {
  await fastify.register(cors, { origin: config.corsOrigin });
  await fastify.register(jwt, { secret: config.jwtSecret });
  await fastify.register(authPlugin);
  await fastify.register(errorPlugin);
  await fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  await fastify.register(
    async (app) => {
      await authRoutes(app, { userRepository });
    },
    { prefix: '/api' },
  );

  await fastify.register(
    async (app) => {
      app.addHook('preHandler', fastify.authenticate);

      await clubRoutes(app, { prisma });
      await categoryRoutes(app, { prisma });
      await playerRoutes(app, { playerRepository, licenseRepository, prisma });
      await licenseRoutes(app, { licenseRepository, seasonRepository, playerRepository });
      await seasonRoutes(app, { seasonRepository });
      await dashboardRoutes(app, {
        playerRepository,
        licenseRepository,
        seasonRepository,
      });
      await templateRoutes(app, { prisma });
      await documentRoutes(app, { prisma, playerRepository, seasonRepository });
    },
    { prefix: '/api' },
  );

  await fastify.listen({ port: config.port, host: config.host });
}

start().catch((error) => {
  fastify.log.error(error);
  process.exit(1);
});
