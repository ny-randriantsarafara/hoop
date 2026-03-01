'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, RotateCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import type { OcrExtractionResponse, OcrPlayerData, OcrLicenseData } from '@hoop/shared';
import { extractDocument, saveValidatedData } from '../api/ocrApi';
import { createPlayer } from '@/features/players/api/playerApi';
import { DocumentDropzone } from './DocumentDropzone';
import { ExtractionReview } from './ExtractionReview';

type FlowState =
  | { step: 'idle' }
  | { step: 'extracting' }
  | { step: 'review'; extraction: OcrExtractionResponse }
  | { step: 'saved'; playerName: string }
  | { step: 'error'; message: string };

export function ImportFlow() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<FlowState>({ step: 'idle' });
  const [saving, setSaving] = useState(false);

  async function handleFileSelected(file: File) {
    if (!session?.accessToken) return;

    setState({ step: 'extracting' });

    try {
      const extraction = await extractDocument(session.accessToken, file);
      setState({ step: 'review', extraction });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Extraction failed';
      setState({ step: 'error', message });
    }
  }

  async function handleSavePlayer(player: OcrPlayerData, extractionId: string) {
    if (!session?.accessToken || !session.user?.clubId) return;

    setSaving(true);
    try {
      await createPlayer(session.accessToken, {
        clubId: session.user.clubId,
        firstName: player.firstName ?? '',
        lastName: player.lastName ?? '',
        birthDate: player.birthDate ?? '',
        gender: player.gender ?? '',
        address: player.address ?? '',
        phone: player.phone ?? undefined,
        email: player.email ?? undefined,
      });

      await saveValidatedData(session.accessToken, extractionId, {
        validatedData: {
          player,
          license: { number: null, category: null, startDate: null, endDate: null },
        },
      });

      const name = [player.firstName, player.lastName].filter(Boolean).join(' ');
      setState({ step: 'saved', playerName: name });
      toast({ title: `Player ${name} created`, variant: 'success' });
    } catch {
      toast({ title: 'Failed to save player', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePlayerAndLicense(
    player: OcrPlayerData,
    license: OcrLicenseData,
    extractionId: string,
  ) {
    if (!session?.accessToken || !session.user?.clubId) return;

    setSaving(true);
    try {
      await createPlayer(session.accessToken, {
        clubId: session.user.clubId,
        firstName: player.firstName ?? '',
        lastName: player.lastName ?? '',
        birthDate: player.birthDate ?? '',
        gender: player.gender ?? '',
        address: player.address ?? '',
        phone: player.phone ?? undefined,
        email: player.email ?? undefined,
      });

      await saveValidatedData(session.accessToken, extractionId, {
        validatedData: { player, license },
      });

      const name = [player.firstName, player.lastName].filter(Boolean).join(' ');
      setState({ step: 'saved', playerName: name });
      toast({ title: `Player ${name} and license created`, variant: 'success' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setState({ step: 'idle' });
  }

  if (state.step === 'extracting') {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium">Analyzing document...</p>
          <p className="text-xs text-muted-foreground mt-1">
            This may take a few seconds
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'review') {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Review Extracted Data</h2>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Scan another
          </Button>
        </div>
        <ExtractionReview
          extraction={state.extraction}
          onSavePlayer={handleSavePlayer}
          onSavePlayerAndLicense={handleSavePlayerAndLicense}
          saving={saving}
        />
      </div>
    );
  }

  if (state.step === 'saved') {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle className="h-10 w-10 text-green-600 mb-4" />
          <p className="text-sm font-medium">
            {state.playerName} has been saved
          </p>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleReset}>Import another</Button>
            <Button variant="outline" onClick={() => router.push('/players')}>
              View players
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'error') {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Import from Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DocumentDropzone
            onFileSelected={handleFileSelected}
            error={state.message}
          />
          <Button variant="outline" size="sm" onClick={handleReset}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Import from Document</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentDropzone onFileSelected={handleFileSelected} />
        <p className="text-xs text-muted-foreground mt-4">
          Upload a photo or scan of a birth certificate, license card, ID card, or any
          official document. The system will extract player information automatically.
        </p>
      </CardContent>
    </Card>
  );
}
