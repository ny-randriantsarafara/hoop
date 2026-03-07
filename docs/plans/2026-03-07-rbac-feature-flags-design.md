# RBAC Authorization & Feature Flags Design

**Date**: 2026-03-07  
**Status**: Approved

## Overview

Implement role-based access control (RBAC) with a permission matrix and per-club feature flags. This replaces the current single-role system (`adminClub`) with three distinct roles and adds the ability to enable/disable features per club.

## Requirements

- Three roles: Admin (config), Staff (club management), Viewer (read-only)
- Admin-only menus: Users, Settings
- Staff access: Players/Licenses/Documents (CRUD), Import, Templates (view)
- Viewer access: Read-only on Staff-accessible items
- Per-club feature flags stored in database
- Disabled features: Hidden menu + "Feature disabled" on direct URL access
- OCR Import disabled by default for all clubs

## Approach

Role-based with Permission Matrix - roles map to permission sets via a matrix in the shared package, providing type safety and future flexibility.

---

## Roles & Permissions

### Roles

```typescript
export const Role = {
  Admin: 'admin',
  Staff: 'staff',
  Viewer: 'viewer',
} as const;
```

### Permissions

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
```

### Permission Matrix

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

---

## Feature Flags

### Database Schema

```prisma
model FeatureFlag {
  id        String   @id @default(cuid())
  clubId    String
  club      Club     @relation(fields: [clubId], references: [id])
  key       String
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([clubId, key])
}
```

### Feature Keys

```typescript
export const FeatureKey = {
  OcrImport: 'ocr_import',
} as const;
```

### Default Behavior

- No row for `clubId + key` = feature enabled by default
- Exception: OCR Import starts disabled (seed creates `enabled: false` for all clubs)

---

## API Authorization

### Authorization Plugin

New Fastify plugin decorating routes with permission and feature flag checks:

```typescript
fastify.decorate(
  'authorize',
  (options: { permission?: Permission; featureKey?: FeatureKey }) => async (request, reply) => {
    const { role, clubId } = request.jwtPayload;

    if (options.permission && !hasPermission(role, options.permission)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    if (options.featureKey) {
      const enabled = await featureFlagService.isEnabled(clubId, options.featureKey);
      if (!enabled) {
        throw new ForbiddenError('Feature disabled');
      }
    }
  },
);
```

### Route Usage

```typescript
{
  preHandler: [fastify.authenticate, fastify.authorize({ permission: Permission.PlayersWrite })];
}

// With feature flag
{
  preHandler: [
    fastify.authenticate,
    fastify.authorize({
      permission: Permission.ImportUse,
      featureKey: FeatureKey.OcrImport,
    }),
  ];
}
```

### Routes to Update

| Route Pattern                | Permission        | Feature Flag |
| ---------------------------- | ----------------- | ------------ |
| `GET /players`               | `players:read`    | -            |
| `POST/PUT/DELETE /players`   | `players:write`   | -            |
| `GET /licenses`              | `licenses:read`   | -            |
| `POST/PUT/DELETE /licenses`  | `licenses:write`  | -            |
| `GET /documents`             | `documents:read`  | -            |
| `POST/PUT/DELETE /documents` | `documents:write` | -            |
| `GET /templates`             | `templates:read`  | -            |
| `POST/PUT/DELETE /templates` | `templates:write` | -            |
| `* /users`                   | `users:manage`    | -            |
| `* /ocr/*`                   | `import:use`      | `ocr_import` |

---

## Web App Authorization

### Menu Configuration

```typescript
export const navItems = [
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
  { title: 'Templates', href: '/templates', icon: 'FileSpreadsheet', permission: 'templates:read' },
  { title: 'Settings', href: '/settings', icon: 'Settings', permission: 'settings:manage' },
];
```

### Menu Visibility

| Menu Item | Admin | Staff | Viewer |
| --------- | ----- | ----- | ------ |
| Dashboard | Y     | Y     | Y      |
| Players   | Y     | Y     | Y      |
| Users     | Y     | N     | N      |
| Import    | Y     | Y     | N      |
| Documents | Y     | Y     | Y      |
| Licenses  | Y     | Y     | Y      |
| Templates | Y     | Y     | Y      |
| Settings  | Y     | N     | N      |

Note: Import also requires `ocr_import` feature flag enabled.

### Feature Flags Context

- Fetch flags via `GET /api/feature-flags` on app load
- Store in React context (`FeatureFlagProvider`)
- Sidebar and pages consume from context

### Route Protection

Page-level `<RequirePermission>` wrapper component:

```typescript
export default function UsersPage() {
  return (
    <RequirePermission permission="users:manage">
      <UsersContent />
    </RequirePermission>
  );
}

export default function ImportPage() {
  return (
    <RequirePermission permission="import:use" featureKey="ocr_import">
      <ImportFlow />
    </RequirePermission>
  );
}
```

---

## Settings UI

### Feature Flags Section

Located in Settings page (`/settings`), Admin only:

```
Feature Flags
├── OCR Import                    [toggle]
│   Import players and licenses from
│   scanned documents
└── (future features)
```

### API Endpoints

```
GET  /api/feature-flags          → Returns flags for current club
PUT  /api/feature-flags/:key     → Update flag (admin only)
```

---

## Migration

### Role Migration

```sql
UPDATE "User" SET role = 'admin' WHERE role = 'adminClub';
```

### Initial Feature Flags

Seed script creates `ocr_import: false` for all existing clubs.

---

## Files to Create/Modify

### Shared Package

- `packages/shared/src/constants/enums.ts` - Update Role, add Permission, FeatureKey
- `packages/shared/src/lib/permissions.ts` - New: hasPermission function

### API

- `apps/api/prisma/schema.prisma` - Add FeatureFlag model
- `apps/api/src/interface/plugins/authorization-plugin.ts` - New
- `apps/api/src/domain/feature-flag/` - Entity and repository interface
- `apps/api/src/infrastructure/feature-flag/` - Prisma repository
- `apps/api/src/application/feature-flag/` - Use cases
- `apps/api/src/interface/routes/feature-flag-routes.ts` - New
- All existing routes - Add authorize preHandler

### Web

- `apps/web/src/shared/config/site-config.ts` - Add permissions to nav items
- `apps/web/src/shared/context/feature-flags.tsx` - New context
- `apps/web/src/shared/ui/require-permission.tsx` - New component
- `apps/web/src/widgets/sidebar/sidebar.tsx` - Filter by permissions
- `apps/web/src/app/(dashboard)/settings/page.tsx` - Add feature flags section
- `apps/web/src/features/settings/` - Feature flag components
