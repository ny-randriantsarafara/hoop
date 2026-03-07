'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { PublicUser } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { TableSkeleton } from '@/shared/ui/skeleton';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useToast } from '@/shared/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { fetchUsers, deleteUser } from '../api/user-api';

function formatDate(value: Date | string | null): string {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleDateString('fr-FR');
}

export function UserTable() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<ReadonlyArray<PublicUser>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await fetchUsers(session.accessToken);
      setUsers(list);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleDeleteConfirm() {
    if (!session?.accessToken || !deleteId) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteUser(session.accessToken, deleteId);
      toast({ title: 'User deleted', variant: 'success' });
      setDeleteId(null);
      await loadUsers();
    } catch {
      toast({ title: 'Failed to delete user', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/users/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
      )}

      <div className="rounded-lg border">
        {loading ? (
          <TableSkeleton columns={5} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/users/${user.id}/edit`)}
                  >
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.lastLogin)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/users/${user.id}/edit`);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteId(user.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
          }
        }}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
