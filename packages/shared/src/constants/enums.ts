export const Role = {
  Admin: 'admin',
  Staff: 'staff',
  Viewer: 'viewer',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const LicenseStatus = {
  Active: 'active',
  Expired: 'expired',
} as const;

export type LicenseStatus = (typeof LicenseStatus)[keyof typeof LicenseStatus];

export const Gender = {
  Male: 'G',
  Female: 'F',
  ManAdult: 'H',
  WomanAdult: 'D',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

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
