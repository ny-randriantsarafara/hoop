'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import { createUser, updateUser, fetchUser, resetUserPassword } from '../api/user-api';

interface UserFormProps {
  readonly userId?: string;
}

type FormRole = (typeof Role)[keyof typeof Role];

interface UserDraft {
  readonly name: string;
  readonly email: string;
  readonly role: FormRole;
}

const EMPTY_DRAFT: UserDraft = {
  name: '',
  email: '',
  role: Role.Staff,
};

function parseRole(value: string): FormRole {
  if (value === Role.Admin) return Role.Admin;
  if (value === Role.Staff) return Role.Staff;
  return Role.Viewer;
}

export function UserForm({ userId }: UserFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT);
  const [password, setPassword] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [loading, setLoading] = useState(Boolean(userId));
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    if (!session?.accessToken || !userId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await fetchUser(session.accessToken, userId);
      setDraft({
        name: user.name,
        email: user.email,
        role: parseRole(user.role),
      });
    } catch {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  function updateDraft<K extends keyof UserDraft>(key: K, value: UserDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      return;
    }

    if (!draft.name.trim() || !draft.email.trim()) {
      setError('Name and email are required');
      return;
    }

    if (!userId && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (userId) {
        await updateUser(session.accessToken, userId, {
          name: draft.name.trim(),
          email: draft.email.trim(),
          role: draft.role,
        });
        toast({ title: 'User updated', variant: 'success' });
      } else {
        await createUser(session.accessToken, {
          name: draft.name.trim(),
          email: draft.email.trim(),
          role: draft.role,
          password,
        });
        toast({ title: 'User created', variant: 'success' });
      }

      router.push('/users');
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to save user';
      setError(message);
      toast({ title: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!session?.accessToken || !userId) {
      return;
    }

    if (resetPasswordValue.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setResettingPassword(true);
    setError(null);
    try {
      await resetUserPassword(session.accessToken, userId, resetPasswordValue);
      setResetPasswordValue('');
      toast({ title: 'Password reset', variant: 'success' });
    } catch (resetError) {
      const message = resetError instanceof Error ? resetError.message : 'Failed to reset password';
      setError(message);
      toast({ title: message, variant: 'destructive' });
    } finally {
      setResettingPassword(false);
    }
  }

  if (loading) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{userId ? 'Edit User' : 'New User'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={draft.name}
              onChange={(event) => updateDraft('name', event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={draft.email}
              onChange={(event) => updateDraft('email', event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              id="role"
              value={draft.role}
              onChange={(event) => updateDraft('role', parseRole(event.target.value))}
            >
              <option value={Role.Admin}>Admin</option>
              <option value={Role.Staff}>Staff</option>
              <option value={Role.Viewer}>Viewer</option>
            </Select>
          </div>
          {!userId && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : userId ? 'Save Changes' : 'Create User'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>

        {userId && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-medium">Reset Password</h4>
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                value={resetPasswordValue}
                onChange={(event) => setResetPasswordValue(event.target.value)}
              />
            </div>
            <Button onClick={handleResetPassword} disabled={resettingPassword}>
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
