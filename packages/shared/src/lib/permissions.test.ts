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
