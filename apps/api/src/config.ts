import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3001),
  host: z.string().default('0.0.0.0'),
  databaseUrl: z.string(),
  jwtSecret: z.string(),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  corsOrigin: z.string().default('http://localhost:3000'),
  ollamaBaseUrl: z.string().default('http://localhost:11434'),
  ollamaModel: z.string().default('minicpm-v'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.PORT,
    host: process.env.HOST,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
    ollamaModel: process.env.OLLAMA_MODEL,
  });
}
