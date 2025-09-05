'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import { Skeleton } from '@/shared/ui/skeleton';
import { getFormString } from '@/shared/lib/formUtils';
import { fetchPlayer, updatePlayer } from '../api/playerApi';

interface PlayerEditFormProps {
  readonly playerId: string;
}

export function PlayerEditForm({ playerId }: PlayerEditFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [player, setPlayer] = useState<{
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly birthDate: string;
    readonly gender: string;
    readonly address: string;
    readonly phone: string | null;
    readonly email: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlayer = useCallback(async () => {
    if (!session?.accessToken) return;
    setError(null);
    try {
      const data = await fetchPlayer(session.accessToken, playerId);
      setPlayer({
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: new Date(data.birthDate).toISOString().slice(0, 10),
        gender: data.gender,
        address: data.address,
        phone: data.phone,
        email: data.email,
      });
    } catch {
      setError('Failed to load player');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, playerId]);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !player) return;

    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const firstName = getFormString(formData, 'firstName');
    const lastName = getFormString(formData, 'lastName');
    const birthDate = getFormString(formData, 'birthDate');
    const gender = getFormString(formData, 'gender');
    const address = getFormString(formData, 'address');
    const phone = getFormString(formData, 'phone') || undefined;
    const email = getFormString(formData, 'email') || undefined;

    try {
      await updatePlayer(session.accessToken, playerId, {
        firstName,
        lastName,
        birthDate,
        gender,
        address,
        phone: phone || null,
        email: email || null,
      });

      toast({ title: 'Player updated', variant: 'success' });
      router.push(`/players/${playerId}`);
      router.refresh();
    } catch {
      toast({ title: 'Failed to update player', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <Skeleton className="h-8 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
    );
  }

  if (!player) {
    return <p className="text-destructive">Player not found</p>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Players', href: '/players' },
          { label: `${player.lastName} ${player.firstName}`, href: `/players/${playerId}` },
          { label: 'Edit' },
        ]}
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Player</CardTitle>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" defaultValue={player.lastName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" defaultValue={player.firstName} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={player.birthDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select id="gender" name="gender" required defaultValue={player.gender}>
                <option value="">Select...</option>
                <option value="G">Boy (G)</option>
                <option value="F">Girl (F)</option>
                <option value="H">Man (H)</option>
                <option value="D">Woman (D)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={player.address} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={player.phone ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={player.email ?? ''} />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push(`/players/${playerId}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
