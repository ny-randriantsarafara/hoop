export const Role = {
  AdminClub: 'adminClub',
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
