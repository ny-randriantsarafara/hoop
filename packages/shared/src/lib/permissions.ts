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
