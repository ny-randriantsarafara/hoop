'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ScanLine, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import { getFormString } from '@/shared/lib/formUtils';
import { createPlayer } from '../api/playerApi';
import { extractDocument } from '@/features/ocr/api/ocrApi';
import type { OcrPlayerData } from '@hoop/shared';

export function PlayerForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function prefillForm(player: OcrPlayerData) {
    const form = formRef.current;
    if (!form) return;

    const fields: Array<[string, string | null]> = [
      ['lastName', player.lastName],
      ['firstName', player.firstName],
      ['birthDate', player.birthDate],
      ['gender', player.gender],
      ['address', player.address],
      ['phone', player.phone],
      ['email', player.email],
    ];

    for (const [name, value] of fields) {
      if (!value) continue;
      const element = form.elements.namedItem(name);
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
        element.value = value;
      }
    }
  }

  async function handleImport() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !session?.accessToken) return;

    setExtracting(true);
    try {
      const result = await extractDocument(session.accessToken, file);
      if (result.player) prefillForm(result.player);
      toast({ title: 'Document scanned — review the fields below', variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Extraction failed';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setExtracting(false);
    }
  }

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
        <div className="flex items-center justify-between">
          <CardTitle>New Player</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={extracting}
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4 mr-2" />
                Import from document
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
