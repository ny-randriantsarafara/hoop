import type { FastifyInstance, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

async function errorPluginCallback(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler(function (error: FastifyError, _request, reply) {
    if (error instanceof ZodError) {
      reply.code(400).send({
        error: 'Validation Error',
        details: error.errors,
      });
      return;
    }

    if (error.message === 'Invalid credentials') {
      reply.code(401).send({ error: error.message });
      return;
    }

    if (error.message === 'Unauthorized') {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    if (error.message === 'Forbidden') {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    if (error.message.includes('No club') || error.message.includes('no club')) {
      reply.code(403).send({ error: error.message });
      return;
    }

    if (error.message.includes('not found')) {
      reply.code(404).send({ error: error.message });
      return;
    }

    if (error.message.includes('Unsupported file type')) {
      reply.code(400).send({ error: error.message });
      return;
    }

    if (error.message.includes('Cannot') || error.message.includes('can only')) {
      reply.code(400).send({ error: error.message });
      return;
    }

    fastify.log.error(error);
    reply.code(500).send({ error: 'Internal Server Error' });
  });
}

export const errorPlugin = fp(errorPluginCallback, { name: 'error-plugin' });
