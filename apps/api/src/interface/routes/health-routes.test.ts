import Fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { healthRoutes } from './health-routes';

describe('healthRoutes', () => {
  const app = Fastify();

  afterEach(async () => {
    await app.close();
  });

  it('returns healthy status', async () => {
    await app.register(
      async (instance) => {
        await healthRoutes(instance);
      },
      { prefix: '/api' },
    );

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
