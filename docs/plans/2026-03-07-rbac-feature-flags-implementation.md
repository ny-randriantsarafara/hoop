# RBAC & Feature Flags Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement role-based access control with three roles (admin, staff, viewer), a permission matrix, and per-club feature flags with OCR Import disabled by default.

**Architecture:** Shared package defines roles, permissions, and feature keys with a `hasPermission()` function. API adds authorization middleware checking permissions and feature flags. Web filters menus and protects pages using a context provider and wrapper component.

**Tech Stack:** TypeScript, Prisma, Fastify, Next.js, NextAuth, React Context

---

## Task 1: Update Role Enum in Shared Package

**Files:**

- Modify: `packages/shared/src/constants/enums.ts`

**Step 1: Update the Role enum**

Replace the existing Role definition:

```typescript
export const Role = {
  Admin: 'admin',
  Staff: 'staff',
  Viewer: 'viewer',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
```

**Step 2: Run shared lint to verify**

Run: `pnpm --filter @hoop/shared lint`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/shared/src/constants/enums.ts
git commit -m "feat(shared): update Role enum with admin, staff, viewer"
```

---

## Task 2: Add Permission and FeatureKey Enums

**Files:**

- Modify: `packages/shared/src/constants/enums.ts`

**Step 1: Add Permission and FeatureKey constants**

Append to the file after the existing enums:

```typescript
export const Permission = {
  PlayersRead: 'players:read',
  PlayersWrite: 'players:write',
  LicensesRead: 'licenses:read',
  LicensesWrite: 'licenses:write',
  DocumentsRead: 'documents:read',
  DocumentsWrite: 'documents:write',
  TemplatesRead: 'templates:read',
  TemplatesWrite: 'templates:write',
  UsersManage: 'users:manage',
  SettingsManage: 'settings:manage',
  ImportUse: 'import:use',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const FeatureKey = {
  OcrImport: 'ocr_import',
} as const;

export type FeatureKey = (typeof FeatureKey)[keyof typeof FeatureKey];
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/shared lint`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/shared/src/constants/enums.ts
git commit -m "feat(shared): add Permission and FeatureKey enums"
```

---

## Task 3: Create hasPermission Function

**Files:**

- Create: `packages/shared/src/lib/permissions.ts`
- Modify: `packages/shared/src/index.ts`

**Step 1: Write test for hasPermission**

Create: `packages/shared/src/lib/permissions.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { hasPermission } from './permissions';
import { Role, Permission } from '../constants/enums';

describe('hasPermission', () => {
  describe('admin role', () => {
    it('has all permissions', () => {
      expect(hasPermission(Role.Admin, Permission.UsersManage)).toBe(true);
      expect(hasPermission(Role.Admin, Permission.SettingsManage)).toBe(true);
      expect(hasPermission(Role.Admin, Permission.PlayersWrite)).toBe(true);
      expect(hasPermission(Role.Admin, Permission.TemplatesWrite)).toBe(true);
    });
  });

  describe('staff role', () => {
    it('has CRUD permissions for players, licenses, documents', () => {
      expect(hasPermission(Role.Staff, Permission.PlayersRead)).toBe(true);
      expect(hasPermission(Role.Staff, Permission.PlayersWrite)).toBe(true);
      expect(hasPermission(Role.Staff, Permission.LicensesRead)).toBe(true);
      expect(hasPermission(Role.Staff, Permission.LicensesWrite)).toBe(true);
      expect(hasPermission(Role.Staff, Permission.DocumentsRead)).toBe(true);
      expect(hasPermission(Role.Staff, Permission.DocumentsWrite)).toBe(true);
    });

    it('has read-only access to templates', () => {
      expect(hasPermission(Role.Staff, Permission.TemplatesRead)).toBe(true);
      expect(hasPermission(Role.Staff, Permission.TemplatesWrite)).toBe(false);
    });

    it('can use import', () => {
      expect(hasPermission(Role.Staff, Permission.ImportUse)).toBe(true);
    });

    it('cannot manage users or settings', () => {
      expect(hasPermission(Role.Staff, Permission.UsersManage)).toBe(false);
      expect(hasPermission(Role.Staff, Permission.SettingsManage)).toBe(false);
    });
  });

  describe('viewer role', () => {
    it('has read-only permissions', () => {
      expect(hasPermission(Role.Viewer, Permission.PlayersRead)).toBe(true);
      expect(hasPermission(Role.Viewer, Permission.LicensesRead)).toBe(true);
      expect(hasPermission(Role.Viewer, Permission.DocumentsRead)).toBe(true);
      expect(hasPermission(Role.Viewer, Permission.TemplatesRead)).toBe(true);
    });

    it('cannot write anything', () => {
      expect(hasPermission(Role.Viewer, Permission.PlayersWrite)).toBe(false);
      expect(hasPermission(Role.Viewer, Permission.LicensesWrite)).toBe(false);
      expect(hasPermission(Role.Viewer, Permission.DocumentsWrite)).toBe(false);
      expect(hasPermission(Role.Viewer, Permission.TemplatesWrite)).toBe(false);
    });

    it('cannot use import or manage users/settings', () => {
      expect(hasPermission(Role.Viewer, Permission.ImportUse)).toBe(false);
      expect(hasPermission(Role.Viewer, Permission.UsersManage)).toBe(false);
      expect(hasPermission(Role.Viewer, Permission.SettingsManage)).toBe(false);
    });
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('unknown' as Role, Permission.PlayersRead)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @hoop/shared test -- src/lib/permissions.test.ts`
Expected: FAIL - Cannot find module './permissions'

**Step 3: Write the implementation**

Create: `packages/shared/src/lib/permissions.ts`

```typescript
import { Role, Permission } from '../constants/enums';

const PERMISSION_MATRIX: Record<Role, Set<Permission>> = {
  [Role.Admin]: new Set([
    Permission.PlayersRead,
    Permission.PlayersWrite,
    Permission.LicensesRead,
    Permission.LicensesWrite,
    Permission.DocumentsRead,
    Permission.DocumentsWrite,
    Permission.TemplatesRead,
    Permission.TemplatesWrite,
    Permission.UsersManage,
    Permission.SettingsManage,
    Permission.ImportUse,
  ]),
  [Role.Staff]: new Set([
    Permission.PlayersRead,
    Permission.PlayersWrite,
    Permission.LicensesRead,
    Permission.LicensesWrite,
    Permission.DocumentsRead,
    Permission.DocumentsWrite,
    Permission.TemplatesRead,
    Permission.ImportUse,
  ]),
  [Role.Viewer]: new Set([
    Permission.PlayersRead,
    Permission.LicensesRead,
    Permission.DocumentsRead,
    Permission.TemplatesRead,
  ]),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = PERMISSION_MATRIX[role];
  if (!permissions) {
    return false;
  }
  return permissions.has(permission);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @hoop/shared test -- src/lib/permissions.test.ts`
Expected: PASS

**Step 5: Export from shared index**

In `packages/shared/src/index.ts`, add:

```typescript
export { hasPermission } from './lib/permissions';
```

**Step 6: Run lint**

Run: `pnpm --filter @hoop/shared lint`
Expected: No errors

**Step 7: Commit**

```bash
git add packages/shared/src/lib/permissions.ts packages/shared/src/lib/permissions.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): add hasPermission function with permission matrix"
```

---

## Task 4: Add FeatureFlag Model to Prisma Schema

**Files:**

- Modify: `apps/api/prisma/schema.prisma`

**Step 1: Update Role enum in schema**

Find the Role enum and replace:

```prisma
enum Role {
  admin
  staff
  viewer
}
```

**Step 2: Add FeatureFlag model**

Add before the closing of the file:

```prisma
model FeatureFlag {
  id        String   @id @default(uuid())
  clubId    String   @map("club_id")
  key       String
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  club Club @relation(fields: [clubId], references: [id])

  @@unique([clubId, key])
  @@map("feature_flags")
}
```

**Step 3: Add relation to Club model**

In the Club model, add to the relations list:

```prisma
featureFlags   FeatureFlag[]
```

**Step 4: Generate Prisma client**

Run: `pnpm --filter @hoop/api prisma:generate`
Expected: Generated Prisma Client

**Step 5: Create migration**

Run: `pnpm --filter @hoop/api prisma:migrate -- --name add_rbac_and_feature_flags`
Expected: Migration created and applied

**Step 6: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(api): add FeatureFlag model and update Role enum"
```

---

## Task 5: Create Authorization Plugin

**Files:**

- Create: `apps/api/src/interface/plugins/authorization-plugin.ts`

**Step 1: Write the authorization plugin**

```typescript
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { hasPermission, type Permission, type FeatureKey } from '@hoop/shared';

export interface AuthorizeOptions {
  readonly permission?: Permission;
  readonly featureKey?: FeatureKey;
}

declare module 'fastify' {
  interface FastifyInstance {
    authorize: (
      options: AuthorizeOptions,
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

interface AuthorizationPluginDeps {
  readonly prisma: PrismaClient;
}

async function authorizationPluginCallback(
  fastify: FastifyInstance,
  deps: AuthorizationPluginDeps,
): Promise<void> {
  fastify.decorate(
    'authorize',
    (options: AuthorizeOptions) =>
      async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        if (!request.jwtPayload) {
          throw new Error('Unauthorized');
        }

        const { role, clubId } = request.jwtPayload;

        // Check permission
        if (options.permission) {
          const allowed = hasPermission(
            role as Parameters<typeof hasPermission>[0],
            options.permission,
          );
          if (!allowed) {
            throw new Error('Forbidden');
          }
        }

        // Check feature flag
        if (options.featureKey && clubId) {
          const flag = await deps.prisma.featureFlag.findUnique({
            where: {
              clubId_key: {
                clubId,
                key: options.featureKey,
              },
            },
          });

          // If flag exists and is disabled, block access
          // If flag doesn't exist, default to enabled (except for OCR which we'll seed as disabled)
          if (flag && !flag.enabled) {
            throw new Error('Feature disabled');
          }
        }
      },
  );
}

export const authorizationPlugin = fp(authorizationPluginCallback, {
  name: 'authorization-plugin',
  dependencies: ['auth-plugin'],
});
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/api lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/interface/plugins/authorization-plugin.ts
git commit -m "feat(api): add authorization plugin for permissions and feature flags"
```

---

## Task 6: Register Authorization Plugin in App

**Files:**

- Modify: `apps/api/src/app.ts`

**Step 1: Find app.ts and add authorization plugin registration**

After the auth plugin registration, add:

```typescript
import { authorizationPlugin } from './interface/plugins/authorization-plugin';

// After fastify.register(authPlugin), add:
await fastify.register(authorizationPlugin, { prisma });
```

**Step 2: Run lint and build**

Run: `pnpm --filter @hoop/api lint && pnpm --filter @hoop/api build`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/app.ts
git commit -m "feat(api): register authorization plugin in app"
```

---

## Task 7: Add Authorization to User Routes

**Files:**

- Modify: `apps/api/src/interface/routes/user-routes.ts`

**Step 1: Update route registration to use authorize**

The user routes need the Fastify instance to access `authorize`. Update the function to add preHandler hooks:

```typescript
import { Permission } from '@hoop/shared';

export async function userRoutes(fastify: FastifyInstance, deps: UserRoutesDeps): Promise<void> {
  const authorizeUsersManage = fastify.authorize({ permission: Permission.UsersManage });

  fastify.get('/users', { preHandler: [authorizeUsersManage] }, async (request) => {
    // ... existing code
  });

  fastify.get('/users/:id', { preHandler: [authorizeUsersManage] }, async (request) => {
    // ... existing code
  });

  fastify.post('/users', { preHandler: [authorizeUsersManage] }, async (request, reply) => {
    // ... existing code
  });

  fastify.put('/users/:id', { preHandler: [authorizeUsersManage] }, async (request) => {
    // ... existing code
  });

  fastify.delete('/users/:id', { preHandler: [authorizeUsersManage] }, async (request, reply) => {
    // ... existing code
  });

  fastify.post(
    '/users/:id/reset-password',
    { preHandler: [authorizeUsersManage] },
    async (request, reply) => {
      // ... existing code
    },
  );
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/api lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/interface/routes/user-routes.ts
git commit -m "feat(api): add users:manage authorization to user routes"
```

---

## Task 8: Add Authorization to OCR Routes

**Files:**

- Modify: `apps/api/src/interface/routes/ocr-routes.ts`

**Step 1: Update OCR routes with permission and feature flag check**

```typescript
import { Permission, FeatureKey } from '@hoop/shared';

export async function ocrRoutes(fastify: FastifyInstance, deps: OcrRoutesDeps): Promise<void> {
  const authorizeOcr = fastify.authorize({
    permission: Permission.ImportUse,
    featureKey: FeatureKey.OcrImport,
  });

  fastify.post('/ocr/extract', { preHandler: [authorizeOcr] }, async (request, reply) => {
    // Remove manual auth check at top - now handled by authorize
    const clubId = request.jwtPayload!.clubId;
    if (!clubId) {
      throw new Error('No club associated');
    }
    // ... rest of existing code
  });

  fastify.patch('/ocr/extractions/:id', { preHandler: [authorizeOcr] }, async (request) => {
    // Remove manual auth check at top - now handled by authorize
    const clubId = request.jwtPayload!.clubId;
    if (!clubId) {
      throw new Error('No club associated');
    }
    // ... rest of existing code
  });
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/api lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/interface/routes/ocr-routes.ts
git commit -m "feat(api): add import:use permission and ocr_import feature flag to OCR routes"
```

---

## Task 9: Add Authorization to Player Routes

**Files:**

- Modify: `apps/api/src/interface/routes/player-routes.ts`

**Step 1: Add authorization to player routes**

```typescript
import { Permission } from '@hoop/shared';

export async function playerRoutes(
  fastify: FastifyInstance,
  deps: PlayerRoutesDeps,
): Promise<void> {
  const authorizeRead = fastify.authorize({ permission: Permission.PlayersRead });
  const authorizeWrite = fastify.authorize({ permission: Permission.PlayersWrite });

  fastify.get('/players', { preHandler: [authorizeRead] }, async (request) => {
    // ... existing code (remove manual jwtPayload check)
  });

  fastify.get('/players/:id', { preHandler: [authorizeRead] }, async (request) => {
    // ... existing code
  });

  fastify.post('/players', { preHandler: [authorizeWrite] }, async (request, reply) => {
    // ... existing code
  });

  fastify.put('/players/:id', { preHandler: [authorizeWrite] }, async (request) => {
    // ... existing code
  });

  fastify.delete('/players/:id', { preHandler: [authorizeWrite] }, async (request, reply) => {
    // ... existing code
  });

  fastify.get('/players/:id/licenses', { preHandler: [authorizeRead] }, async (request) => {
    // ... existing code
  });
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/api lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/interface/routes/player-routes.ts
git commit -m "feat(api): add players:read/write authorization to player routes"
```

---

## Task 10: Add Authorization to Remaining Routes

**Files:**

- Modify: `apps/api/src/interface/routes/license-routes.ts`
- Modify: `apps/api/src/interface/routes/document-routes.ts`
- Modify: `apps/api/src/interface/routes/template-routes.ts`
- Modify: `apps/api/src/interface/routes/club-routes.ts` (settings)

**Step 1: Update license-routes.ts**

Add `Permission.LicensesRead` to GET routes, `Permission.LicensesWrite` to POST/PUT/DELETE.

**Step 2: Update document-routes.ts**

Add `Permission.DocumentsRead` to GET routes, `Permission.DocumentsWrite` to POST/PUT/DELETE.

**Step 3: Update template-routes.ts**

Add `Permission.TemplatesRead` to GET routes, `Permission.TemplatesWrite` to POST/PUT/DELETE.

**Step 4: Update club-routes.ts (if settings-related)**

Add `Permission.SettingsManage` to any club config routes.

**Step 5: Run lint**

Run: `pnpm --filter @hoop/api lint`
Expected: No errors

**Step 6: Commit**

```bash
git add apps/api/src/interface/routes/
git commit -m "feat(api): add authorization to license, document, template routes"
```

---

## Task 11: Create Feature Flag API Routes

**Files:**

- Create: `apps/api/src/interface/routes/feature-flag-routes.ts`

**Step 1: Write the feature flag routes**

```typescript
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Permission, FeatureKey } from '@hoop/shared';

interface FeatureFlagRoutesDeps {
  readonly prisma: PrismaClient;
}

const FEATURE_KEYS = Object.values(FeatureKey);

export async function featureFlagRoutes(
  fastify: FastifyInstance,
  deps: FeatureFlagRoutesDeps,
): Promise<void> {
  // Get all feature flags for current club
  fastify.get('/feature-flags', async (request) => {
    if (!request.jwtPayload?.clubId) {
      throw new Error('No club associated');
    }

    const flags = await deps.prisma.featureFlag.findMany({
      where: { clubId: request.jwtPayload.clubId },
    });

    // Return a map of key -> enabled, defaulting to true for missing keys
    // Exception: ocr_import defaults to false
    const flagMap: Record<string, boolean> = {};
    for (const key of FEATURE_KEYS) {
      const flag = flags.find((f) => f.key === key);
      if (flag) {
        flagMap[key] = flag.enabled;
      } else {
        // Default: ocr_import is false, others are true
        flagMap[key] = key !== FeatureKey.OcrImport;
      }
    }

    return flagMap;
  });

  // Update a feature flag (admin only)
  const updateSchema = z.object({
    enabled: z.boolean(),
  });

  const authorizeSettings = fastify.authorize({ permission: Permission.SettingsManage });

  fastify.put(
    '/feature-flags/:key',
    { preHandler: [authorizeSettings] },
    async (request, reply) => {
      if (!request.jwtPayload?.clubId) {
        throw new Error('No club associated');
      }

      const { key } = z.object({ key: z.string() }).parse(request.params);
      if (!FEATURE_KEYS.includes(key as FeatureKey)) {
        throw new Error('Invalid feature key');
      }

      const { enabled } = updateSchema.parse(request.body);
      const clubId = request.jwtPayload.clubId;

      const flag = await deps.prisma.featureFlag.upsert({
        where: { clubId_key: { clubId, key } },
        update: { enabled },
        create: { clubId, key, enabled },
      });

      reply.send(flag);
    },
  );
}
```

**Step 2: Register routes in app.ts**

Add to the protected routes section:

```typescript
import { featureFlagRoutes } from './interface/routes/feature-flag-routes';

// In the protected routes registration:
await fastify.register(
  async (protectedRoutes) => {
    // ... existing routes
    await protectedRoutes.register(featureFlagRoutes, { prisma });
  },
  { prefix: '/api' },
);
```

**Step 3: Run lint**

Run: `pnpm --filter @hoop/api lint`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/api/src/interface/routes/feature-flag-routes.ts apps/api/src/app.ts
git commit -m "feat(api): add feature flag API routes"
```

---

## Task 12: Update Error Plugin for Forbidden Error

**Files:**

- Modify: `apps/api/src/interface/plugins/error-plugin.ts`

**Step 1: Add handling for Forbidden error**

In the error handler, add a case for "Forbidden" and "Feature disabled" messages:

```typescript
if (error.message === 'Forbidden' || error.message === 'Feature disabled') {
  reply.code(403).send({ error: error.message });
  return;
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/api lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/interface/plugins/error-plugin.ts
git commit -m "feat(api): add 403 handling for Forbidden and Feature disabled errors"
```

---

## Task 13: Create Seed Script for Feature Flags

**Files:**

- Modify: `apps/api/prisma/seed.ts`

**Step 1: Add feature flag seeding**

In the seed script, after creating clubs, add:

```typescript
import { FeatureKey } from '@hoop/shared';

// After club creation, disable OCR for all clubs
const clubs = await prisma.club.findMany();
for (const club of clubs) {
  await prisma.featureFlag.upsert({
    where: { clubId_key: { clubId: club.id, key: FeatureKey.OcrImport } },
    update: {},
    create: {
      clubId: club.id,
      key: FeatureKey.OcrImport,
      enabled: false,
    },
  });
}
```

**Step 2: Run seed**

Run: `pnpm db:seed`
Expected: Seed completes successfully

**Step 3: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(api): seed OCR feature flag as disabled for all clubs"
```

---

## Task 14: Update Site Config with Permissions

**Files:**

- Modify: `apps/web/src/shared/config/site-config.ts`

**Step 1: Add permission and featureKey to nav items**

```typescript
import type { Permission, FeatureKey } from '@hoop/shared';

export interface NavItem {
  readonly title: string;
  readonly href: string;
  readonly icon: string;
  readonly permission?: Permission;
  readonly featureKey?: FeatureKey;
}

export const siteConfig = {
  name: 'HoopAdmin',
  description: 'Basketball license management system',
  navItems: [
    { title: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
    { title: 'Players', href: '/players', icon: 'Users', permission: 'players:read' },
    { title: 'Users', href: '/users', icon: 'UserCog', permission: 'users:manage' },
    {
      title: 'Import',
      href: '/import',
      icon: 'ScanLine',
      permission: 'import:use',
      featureKey: 'ocr_import',
    },
    { title: 'Documents', href: '/documents', icon: 'FileText', permission: 'documents:read' },
    { title: 'Licenses', href: '/licenses', icon: 'Award', permission: 'licenses:read' },
    {
      title: 'Templates',
      href: '/templates',
      icon: 'FileSpreadsheet',
      permission: 'templates:read',
    },
    { title: 'Settings', href: '/settings', icon: 'Settings', permission: 'settings:manage' },
  ] as NavItem[],
} as const;
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/web lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/shared/config/site-config.ts
git commit -m "feat(web): add permission and featureKey to nav items config"
```

---

## Task 15: Create Feature Flags Context

**Files:**

- Create: `apps/web/src/shared/context/feature-flags-context.tsx`

**Step 1: Write the context provider**

```typescript
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { FeatureKey } from '@hoop/shared';

type FeatureFlags = Record<FeatureKey, boolean>;

interface FeatureFlagsContextValue {
  readonly flags: FeatureFlags | null;
  readonly loading: boolean;
  readonly isEnabled: (key: FeatureKey) => boolean;
  readonly refetch: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface FeatureFlagsProviderProps {
  readonly children: ReactNode;
}

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const { data: session } = useSession();
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/feature-flags`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFlags(data);
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [session?.accessToken]);

  const isEnabled = (key: FeatureKey): boolean => {
    if (!flags) return false;
    return flags[key] ?? false;
  };

  const value: FeatureFlagsContextValue = {
    flags,
    loading,
    isEnabled,
    refetch: fetchFlags,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/web lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/shared/context/feature-flags-context.tsx
git commit -m "feat(web): add FeatureFlagsProvider context"
```

---

## Task 16: Add FeatureFlagsProvider to App

**Files:**

- Modify: `apps/web/src/app/providers.tsx`

**Step 1: Wrap with FeatureFlagsProvider**

```typescript
import { FeatureFlagsProvider } from '@/shared/context/feature-flags-context';

// Inside the Providers component, wrap children:
<SessionProvider>
  <FeatureFlagsProvider>
    {children}
  </FeatureFlagsProvider>
</SessionProvider>
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/web lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/app/providers.tsx
git commit -m "feat(web): add FeatureFlagsProvider to app providers"
```

---

## Task 17: Update Sidebar to Filter by Permissions

**Files:**

- Modify: `apps/web/src/widgets/sidebar/sidebar.tsx`

**Step 1: Import dependencies and filter nav items**

```typescript
import { useSession } from 'next-auth/react';
import { hasPermission, type Role, type Permission, type FeatureKey } from '@hoop/shared';
import { useFeatureFlags } from '@/shared/context/feature-flags-context';

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isEnabled } = useFeatureFlags();
  const [signOutOpen, setSignOutOpen] = useState(false);

  const userRole = session?.user?.role as Role | undefined;

  const visibleNavItems = siteConfig.navItems.filter((item) => {
    // Check permission
    if (item.permission && userRole) {
      if (!hasPermission(userRole, item.permission as Permission)) {
        return false;
      }
    }

    // Check feature flag
    if (item.featureKey) {
      if (!isEnabled(item.featureKey as FeatureKey)) {
        return false;
      }
    }

    return true;
  });

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* ... header */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNavItems.map((item) => {
          // ... existing render logic
        })}
      </nav>
      {/* ... rest */}
    </aside>
  );
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/web lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/widgets/sidebar/sidebar.tsx
git commit -m "feat(web): filter sidebar nav items by permissions and feature flags"
```

---

## Task 18: Create RequirePermission Component

**Files:**

- Create: `apps/web/src/shared/ui/require-permission.tsx`

**Step 1: Write the component**

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, type Role, type Permission, type FeatureKey } from '@hoop/shared';
import { useFeatureFlags } from '@/shared/context/feature-flags-context';
import type { ReactNode } from 'react';

interface RequirePermissionProps {
  readonly permission?: Permission;
  readonly featureKey?: FeatureKey;
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

export function RequirePermission({
  permission,
  featureKey,
  children,
  fallback,
}: RequirePermissionProps) {
  const { data: session, status } = useSession();
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();

  // Show nothing while loading
  if (status === 'loading' || flagsLoading) {
    return null;
  }

  const userRole = session?.user?.role as Role | undefined;

  // Check permission
  if (permission && userRole) {
    if (!hasPermission(userRole, permission)) {
      return fallback ?? <AccessDenied message="You don't have permission to access this page." />;
    }
  }

  // Check feature flag
  if (featureKey) {
    if (!isEnabled(featureKey)) {
      return fallback ?? <AccessDenied message="This feature is currently disabled." />;
    }
  }

  return <>{children}</>;
}

function AccessDenied({ message }: { readonly message: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
      <p className="mt-2 text-muted-foreground">{message}</p>
    </div>
  );
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/web lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/shared/ui/require-permission.tsx
git commit -m "feat(web): add RequirePermission wrapper component"
```

---

## Task 19: Protect Users Page

**Files:**

- Modify: `apps/web/src/app/(dashboard)/users/page.tsx`

**Step 1: Wrap with RequirePermission**

```typescript
import { RequirePermission } from '@/shared/ui/require-permission';
import { Permission } from '@hoop/shared';

export default function UsersPage() {
  return (
    <RequirePermission permission={Permission.UsersManage}>
      {/* existing page content */}
    </RequirePermission>
  );
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/web lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/app/(dashboard)/users/
git commit -m "feat(web): protect users pages with users:manage permission"
```

---

## Task 20: Protect Import Page

**Files:**

- Modify: `apps/web/src/app/(dashboard)/import/page.tsx`

**Step 1: Wrap with RequirePermission**

```typescript
import { RequirePermission } from '@/shared/ui/require-permission';
import { Permission, FeatureKey } from '@hoop/shared';

export default function ImportPage() {
  return (
    <RequirePermission permission={Permission.ImportUse} featureKey={FeatureKey.OcrImport}>
      {/* existing page content */}
    </RequirePermission>
  );
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/web lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/app/(dashboard)/import/page.tsx
git commit -m "feat(web): protect import page with permission and feature flag"
```

---

## Task 21: Protect Settings Page

**Files:**

- Modify: `apps/web/src/app/(dashboard)/settings/page.tsx`

**Step 1: Wrap with RequirePermission**

```typescript
import { RequirePermission } from '@/shared/ui/require-permission';
import { Permission } from '@hoop/shared';

export default function SettingsPage() {
  return (
    <RequirePermission permission={Permission.SettingsManage}>
      {/* existing page content */}
    </RequirePermission>
  );
}
```

**Step 2: Run lint**

Run: `pnpm --filter @hoop/web lint`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/app/(dashboard)/settings/page.tsx
git commit -m "feat(web): protect settings page with settings:manage permission"
```

---

## Task 22: Add Feature Flags UI to Settings Page

**Files:**

- Create: `apps/web/src/features/settings/ui/feature-flags-manager.tsx`
- Modify: `apps/web/src/app/(dashboard)/settings/page.tsx`

**Step 1: Create the FeatureFlagsManager component**

```typescript
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FeatureKey } from '@hoop/shared';
import { useFeatureFlags } from '@/shared/context/feature-flags-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const FEATURE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  [FeatureKey.OcrImport]: {
    label: 'OCR Import',
    description: 'Import players and licenses from scanned documents',
  },
};

export function FeatureFlagsManager() {
  const { data: session } = useSession();
  const { flags, refetch } = useFeatureFlags();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (key: string, enabled: boolean) => {
    if (!session?.accessToken) return;

    setUpdating(key);
    try {
      const response = await fetch(`${API_URL}/feature-flags/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        await refetch();
      }
    } catch (error) {
      console.error('Failed to update feature flag:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (!flags) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(FEATURE_DESCRIPTIONS).map(([key, { label, description }]) => (
          <div key={key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={key}>{label}</Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch
              id={key}
              checked={flags[key as FeatureKey] ?? false}
              onCheckedChange={(checked) => handleToggle(key, checked)}
              disabled={updating === key}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Add to Settings page**

Import and add after CategoryManager:

```typescript
import { FeatureFlagsManager } from '@/features/settings/ui/feature-flags-manager';

// In the return statement, after <CategoryManager />:
<FeatureFlagsManager />
```

**Step 3: Run lint**

Run: `pnpm --filter @hoop/web lint`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/features/settings/ui/feature-flags-manager.tsx apps/web/src/app/(dashboard)/settings/page.tsx
git commit -m "feat(web): add feature flags management UI to settings page"
```

---

## Task 23: Run Full Test Suite and Build

**Files:** None

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Run build**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Fix any issues**

If tests fail, fix the issues and re-run.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix any remaining issues from RBAC implementation"
```

---

## Summary

This plan implements:

1. **Shared package**: Role enum update, Permission/FeatureKey enums, hasPermission function
2. **API**: FeatureFlag model, authorization plugin, protected routes, feature flag API
3. **Web**: Feature flags context, sidebar filtering, RequirePermission component, protected pages, settings UI

Total commits: ~23 small, focused commits following TDD where applicable.
