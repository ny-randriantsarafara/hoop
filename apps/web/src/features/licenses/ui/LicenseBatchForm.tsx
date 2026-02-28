'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import type { Player, Season } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { fetchPlayers } from '@/features/players/api/playerApi';
import { createLicensesBatch } from '../api/licenseApi';
import { fetchSeasons } from '@/features/settings/api/seasonApi';
import { fetchCategories } from '@/features/settings/api/categoryApi';

interface BatchRow {
  readonly id: string;
  playerId: string;
  number: string;
  category: string;
}

function generateId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function LicenseBatchForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [categories, setCategories] = useState<ReadonlyArray<{ name: string }>>([]);
  const [seasonId, setSeasonId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState<BatchRow[]>(() => [
    { id: generateId(), playerId: '', number: '', category: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    Promise.all([
      fetchPlayers(session.accessToken),
      fetchSeasons(session.accessToken),
      fetchCategories(session.accessToken),
    ])
      .then(([playerList, seasonList, categoryList]) => {
        setPlayers(playerList);
        setSeasons(seasonList);
        setCategories(categoryList);
      })
      .catch(() => {
        toast({ title: 'Failed to load data', variant: 'destructive' });
      })
      .finally(() => setDataLoading(false));
  }, [session?.accessToken, toast]);

  function addRow() {
    setRows((prev) => [...prev, { id: generateId(), playerId: '', number: '', category: '' }]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function updateRow(id: string, updates: Partial<BatchRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;

    const validRows = rows.filter((r) => r.playerId && r.number.trim() && r.category);
    if (validRows.length === 0) {
      setError('Add at least one row with player, license number, and category');
      return;
    }

    const rowsWithCategory = validRows
      .map((r) => ({ row: r, category: categories.find((c) => c.name === r.category)?.name }))
      .filter((item): item is { row: BatchRow; category: string } => item.category !== undefined);
    if (rowsWithCategory.length !== validRows.length) {
      setError('All rows must have a valid category');
      return;
    }

    if (!seasonId || !startDate || !endDate) {
      setError('Please select a season and enter start and end dates');
      return;
    }

    setLoading(true);
    setError('');

    const activeStatus = 'active' as const;
    const licenses = rowsWithCategory.map(({ row, category }) => ({
      playerId: row.playerId,
      seasonId,
      number: row.number.trim(),
      status: activeStatus,
      category,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    }));

    try {
      await createLicensesBatch(session.accessToken, licenses);

      toast({ title: 'Licenses created', variant: 'success' });
      router.push('/licenses');
      router.refresh();
    } catch {
      toast({ title: 'Failed to create licenses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (dataLoading) {
    return (
      <Card className="max-w-4xl">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Batch Entry</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter multiple licenses with shared season and dates
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="batch-seasonId">Season</Label>
              <Select
                id="batch-seasonId"
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                required
              >
                <option value="">Select season...</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-startDate">Start Date</Label>
              <Input
                id="batch-startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-endDate">End Date</Label>
              <Input
                id="batch-endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Licenses</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                Add Row
              </Button>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Select
                          value={row.playerId}
                          onChange={(e) => updateRow(row.id, { playerId: e.target.value })}
                        >
                          <option value="">Select...</option>
                          {players.map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.lastName} {player.firstName}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="e.g. 2025-001234"
                          value={row.number}
                          onChange={(e) => updateRow(row.id, { number: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.category}
                          onChange={(e) => updateRow(row.id, { category: e.target.value })}
                        >
                          <option value="">Select...</option>
                          {categories.map((cat) => (
                            <option key={cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save All'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
