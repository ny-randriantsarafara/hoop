'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, RotateCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import type { OcrExtractionResponse, OcrPlayerData, OcrLicenseData } from '@hoop/shared';
import { extractDocument, saveValidatedData } from '../api/ocr-api';
import { createPlayer } from '@/features/players/api/player-api';
import { createLicense } from '@/features/licenses/api/license-api';
import { fetchSeasons } from '@/features/settings/api/season-api';
import { fetchCategories, type CategoryConfig } from '@/features/settings/api/category-api';
import { DocumentDropzone } from './document-dropzone';
import { ExtractionReview } from './extraction-review';
import { prepareLicenseInput } from '../lib/license-draft';
import { preparePlayerInput } from '../lib/player-draft';

type FlowState =
  | { step: 'idle' }
  | { step: 'extracting' }
  | { step: 'review'; extraction: OcrExtractionResponse }
  | { step: 'saved'; playerName: string }
  | { step: 'error'; message: string };

const playerFieldLabels: Readonly<Record<string, string>> = {
  firstName: 'first name',
  lastName: 'last name',
  birthDate: 'birth date',
  gender: 'gender',
  address: 'address',
  phone: 'phone',
  email: 'email',
};

export function ImportFlow() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<FlowState>({ step: 'idle' });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ReadonlyArray<CategoryConfig>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;

    setCategoriesLoading(true);
    fetchCategories(session.accessToken)
      .then((items) => {
        const byNormalizedId = new Map<string, CategoryConfig>();
        for (const item of items) {
          if (!item.name.trim()) continue;
          if (!byNormalizedId.has(item.id)) {
            byNormalizedId.set(item.id, item);
          }
        }
        setCategories(Array.from(byNormalizedId.values()));
      })
      .catch((error) => {
        setCategories([]);
        toast({
          title: 'Failed to load categories',
          description: getErrorMessage(error, 'License category must be selected from settings.'),
          variant: 'destructive',
        });
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, [session?.accessToken, toast]);

  function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  function getPlayerName(player: OcrPlayerData): string {
    const name = [player.firstName?.trim(), player.lastName?.trim()].filter(Boolean).join(' ');
    return name || 'Player';
  }

  function formatFieldList(
    fields: ReadonlyArray<string>,
    labels: Readonly<Record<string, string>>,
  ): string {
    return fields.map((field) => labels[field] ?? field).join(', ');
  }

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
      const preparedPlayer = preparePlayerInput(player, session.user.clubId);
      if (preparedPlayer.kind === 'invalid') {
        toast({
          title: 'Player data is invalid',
          description: `Please review: ${formatFieldList(preparedPlayer.fields, playerFieldLabels)}.`,
          variant: 'destructive',
        });
        return;
      }

      await createPlayer(session.accessToken, preparedPlayer.data);

      try {
        await saveValidatedData(session.accessToken, extractionId, {
          validatedData: {
            player,
            license: { number: null, category: null, startDate: null, endDate: null },
          },
        });
      } catch (error) {
        toast({
          title: 'Player saved, but import validation was not saved',
          description: getErrorMessage(error, 'You can continue using the player normally.'),
        });
      }

      const name = getPlayerName(player);
      setState({ step: 'saved', playerName: name });
      toast({ title: `Player ${name} created`, variant: 'success' });
    } catch (error) {
      toast({
        title: 'Failed to save player',
        description: getErrorMessage(error, 'Please review the fields and try again.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePlayerAndLicense(
    player: OcrPlayerData,
    license: OcrLicenseData,
    extractionId: string,
    categoryId: string | null,
  ) {
    if (!session?.accessToken || !session.user?.clubId) return;

    setSaving(true);
    const playerName = getPlayerName(player);
    let playerCreated = false;
    try {
      const preparedPlayer = preparePlayerInput(player, session.user.clubId);
      if (preparedPlayer.kind === 'invalid') {
        toast({
          title: 'Player data is invalid',
          description: `Please review: ${formatFieldList(preparedPlayer.fields, playerFieldLabels)}.`,
          variant: 'destructive',
        });
        return;
      }

      const seasons = await fetchSeasons(session.accessToken);
      const activeSeason = seasons.find((season) => season.active);

      let licenseData: ReturnType<typeof prepareLicenseInput> | null = null;
      if (activeSeason) {
        if (categories.length === 0) {
          toast({
            title: 'No categories configured',
            description: 'Add categories in settings before creating licenses from imports.',
            variant: 'destructive',
          });
          return;
        }

        licenseData = prepareLicenseInput(license, categoryId);
        if (licenseData.kind === 'invalid') {
          const fieldLabels: Record<string, string> = {
            number: 'license number',
            category: 'category',
            startDate: 'start date',
            endDate: 'end date',
          };
          const missingFields = licenseData.missing
            .map((field) => fieldLabels[field] ?? field)
            .join(', ');
          toast({
            title: 'License data is incomplete',
            description: `Please fill: ${missingFields}.`,
            variant: 'destructive',
          });
          return;
        }
      }

      const createdPlayer = await createPlayer(session.accessToken, preparedPlayer.data);
      playerCreated = true;

      try {
        await saveValidatedData(session.accessToken, extractionId, {
          validatedData: { player, license },
        });
      } catch (error) {
        toast({
          title: 'Player saved, but import validation was not saved',
          description: getErrorMessage(error, 'You can continue using the player normally.'),
        });
      }

      if (!activeSeason) {
        setState({ step: 'saved', playerName });
        toast({
          title: `Player ${playerName} created`,
          description: 'License was skipped because no active season is configured.',
        });
        return;
      }

      if (!licenseData || licenseData.kind !== 'ready') {
        toast({
          title: 'License data is incomplete',
          description: 'Please complete the license fields before saving.',
          variant: 'destructive',
        });
        return;
      }

      await createLicense(session.accessToken, {
        playerId: createdPlayer.id,
        seasonId: activeSeason.id,
        categoryId: licenseData.data.categoryId,
        number: licenseData.data.number,
        status: 'active',
        startDate: licenseData.data.startDate,
        endDate: licenseData.data.endDate,
      });

      setState({ step: 'saved', playerName });
      toast({ title: `Player ${playerName} and license created`, variant: 'success' });
    } catch (error) {
      const message = getErrorMessage(error, 'Please review the fields and try again.');
      if (playerCreated) {
        setState({ step: 'saved', playerName });
        toast({
          title: `Player ${playerName} created, but license was not`,
          description: message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Failed to save player and license',
        description: message,
        variant: 'destructive',
      });
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
          <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
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
          categories={categories}
          categoriesLoading={categoriesLoading}
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
          <p className="text-sm font-medium">{state.playerName} has been saved</p>
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
          <DocumentDropzone onFileSelected={handleFileSelected} error={state.message} />
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
          Upload a photo or scan of a birth certificate, license card, ID card, or any official
          document. The system will extract player information automatically.
        </p>
      </CardContent>
    </Card>
  );
}
