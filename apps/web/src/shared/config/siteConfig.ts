export const siteConfig = {
  name: 'HoopAdmin',
  description: 'Basketball license management system',
  navItems: [
    { title: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
    { title: 'Players', href: '/players', icon: 'Users' },
    { title: 'Documents', href: '/documents', icon: 'FileText' },
    { title: 'Licenses', href: '/licenses', icon: 'Award' },
    { title: 'Templates', href: '/templates', icon: 'FileSpreadsheet' },
    { title: 'Settings', href: '/settings', icon: 'Settings' },
  ],
} as const;
