import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { PlayerRepository } from '../../domain/player/playerRepository.js';
import type { SeasonRepository } from '../../domain/season/seasonRepository.js';
import {
  processXlsxTemplate,
  processDocxTemplate,
} from '../../infrastructure/template/templateProcessor.js';
import type { DocumentContext } from '../../infrastructure/template/templateProcessor.js';

interface DocumentRoutesDeps {
  readonly prisma: PrismaClient;
  readonly playerRepository: PlayerRepository;
  readonly seasonRepository: SeasonRepository;
}

const generateSchema = z.object({
  templateId: z.string().uuid(),
  playerIds: z.array(z.string().uuid()).min(1),
  seasonId: z.string().uuid(),
});

export async function documentRoutes(
  fastify: FastifyInstance,
  deps: DocumentRoutesDeps,
): Promise<void> {
  fastify.post('/documents/generate', async (request, reply) => {
    if (!request.jwtPayload) {
      throw new Error('Unauthorized');
    }
    const clubId = request.jwtPayload.clubId;
    if (!clubId) {
      throw new Error('No club associated');
    }

    const input = generateSchema.parse(request.body);

    const template = await deps.prisma.template.findUnique({
      where: { id: input.templateId },
    });
    if (!template || template.clubId !== clubId) {
      throw new Error('Template not found');
    }

    const club = await deps.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      throw new Error('Club not found');
    }

    const season = await deps.seasonRepository.findById(input.seasonId);
    if (!season) {
      throw new Error('Season not found');
    }

    const players = await Promise.all(
      input.playerIds.map(async (playerId) => {
        const player = await deps.playerRepository.findById(playerId);
        if (!player) {
          throw new Error(`Player ${playerId} not found`);
        }
        return { player };
      }),
    );

    const categories = await deps.prisma.categoryConfig.findMany({
      where: { clubId },
      orderBy: { displayOrder: 'asc' },
    });

    const context: DocumentContext = {
      seasonLabel: season.label,
      clubName: club.name,
      clubSection: club.section,
      exportDate: new Date().toLocaleDateString('fr-FR'),
      players,
      categories: categories.map((c) => ({
        name: c.name,
        minAge: c.minAge,
        maxAge: c.maxAge,
      })),
    };

    let buffer: Buffer;
    let contentType: string;
    let ext: string;

    if (template.format === 'xlsx') {
      buffer = await processXlsxTemplate(Buffer.from(template.fileData), context);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      ext = 'xlsx';
    } else {
      buffer = await processDocxTemplate(Buffer.from(template.fileData), context);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      ext = 'docx';
    }

    const filename = `${template.name}-${season.label}.${ext}`;

    reply
      .header('Content-Type', contentType)
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(buffer);
  });
}
