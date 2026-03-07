'use client';

import { Permission } from '@hoop/shared';
import { UserTable } from '@/features/users/ui/user-table';
import { RequirePermission } from '@/shared/ui/require-permission';

export default function UsersPage() {
  return (
    <RequirePermission permission={Permission.UsersManage}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage club users and credentials</p>
        </div>
        <UserTable />
      </div>
    </RequirePermission>
  );
}
