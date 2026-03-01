import Fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { errorPlugin } from './error-plugin';

describe('errorPlugin', () => {
  const app = Fastify();

  afterEach(async () => {
    await app.close();
  });

  it('returns conflict for duplicate license number', async () => {
    await app.register(errorPlugin);
    app.get('/duplicate-license', async () => {
      throw Object.assign(new Error('Unique constraint failed on the fields: (`number`)'), {
        code: 'P2002',
        meta: { target: ['number'] },
      });
    });

    const response = await app.inject({ method: 'GET', url: '/duplicate-license' });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ error: 'License number already exists' });
  });
});
