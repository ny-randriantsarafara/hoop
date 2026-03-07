# Authorization & Feature Flags

This document describes the role-based access control (RBAC) and per-club feature flags system.

## Overview

The authorization system provides:

- **Role-based permissions** - Three roles with different permission sets
- **Feature flags** - Per-club toggles to enable/disable features
- **API protection** - Routes check permissions before processing requests
- **UI filtering** - Navigation and pages respect permissions and feature flags

## Roles

Three roles are defined in `@hoop/shared`:

| Role     | Purpose                           |
| -------- | --------------------------------- |
| `admin`  | Full access including settings    |
| `staff`  | Club operations (CRUD on players) |
| `viewer` | Read-only access                  |

```typescript
import { Role } from '@hoop/shared';

Role.Admin; // 'admin'
Role.Staff; // 'staff'
Role.Viewer; // 'viewer'
```

## Permissions

Eleven permissions control access to resources:

| Permission        | Admin | Staff | Viewer |
| ----------------- | ----- | ----- | ------ |
| `players:read`    | Y     | Y     | Y      |
| `players:write`   | Y     | Y     | N      |
| `licenses:read`   | Y     | Y     | Y      |
| `licenses:write`  | Y     | Y     | N      |
| `documents:read`  | Y     | Y     | Y      |
| `documents:write` | Y     | Y     | N      |
| `templates:read`  | Y     | Y     | Y      |
| `templates:write` | Y     | N     | N      |
| `users:manage`    | Y     | N     | N      |
| `settings:manage` | Y     | N     | N      |
| `import:use`      | Y     | Y     | N      |

### Using hasPermission

```typescript
import { hasPermission, Role, Permission } from '@hoop/shared';

hasPermission(Role.Admin, Permission.UsersManage); // true
hasPermission(Role.Staff, Permission.UsersManage); // false
hasPermission(Role.Viewer, Permission.PlayersRead); // true
```

## Feature Flags

Feature flags allow per-club control over optional features.

### Database Schema

```prisma
model FeatureFlag {
  id        String   @id @default(uuid())
  clubId    String
  key       String
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  club Club @relation(fields: [clubId], references: [id])

  @@unique([clubId, key])
}
```

### Available Features

| Key          | Description                  | Default |
| ------------ | ---------------------------- | ------- |
| `ocr_import` | OCR document scanning/import | Off     |

### Checking Feature Flags

```typescript
import { FeatureKey } from '@hoop/shared';

// In API routes, use the authorize preHandler
fastify.authorize({
  permission: Permission.ImportUse,
  featureKey: FeatureKey.OcrImport,
});
```

## API Authorization

### Authorization Plugin

The `authorizationPlugin` adds the `authorize` decorator to Fastify:

```typescript
// Register in server.ts
await fastify.register(authorizationPlugin, { prisma });
```

### Protecting Routes

```typescript
import { Permission, FeatureKey } from '@hoop/shared';

// Permission only
fastify.get(
  '/users',
  {
    preHandler: fastify.authorize({ permission: Permission.UsersManage }),
  },
  handler,
);

// Permission + feature flag
fastify.post(
  '/ocr/extract',
  {
    preHandler: fastify.authorize({
      permission: Permission.ImportUse,
      featureKey: FeatureKey.OcrImport,
    }),
  },
  handler,
);
```

### Error Responses

| Status | Message          | Cause                       |
| ------ | ---------------- | --------------------------- |
| 403    | Forbidden        | Missing required permission |
| 403    | Feature disabled | Feature flag is off         |

## Web App Authorization

### useAuthorization Hook

```typescript
import { useAuthorization } from '@/shared/lib/use-authorization';

function MyComponent() {
  const { role, canAccess, isLoading } = useAuthorization();

  if (canAccess(Permission.UsersManage)) {
    // Show admin content
  }
}
```

### RequirePermission Component

Wrap pages to enforce access control:

```tsx
import { RequirePermission } from '@/shared/ui/require-permission';
import { Permission, FeatureKey } from '@hoop/shared';

// Permission only
export default function UsersPage() {
  return (
    <RequirePermission permission={Permission.UsersManage}>
      <UsersContent />
    </RequirePermission>
  );
}

// Permission + feature flag
export default function ImportPage() {
  return (
    <RequirePermission permission={Permission.ImportUse} featureKey={FeatureKey.OcrImport}>
      <ImportFlow />
    </RequirePermission>
  );
}
```

### Sidebar Filtering

Navigation items include permission and feature flag requirements:

```typescript
// site-config.ts
{
  title: 'Users',
  href: '/users',
  icon: 'UserCog',
  permission: Permission.UsersManage,
},
{
  title: 'Import',
  href: '/import',
  icon: 'ScanLine',
  permission: Permission.ImportUse,
  featureKey: FeatureKey.OcrImport,
},
```

The sidebar automatically filters items based on the user's role and enabled features.

## Feature Flags API

### Get Feature Flags

```
GET /api/feature-flags
Authorization: Bearer <token>

Response: { "ocr_import": false }
```

### Update Feature Flag (Admin only)

```
PUT /api/feature-flags/:key
Authorization: Bearer <token>
Content-Type: application/json

Body: { "enabled": true }
```

## Adding New Permissions

1. Add to `Permission` enum in `packages/shared/src/constants/enums.ts`
2. Update `PERMISSION_MATRIX` in `packages/shared/src/lib/permissions.ts`
3. Add tests in `packages/shared/src/lib/permissions.test.ts`
4. Use in routes with `fastify.authorize({ permission: Permission.NewPerm })`

## Adding New Feature Flags

1. Add key to `FeatureKey` enum in `packages/shared/src/constants/enums.ts`
2. Add description in `apps/web/src/features/settings/ui/feature-flags-manager.tsx`
3. Optionally seed default value in `apps/api/prisma/seed.ts`
4. Use in routes with `fastify.authorize({ featureKey: FeatureKey.NewFeature })`

## Files Reference

### Shared Package

- `packages/shared/src/constants/enums.ts` - Role, Permission, FeatureKey
- `packages/shared/src/lib/permissions.ts` - hasPermission function

### API

- `apps/api/prisma/schema.prisma` - FeatureFlag model
- `apps/api/src/interface/plugins/authorization-plugin.ts` - Fastify plugin
- `apps/api/src/interface/routes/feature-flag-routes.ts` - Feature flags API

### Web

- `apps/web/src/shared/lib/use-authorization.ts` - Authorization hook
- `apps/web/src/shared/ui/require-permission.tsx` - Page wrapper
- `apps/web/src/shared/config/site-config.ts` - Nav item permissions
- `apps/web/src/features/settings/ui/feature-flags-manager.tsx` - Admin UI
