import type { Permission, FeatureKey } from '@hoop/shared';
import { Permission as P, FeatureKey as FK } from '@hoop/shared';

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
    { title: 'Players', href: '/players', icon: 'Users', permission: P.PlayersRead },
    { title: 'Users', href: '/users', icon: 'UserCog', permission: P.UsersManage },
    {
      title: 'Import',
      href: '/import',
      icon: 'ScanLine',
      permission: P.ImportUse,
      featureKey: FK.OcrImport,
    },
    { title: 'Documents', href: '/documents', icon: 'FileText', permission: P.DocumentsRead },
    { title: 'Licenses', href: '/licenses', icon: 'Award', permission: P.LicensesRead },
    {
      title: 'Templates',
      href: '/templates',
      icon: 'FileSpreadsheet',
      permission: P.TemplatesRead,
    },
    { title: 'Settings', href: '/settings', icon: 'Settings', permission: P.SettingsManage },
  ] as const satisfies readonly NavItem[],
} as const;
