import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { loadConfig } from './config';
import { prisma } from './infrastructure/prisma/prisma-client';
import { authPlugin } from './interface/plugins/auth-plugin';
import { errorPlugin } from './interface/plugins/error-plugin';
import { createPrismaPlayerRepository } from './infrastructure/prisma/repositories/player.repository';
import { createPrismaLicenseRepository } from './infrastructure/prisma/repositories/license.repository';
import { createPrismaSeasonRepository } from './infrastructure/prisma/repositories/season.repository';
import { createPrismaUserRepository } from './infrastructure/prisma/repositories/user.repository';
import { createPrismaCategoryRepository } from './infrastructure/prisma/repositories/category.repository';
import { authRoutes } from './interface/routes/auth-routes';
import { healthRoutes } from './interface/routes/health-routes';
import { clubRoutes } from './interface/routes/club-routes';
import { playerRoutes } from './interface/routes/player-routes';
import { licenseRoutes } from './interface/routes/license-routes';
import { seasonRoutes } from './interface/routes/season-routes';
import { dashboardRoutes } from './interface/routes/dashboard-routes';
import { templateRoutes } from './interface/routes/template-routes';
import { documentRoutes } from './interface/routes/document-routes';
import { categoryRoutes } from './interface/routes/category-routes';
import { ocrRoutes } from './interface/routes/ocr-routes';
import { createOllamaOcrService } from './infrastructure/ocr/ollama-ocr-service';

const config = loadConfig();

const fastify = Fastify({ logger: true });

const playerRepository = createPrismaPlayerRepository(prisma);
const licenseRepository = createPrismaLicenseRepository(prisma);
const seasonRepository = createPrismaSeasonRepository(prisma);
const userRepository = createPrismaUserRepository(prisma);
const categoryRepository = createPrismaCategoryRepository(prisma);
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
      await healthRoutes(app);
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
      await licenseRoutes(app, {
        licenseRepository,
        seasonRepository,
        playerRepository,
        categoryRepository,
      });
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
