'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import { getFormString } from '@/shared/lib/formUtils';
import { createPlayer } from '../api/playerApi';

export function PlayerForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !session?.user?.clubId) return;

    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const firstName = getFormString(formData, 'firstName');
    const lastName = getFormString(formData, 'lastName');
    const birthDate = getFormString(formData, 'birthDate');
    const gender = getFormString(formData, 'gender');
    const address = getFormString(formData, 'address');
    const phone = getFormString(formData, 'phone') || undefined;
    const email = getFormString(formData, 'email') || undefined;

    try {
      await createPlayer(session.accessToken, {
        clubId: session.user.clubId,
        firstName,
        lastName,
        birthDate,
        gender,
        address,
        phone,
        email,
      });

      toast({ title: 'Player created', variant: 'success' });
      router.push('/players');
      router.refresh();
    } catch {
      toast({ title: 'Failed to create player', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>New Player</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input id="birthDate" name="birthDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select id="gender" name="gender" required>
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
            <Input id="address" name="address" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Player'}
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
