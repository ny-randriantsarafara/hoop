import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { allPlaceholders, cellMappingSchema } from '@hoop/shared';
import { previewTemplate } from '../../application/template/previewTemplate';
import { writePlaceholdersToXlsx } from '../../infrastructure/template/xlsxPlaceholderWriter';

interface TemplateRoutesDeps {
  readonly prisma: PrismaClient;
}

const placeholderRegex = /\{\{(\w+)\}\}/g;

function getFieldStringValue(field: unknown): string | null {
  if (field === undefined) return null;
  const part = Array.isArray(field) ? field[0] : field;
  if (
    !part ||
    typeof part !== 'object' ||
    !('type' in part) ||
    part.type !== 'field' ||
    !('value' in part)
  )
    return null;
  const val = part.value;
  return val !== undefined && val !== null ? String(val) : null;
}

export async function templateRoutes(
  fastify: FastifyInstance,
  deps: TemplateRoutesDeps,
): Promise<void> {
  fastify.get('/templates', async (request) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    const templates = await deps.prisma.template.findMany({
      where: { clubId },
      select: {
        id: true,
        name: true,
        description: true,
        format: true,
        placeholders: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return templates;
  });

  fastify.get('/templates/:id/download', async (request, reply) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const template = await deps.prisma.template.findUnique({ where: { id } });
    if (!template || template.clubId !== clubId) {
      throw new Error('Template not found');
    }

    const contentType =
      template.format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    reply.header('Content-Type', contentType);
    reply.header(
      'Content-Disposition',
      `attachment; filename="${template.name}.${template.format}"`,
    );
    return reply.send(Buffer.from(template.fileData));
  });

  fastify.get('/templates/:id', async (request) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const template = await deps.prisma.template.findUnique({ where: { id } });
    if (!template || template.clubId !== clubId) {
      throw new Error('Template not found');
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      format: template.format,
      placeholders: template.placeholders,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  });

  fastify.post('/templates', async (request, reply) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    const data = await request.file();
    if (!data) throw new Error('No file uploaded');

    let buffer = await data.toBuffer();
    const filename = data.filename;

    const nameField = data.fields['name'];
    const descField = data.fields['description'];
    const cellMappingsField = data.fields['cellMappings'];

    const name = getFieldStringValue(nameField) ?? filename;
    const description = getFieldStringValue(descField);
    const cellMappingsRaw = getFieldStringValue(cellMappingsField);

    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'docx') {
      throw new Error('Unsupported file format. Only .xlsx and .docx are supported.');
    }
    const format = ext;

    let placeholders: string[];

    if (cellMappingsRaw && ext === 'xlsx') {
      const parsed = JSON.parse(cellMappingsRaw);
      const mappings = z.array(cellMappingSchema).parse(parsed);

      const tokenRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
      const allFoundKeys: string[] = [];
      for (const m of mappings) {
        for (const match of m.value.matchAll(tokenRegex)) {
          allFoundKeys.push(`{{${match[1]}}}`);
        }
      }
      const invalidKeys = allFoundKeys.filter((k) => !(allPlaceholders as readonly string[]).includes(k));
      if (invalidKeys.length > 0) {
        throw new Error(`Invalid placeholder keys: ${[...new Set(invalidKeys)].join(', ')}`);
      }

      buffer = await writePlaceholdersToXlsx(buffer, mappings);
      placeholders = [...new Set(allFoundKeys)];
    } else {
      const textContent = buffer.toString('utf-8');
      const foundPlaceholders = new Set<string>();
      let match: RegExpExecArray | null;
      placeholderRegex.lastIndex = 0;
      while ((match = placeholderRegex.exec(textContent)) !== null) {
        const placeholder = `{{${match[1]}}}`;
        if ((allPlaceholders as readonly string[]).includes(placeholder)) {
          foundPlaceholders.add(placeholder);
        }
      }
      placeholders = Array.from(foundPlaceholders);
    }

    const template = await deps.prisma.template.create({
      data: {
        clubId,
        name,
        description,
        format,
        fileData: new Uint8Array(buffer),
        placeholders,
      },
      select: {
        id: true,
        name: true,
        description: true,
        format: true,
        placeholders: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    reply.code(201).send(template);
  });

  fastify.delete('/templates/:id', async (request, reply) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const template = await deps.prisma.template.findUnique({ where: { id } });
    if (!template || template.clubId !== clubId) {
      throw new Error('Template not found');
    }

    await deps.prisma.template.delete({ where: { id } });
    reply.code(204).send();
  });

  fastify.post('/templates/preview', async (request, reply) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');

    const data = await request.file();
    if (!data) throw new Error('No file uploaded');

    const buffer = await data.toBuffer();

    try {
      const preview = await previewTemplate(buffer, data.filename);
      return reply.send(preview);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      return reply.code(422).send({ error: message });
    }
  });

  const generateSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    columns: z.array(z.string()).min(1),
  });

  fastify.post('/templates/generate', async (request, reply) => {
    if (!request.jwtPayload) throw new Error('Unauthorized');
    const clubId = request.jwtPayload.clubId;
    if (!clubId) throw new Error('No club associated');

    const input = generateSchema.parse(request.body);

    const validColumns = input.columns.filter((col) =>
      (allPlaceholders as readonly string[]).includes(col),
    );
    if (validColumns.length === 0) {
      throw new Error('No valid placeholders selected');
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Template');

    sheet.addRow(validColumns);

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();
    const fileData = new Uint8Array(excelBuffer);

    const template = await deps.prisma.template.create({
      data: {
        clubId,
        name: input.name,
        description: input.description ?? null,
        format: 'xlsx',
        fileData,
        placeholders: validColumns,
      },
      select: {
        id: true,
        name: true,
        description: true,
        format: true,
        placeholders: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    reply.code(201).send(template);
  });
}
