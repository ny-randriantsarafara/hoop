# Hoop Auth And API Namespace Design

## Context

`hoop` currently serves two different systems under the public `/api` namespace:

- Fastify serves the business API under `/api/*`
- NextAuth serves session and credentials routes under `/api/auth/*`

That overlap forces the public proxy to understand individual endpoint ownership. The recent attempt to split those paths in Caddy did not hold up, and the deeper problem is the namespace collision itself rather than a missing matcher.

## Problem

The current routing model is brittle:

- Caddy cannot route `/api/*` by stable ownership because both upstreams claim part of the same path space
- every new Fastify route risks needing proxy changes or colliding with web-owned auth routes
- failures can surface as misleading proxy-level `404` responses rather than application-level errors

The desired outcome is a public routing model that stays correct as the API grows.

## Goals

- Make `hoop-api` the sole public owner of `/api/*`
- Move NextAuth to a separate public namespace
- Reduce Caddy routing to stable namespace-based rules
- Preserve the current login architecture where NextAuth calls Fastify's internal login endpoint

## Non-Goals

- Replacing NextAuth with a new auth system
- Moving the Fastify API to a different domain
- Redesigning JWT/session semantics

## Options Considered

### 1. Move NextAuth to `/auth/*` and leave Fastify on `/api/*`

Public routing becomes:

- `/api/*` -> `hoop-api`
- `/auth/*` -> `hoop-web`
- everything else -> `hoop-web`

Chosen because it removes the namespace collision completely while keeping the current separation of responsibilities.

### 2. Keep NextAuth on `/api/auth/*` and maintain proxy exceptions

Rejected because it remains operationally fragile. Every new route still depends on maintaining Caddy behavior around a shared namespace.

### 3. Move Fastify to a new public namespace such as `/backend/*`

Rejected because it pushes churn onto all API consumers while failing to solve any problem that option 1 does not solve more cleanly.

## Approved Design

### Architecture

`hoop-api` becomes the sole owner of public `/api/*`. `hoop-web` serves NextAuth under `/auth/*` and continues to serve all page requests.

NextAuth keeps the current Credentials-provider flow. During login, the web container still calls the internal Fastify endpoint at `API_URL/auth/login`. Only the browser-facing NextAuth route surface moves from `/api/auth/*` to `/auth/*`.

### Routing And Data Flow

Public Caddy routing becomes namespace-based:

- `/api/*` -> `hoop-api:3001`
- `/auth/*` -> `hoop-web:3000`
- `/*` -> `hoop-web:3000`

Browser auth traffic goes to `/auth/*`. Browser API traffic continues to go to `/api/*`.

The login flow remains:

1. browser calls NextAuth under `/auth/...`
2. NextAuth server logic calls Fastify at `API_URL/auth/login`
3. Fastify returns the JWT and user payload
4. NextAuth persists session state for the browser

### Error Handling

After the change:

- missing public API routes should fail inside Fastify, not because of proxy ambiguity
- auth route failures should be isolated to `/auth/*`
- new Fastify endpoints under `/api/*` should require no Caddy updates

### Testing

Verification should cover:

- `GET /api/health`
- authenticated `GET /api/categories`
- authenticated `GET /api/dashboard/stats`
- `GET /auth/session`
- browser login and logout

## Risks

- NextAuth client helpers often assume the default `/api/auth` base path, so the web app must be updated consistently for `/auth`
- any hard-coded `/api/auth` references in docs, route files, or client configuration will break auth if missed

## Mitigation

- treat the auth base path as one explicit configuration concern in the web app
- search the repo for `/api/auth` and `next-auth` client usage during implementation
- update deployment and architecture docs to make the namespace split obvious
