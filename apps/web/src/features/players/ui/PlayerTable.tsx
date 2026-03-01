'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import type { Player } from '@hoop/shared';
import { computeCategory, genderLabels, playerFilterFields } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { TableSkeleton } from '@/shared/ui/skeleton';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useToast } from '@/shared/ui/toast';
import { FilterBar } from '@/shared/ui/filter-bar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { fetchPlayers, deletePlayer } from '../api/playerApi';
import { fetchCategories } from '@/features/settings/api/categoryApi';
import { fetchSeasons } from '@/features/settings/api/seasonApi';
import Link from 'next/link';

const EMPTY_FILTERS: Record<string, string> = {};

export function PlayerTable() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<
    Array<{ name: string; minAge: number; maxAge: number | null }>
  >([]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dynamicOptions, setDynamicOptions] = useState<
    Record<string, ReadonlyArray<{ value: string; label: string }>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filterValues['search'] ?? ''), 300);
    return () => clearTimeout(timer);
  }, [filterValues['search']]);

  useEffect(() => {
    if (!session?.accessToken) return;

    Promise.all([fetchCategories(session.accessToken), fetchSeasons(session.accessToken)])
      .then(([cats, seasons]) => {
        setCategories(cats.map((c) => ({ name: c.name, minAge: c.minAge, maxAge: c.maxAge })));
        setDynamicOptions({
          category: cats.map((c) => ({ value: c.name, label: c.name })),
          seasonId: seasons.map((s) => ({ value: s.id, label: s.label })),
        });
      })
      .catch(() => {
        setCategories([]);
        setDynamicOptions({});
      });
  }, [session?.accessToken]);

  const loadPlayers = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const apiFilters: Record<string, string | undefined> = {
        ...filterValues,
        search: debouncedSearch || undefined,
      };
      const data = await fetchPlayers(session.accessToken, apiFilters);
      setPlayers(data);
    } catch {
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, debouncedSearch, filterValues]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  function handleFilterChange(key: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilterValues(EMPTY_FILTERS);
  }

  async function handleDeleteConfirm() {
    if (!session?.accessToken || !deleteId) return;
    setDeleteLoading(true);
    try {
      await deletePlayer(session.accessToken, deleteId);
      toast({ title: 'Player deleted', variant: 'success' });
      setDeleteId(null);
      loadPlayers();
    } catch {
      toast({ title: 'Failed to delete player', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <FilterBar
            fields={playerFilterFields}
            values={filterValues}
            onChange={handleFilterChange}
            onClear={clearFilters}
            dynamicOptions={dynamicOptions}
          />
        </div>
        <Link href="/players/new" className="w-full md:w-auto md:shrink-0">
          <Button size="sm" className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
      )}

      <div className="hidden md:block rounded-lg border">
        {loading ? (
          <TableSkeleton columns={6} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Birth Date</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No players found
                  </TableCell>
                </TableRow>
              ) : (
                players.map((player) => (
                  <TableRow
                    key={player.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/players/${player.id}`)}
                  >
                    <TableCell className="font-medium">
                      {player.lastName} {player.firstName}
                    </TableCell>
                    <TableCell>{new Date(player.birthDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{genderLabels[player.gender] ?? player.gender}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {computeCategory(new Date(player.birthDate), currentYear, categories)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{player.address}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(player.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading...</p>
        ) : (
          <>
            {players.map((player) => (
              <div
                key={player.id}
                className="cursor-pointer rounded-lg border p-4 space-y-2 active:bg-muted/50"
                onClick={() => router.push(`/players/${player.id}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {player.lastName} {player.firstName}
                  </span>
                  <Badge variant="secondary">
                    {computeCategory(new Date(player.birthDate), currentYear, categories)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{new Date(player.birthDate).toLocaleDateString('fr-FR')}</span>
                  <span>{genderLabels[player.gender] ?? player.gender}</span>
                </div>
                <div className="text-sm text-muted-foreground truncate">{player.address}</div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(player.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {players.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No players found</p>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
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
