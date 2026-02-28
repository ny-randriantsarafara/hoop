'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Player, License } from '@hoop/shared';
import { computeCategory, genderLabels } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useToast } from '@/shared/ui/toast';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { fetchPlayer, deletePlayer } from '../api/playerApi';
import { fetchPlayerLicenses } from '@/features/licenses/api/licenseApi';
import { fetchCategories } from '@/features/settings/api/categoryApi';

interface PlayerDetailProps {
  readonly playerId: string;
}

const licenseStatusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  active: 'success',
  pending: 'warning',
  expired: 'secondary',
  rejected: 'destructive',
};

export function PlayerDetail({ playerId }: PlayerDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [player, setPlayer] = useState<Player | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [categories, setCategories] = useState<
    ReadonlyArray<{ name: string; minAge: number; maxAge: number | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!session?.accessToken) return;
    setError(null);
    try {
      const [playerData, licensesData, categoryList] = await Promise.all([
        fetchPlayer(session.accessToken, playerId),
        fetchPlayerLicenses(session.accessToken, playerId),
        fetchCategories(session.accessToken),
      ]);
      setPlayer(playerData);
      setLicenses(licensesData);
      setCategories(
        categoryList.map((c) => ({ name: c.name, minAge: c.minAge, maxAge: c.maxAge })),
      );
    } catch {
      setError('Failed to load player');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, playerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeleteConfirm() {
    if (!session?.accessToken || !player) return;
    setDeleteLoading(true);
    try {
      await deletePlayer(session.accessToken, player.id);
      toast({ title: 'Player deleted', variant: 'success' });
      setDeleteOpen(false);
      router.push('/players');
      router.refresh();
    } catch {
      toast({ title: 'Failed to delete player', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-2 h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>;
  }

  if (!player) {
    return <p className="text-destructive">Player not found</p>;
  }

  const currentYear = new Date().getFullYear();
  const category = computeCategory(new Date(player.birthDate), currentYear, categories);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Players', href: '/players' },
          { label: `${player.lastName} ${player.firstName}` },
        ]}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {player.lastName} {player.firstName}
          </CardTitle>
          <div className="flex gap-2">
            <Link href={`/players/${playerId}/edit`}>
              <Button variant="outline" size="sm" aria-label="Edit player">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete player"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Birth Date</dt>
              <dd>{new Date(player.birthDate).toLocaleDateString('fr-FR')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Category</dt>
              <dd>
                <Badge variant="secondary">{category}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Gender</dt>
              <dd>{genderLabels[player.gender] ?? player.gender}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Address</dt>
              <dd>{player.address}</dd>
            </div>
            {player.phone && (
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{player.phone}</dd>
              </div>
            )}
            {player.email && (
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{player.email}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Licenses</CardTitle>
          <Link href={`/licenses/new?playerId=${playerId}`}>
            <Button size="sm">Add License</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {licenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No licenses yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-mono">{license.number}</TableCell>
                    <TableCell>{license.category}</TableCell>
                    <TableCell>
                      <Badge variant={licenseStatusVariant[license.status] ?? 'secondary'}>
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(license.startDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{new Date(license.endDate).toLocaleDateString('fr-FR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Player"
        description="Are you sure you want to delete this player? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
