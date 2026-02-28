'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Player, Season } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import { fetchPlayers } from '@/features/players/api/playerApi';
import { getFormString } from '@/shared/lib/formUtils';
import { createLicense } from '../api/licenseApi';
import { fetchSeasons } from '@/features/settings/api/seasonApi';
import { fetchCategories } from '@/features/settings/api/categoryApi';

interface LicenseFormProps {
  readonly defaultPlayerId?: string;
}

export function LicenseForm({ defaultPlayerId }: LicenseFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [categories, setCategories] = useState<ReadonlyArray<{ name: string }>>([]);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;

    setLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const playerId = getFormString(formData, 'playerId');
    const seasonId = getFormString(formData, 'seasonId');
    const number = getFormString(formData, 'number');
    const categoryValue = getFormString(formData, 'category');
    const category = categories.find((c) => c.name === categoryValue)?.name;
    const startDate = getFormString(formData, 'startDate');
    const endDate = getFormString(formData, 'endDate');

    if (!category) {
      setError('Please select a valid category');
      setLoading(false);
      return;
    }

    try {
      await createLicense(session.accessToken, {
        playerId,
        seasonId,
        number,
        status: 'active',
        category,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      toast({ title: 'License created', variant: 'success' });
      router.push('/licenses');
      router.refresh();
    } catch {
      toast({ title: 'Failed to create license', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (dataLoading) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Single Entry</CardTitle>
        <p className="text-sm text-muted-foreground">Enter license details for one player</p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerId">Player</Label>
            <Select id="playerId" name="playerId" required defaultValue={defaultPlayerId}>
              <option value="">Select player...</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.lastName} {player.firstName}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seasonId">Season</Label>
            <Select id="seasonId" name="seasonId" required>
              <option value="">Select season...</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="number">License Number</Label>
            <Input id="number" name="number" required placeholder="e.g. 2025-001234" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" required>
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create License'}
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
