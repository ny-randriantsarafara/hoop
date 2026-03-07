# Hoop Public API Routing Design

## Context

`hoop` recently switched the browser client to same-origin API calls under `/api`, and `vps-services` recently moved Hoop behind a single public domain. In production, browser requests such as `/api/categories`, `/api/players`, `/api/seasons`, `/api/dashboard/stats`, and `/api/clubs/me` return `404` even though the Fastify API serves those endpoints under the `/api` prefix.

Authentication still works because the NextAuth server-side flow in the web container calls the API through the internal `API_URL=http://hoop-api:3001/api`. That means the production failure is at the public routing boundary, not in the Fastify application itself.

## Problem

The public `/api/*` namespace is shared by two different upstreams:

- `hoop-web` owns NextAuth routes under `/api/auth/*`
- `hoop-api` owns the Fastify application routes under `/api/*`

The current Caddy rule in `vps-services/caddy/Caddyfile` sends `/api/*` as one coarse group, which is not sufficient for this split namespace. The proxy must decide path ownership explicitly.

## Goals

- Keep the single public domain `https://hoop.nyhasinavalona.com`
- Preserve browser API calls to `/api/*`
- Preserve NextAuth under `/api/auth/*`
- Restore public access to the Fastify API routes without changing application route prefixes

## Non-Goals

- Moving the API to a new subdomain
- Renaming the API prefix from `/api`
- Introducing a Next.js rewrite layer for API traffic

## Options Considered

### 1. Explicit Caddy split for `/api/auth/*` and Fastify routes

Route `/api/auth/*` to `hoop-web:3000`, route the known Fastify route groups to `hoop-api:3001`, and keep all other traffic on `hoop-web:3000`.

Chosen because it is the smallest production change, preserves public URLs, and keeps responsibility for public routing in the infrastructure repo.

### 2. Move Fastify to a new public prefix or subdomain

Examples: `/backend/*` or `api.hoop.nyhasinavalona.com`.

Rejected for now because it would require coordinated changes in client code, deployment variables, and documentation for a problem that can be solved in the proxy.

### 3. Proxy all traffic through Next.js and rewrite selected API paths there

Rejected because it adds an unnecessary proxy layer and moves infrastructure routing concerns into the web application.

## Approved Design

### Architecture

Keep the existing Fastify `/api` prefix and the existing browser API usage in `hoop`. Fix the production path split in `vps-services/caddy/Caddyfile`.

### Routing Behavior

Use ordered, explicit Caddy handlers:

- `/api/auth/*` -> `hoop-web:3000`
- `/api/health` -> `hoop-api:3001`
- `/api/categories*` -> `hoop-api:3001`
- `/api/players*` -> `hoop-api:3001`
- `/api/seasons*` -> `hoop-api:3001`
- `/api/clubs*` -> `hoop-api:3001`
- `/api/dashboard*` -> `hoop-api:3001`
- `/api/licenses*` -> `hoop-api:3001`
- `/api/templates*` -> `hoop-api:3001`
- `/api/documents*` -> `hoop-api:3001`
- `/api/ocr*` -> `hoop-api:3001`
- fallback -> `hoop-web:3000`

No path rewriting is required. The proxy should preserve the full URI when forwarding to Fastify.

### Error Handling

After the change:

- valid authenticated API calls should reach Fastify and return normal API responses
- unauthenticated protected API calls should return `401` from Fastify instead of a proxy-level `404`
- NextAuth should continue to function under `/api/auth/*`

### Verification

- validate the Caddy configuration after the route change
- smoke test public routes such as `/api/health`, `/api/seasons`, and an authenticated endpoint like `/api/categories`
- verify that `/api/auth/session` still resolves through the web app

## Risks

- Missing any existing Fastify route group in the explicit Caddy list would leave that endpoint falling through to the web app and still producing `404`
- A future new Fastify route group will need a matching Caddy rule unless the route map is updated in the same change

## Mitigation

- Use the route registrations in `apps/api/src/server.ts` as the source of truth for the explicit matcher list
- Update deployment docs so future route additions account for the shared `/api` namespace
