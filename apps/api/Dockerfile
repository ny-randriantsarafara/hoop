FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm build
WORKDIR /app
RUN pnpm --filter @hoop/api deploy --legacy --prod /prod/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup -S api && adduser -S api -G api

COPY --from=builder /prod/api ./

RUN chown -R api:api /app
USER api

EXPOSE 3001
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec tsx dist/server.js"]
