import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { loadConfig } from './config';
import { prisma } from './infrastructure/prisma/prismaClient';
import { authPlugin } from './interface/plugins/authPlugin';
import { errorPlugin } from './interface/plugins/errorPlugin';
import { createPrismaPlayerRepository } from './infrastructure/prisma/repositories/prismaPlayerRepository';
import { createPrismaLicenseRepository } from './infrastructure/prisma/repositories/prismaLicenseRepository';
import { createPrismaSeasonRepository } from './infrastructure/prisma/repositories/prismaSeasonRepository';
import { createPrismaUserRepository } from './infrastructure/prisma/repositories/prismaUserRepository';
import { authRoutes } from './interface/routes/authRoutes';
import { clubRoutes } from './interface/routes/clubRoutes';
import { playerRoutes } from './interface/routes/playerRoutes';
import { licenseRoutes } from './interface/routes/licenseRoutes';
import { seasonRoutes } from './interface/routes/seasonRoutes';
import { dashboardRoutes } from './interface/routes/dashboardRoutes';
import { templateRoutes } from './interface/routes/templateRoutes';
import { documentRoutes } from './interface/routes/documentRoutes';
import { categoryRoutes } from './interface/routes/categoryRoutes';
import { ocrRoutes } from './interface/routes/ocrRoutes';
import { createOllamaOcrService } from './infrastructure/ocr/ollamaOcrService';

const config = loadConfig();

const fastify = Fastify({ logger: true });

const playerRepository = createPrismaPlayerRepository(prisma);
const licenseRepository = createPrismaLicenseRepository(prisma);
const seasonRepository = createPrismaSeasonRepository(prisma);
const userRepository = createPrismaUserRepository(prisma);
const ocrService = createOllamaOcrService(config.ollamaBaseUrl, config.ollamaModel);

async function start(): Promise<void> {
  await fastify.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
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
        prisma,
      });
      await templateRoutes(app, { prisma });
      await documentRoutes(app, { prisma, playerRepository, seasonRepository });
      await ocrRoutes(app, { ocrService, prisma });
    },
    { prefix: '/api' },
  );

  await fastify.listen({ port: config.port, host: config.host });
}

start().catch((error) => {
  fastify.log.error(error);
  process.exit(1);
});
