'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import type { Player, Season, Template } from '@hoop/shared';
import { computeCategory, genderLabels } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { SearchableSelect } from '@/shared/ui/searchable-select';
import { TableSkeleton } from '@/shared/ui/skeleton';
import { PlayerFilterBar } from '@/shared/ui/player-filter-bar';
import { useToast } from '@/shared/ui/toast';
import { fetchTemplates } from '@/features/templates/api/templateApi';
import { fetchPlayers } from '@/features/players/api/playerApi';
import { fetchSeasons } from '@/features/settings/api/seasonApi';
import { fetchCategories } from '@/features/settings/api/categoryApi';
import { generateDocument } from '../api/documentApi';
import { cn } from '@/shared/lib/utils';

const STEPS = ['Choose Template', 'Select Players', 'Generate'] as const;
type StepIndex = 0 | 1 | 2;

export function DocumentGenerator() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<StepIndex>(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [templates, setTemplates] = useState<readonly Template[]>([]);
  const [players, setPlayers] = useState<readonly Player[]>([]);
  const [seasons, setSeasons] = useState<readonly Season[]>([]);
  const [categories, setCategories] = useState<
    ReadonlyArray<{ name: string; minAge: number; maxAge: number | null }>
  >([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerGender, setPlayerGender] = useState('');
  const [playerCategory, setPlayerCategory] = useState('');
  const [playerBirthFrom, setPlayerBirthFrom] = useState('');
  const [playerBirthTo, setPlayerBirthTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const [templateList, playerList, seasonList, categoryList] = await Promise.all([
        fetchTemplates(session.accessToken),
        fetchPlayers(session.accessToken),
        fetchSeasons(session.accessToken),
        fetchCategories(session.accessToken),
      ]);
      setTemplates(templateList);
      setPlayers(playerList);
      setSeasons(seasonList);
      setCategories(
        categoryList.map((c) => ({ name: c.name, minAge: c.minAge, maxAge: c.maxAge })),
      );
      const activeSeason = seasonList.find((s) => s.active);
      if (activeSeason && !selectedSeasonId) {
        setSelectedSeasonId(activeSeason.id);
      } else if (seasonList.length > 0 && !selectedSeasonId) {
        setSelectedSeasonId(seasonList[0].id);
      }
    } catch {
      toast({ title: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function togglePlayer(playerId: string) {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);
  const selectedPlayers = players.filter((p) => selectedPlayerIds.has(p.id));
  const seasonYear = selectedSeason
    ? new Date(selectedSeason.startDate).getFullYear()
    : new Date().getFullYear();

  const filteredPlayers = players.filter((player) => {
    if (playerGender && player.gender !== playerGender) return false;

    if (playerCategory) {
      const cat = computeCategory(new Date(player.birthDate), seasonYear, categories);
      if (cat !== playerCategory) return false;
    }

    if (playerBirthFrom) {
      if (new Date(player.birthDate) < new Date(playerBirthFrom)) return false;
    }

    if (playerBirthTo) {
      if (new Date(player.birthDate) > new Date(playerBirthTo)) return false;
    }

    if (playerSearch) {
      const words = playerSearch.toLowerCase().trim().split(/\s+/);
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      if (!words.every((word) => fullName.includes(word))) return false;
    }

    return true;
  });

  function clearPlayerFilters() {
    setPlayerGender('');
    setPlayerCategory('');
    setPlayerBirthFrom('');
    setPlayerBirthTo('');
  }

  function toggleAllPlayers() {
    const filteredIds = new Set(filteredPlayers.map((p) => p.id));
    const allFilteredSelected = filteredPlayers.every((p) => selectedPlayerIds.has(p.id));

    if (allFilteredSelected) {
      setSelectedPlayerIds((prev) => {
        const next = new Set(prev);
        for (const id of filteredIds) {
          next.delete(id);
        }
        return next;
      });
    } else {
      setSelectedPlayerIds((prev) => new Set([...prev, ...filteredIds]));
    }
  }

  const seasonOptions = seasons.map((s) => ({ value: s.id, label: s.label }));

  async function handleGenerate() {
    if (!session?.accessToken || !selectedTemplateId || !selectedSeasonId) return;
    if (selectedPlayerIds.size === 0) {
      toast({ title: 'Select at least one player', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      await generateDocument(session.accessToken, {
        templateId: selectedTemplateId,
        playerIds: Array.from(selectedPlayerIds),
        seasonId: selectedSeasonId,
      });
      toast({ title: 'Document generated', variant: 'success' });
    } catch {
      toast({ title: 'Failed to generate document', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <TableSkeleton columns={4} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Document</CardTitle>
        <div className="flex items-center gap-2 pt-4">
          {STEPS.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                      ? 'border-2 border-primary bg-primary text-primary-foreground'
                      : 'border border-muted-foreground/30 bg-muted text-muted-foreground',
                )}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span
                className={cn(
                  'hidden sm:inline text-sm',
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
              {index < STEPS.length - 1 && (
                <div className="ml-1 h-px w-4 bg-muted-foreground/30" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            {templates.length === 0 ? (
              <p className="text-muted-foreground">
                No templates yet.{' '}
                <Link
                  href="/templates/builder"
                  className="text-primary underline hover:no-underline"
                >
                  Create a template
                </Link>{' '}
                to get started.
              </p>
            ) : (
              <div className="space-y-2">
                <Label>Templates</Label>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <label
                      key={template.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplateId === template.id}
                        onChange={() => setSelectedTemplateId(template.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <span className="font-medium">{template.name}</span>
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary">{template.format.toUpperCase()}</Badge>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                disabled={templates.length === 0 || !selectedTemplateId}
                onClick={() => setCurrentStep(1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Season</Label>
              <SearchableSelect
                options={seasonOptions}
                value={selectedSeasonId}
                onChange={setSelectedSeasonId}
                placeholder="Select season..."
                searchPlaceholder="Search season..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Players</Label>
                <span className="text-sm text-muted-foreground">
                  {selectedPlayerIds.size} selected
                </span>
              </div>
              <PlayerFilterBar
                categories={categories}
                search={playerSearch}
                onSearchChange={setPlayerSearch}
                gender={playerGender}
                onGenderChange={setPlayerGender}
                category={playerCategory}
                onCategoryChange={setPlayerCategory}
                birthDateFrom={playerBirthFrom}
                onBirthDateFromChange={setPlayerBirthFrom}
                birthDateTo={playerBirthTo}
                onBirthDateToChange={setPlayerBirthTo}
                onClear={clearPlayerFilters}
              />
              <div className="hidden md:block rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <input
                          type="checkbox"
                          checked={
                            filteredPlayers.length > 0 &&
                            filteredPlayers.every((p) => selectedPlayerIds.has(p.id))
                          }
                          onChange={toggleAllPlayers}
                          className="h-4 w-4 rounded border-input"
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Birth Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Gender</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No players found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedPlayerIds.has(player.id)}
                              onChange={() => togglePlayer(player.id)}
                              className="h-4 w-4 rounded border-input"
                              aria-label={`Select ${player.lastName} ${player.firstName}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {player.lastName} {player.firstName}
                          </TableCell>
                          <TableCell>
                            {new Date(player.birthDate).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {computeCategory(new Date(player.birthDate), seasonYear, categories)}
                            </Badge>
                          </TableCell>
                          <TableCell>{genderLabels[player.gender] ?? player.gender}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 md:hidden">
                {filteredPlayers.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No players found</p>
                ) : (
                  filteredPlayers.map((player) => (
                    <label
                      key={player.id}
                      className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.has(player.id)}
                        onChange={() => togglePlayer(player.id)}
                        className="mt-1 h-4 w-4 rounded border-input"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">
                          {player.lastName} {player.firstName}
                        </span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span>{new Date(player.birthDate).toLocaleDateString('fr-FR')}</span>
                          <span>{genderLabels[player.gender] ?? player.gender}</span>
                          <Badge variant="secondary">
                            {computeCategory(new Date(player.birthDate), seasonYear, categories)}
                          </Badge>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <Button
                disabled={selectedPlayerIds.size === 0 || !selectedSeasonId}
                onClick={() => setCurrentStep(2)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
              <p className="font-medium">Summary</p>
              <p className="text-sm text-muted-foreground">
                Template: {selectedTemplate?.name ?? '—'}
              </p>
              <p className="text-sm text-muted-foreground">
                Season: {selectedSeason?.label ?? '—'}
              </p>
              <p className="text-sm text-muted-foreground">Players: {selectedPlayerIds.size}</p>
            </div>
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="hidden md:block rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Birth Date</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPlayers.map((player, index) => (
                      <TableRow key={player.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {player.lastName} {player.firstName}
                        </TableCell>
                        <TableCell>
                          {new Date(player.birthDate).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{genderLabels[player.gender] ?? player.gender}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {computeCategory(new Date(player.birthDate), seasonYear, categories)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 md:hidden">
                {selectedPlayers.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No players selected</p>
                ) : (
                  selectedPlayers.map((player, index) => (
                    <div key={player.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {index + 1}. {player.lastName} {player.firstName}
                        </span>
                        <Badge variant="secondary">
                          {computeCategory(new Date(player.birthDate), seasonYear, categories)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{new Date(player.birthDate).toLocaleDateString('fr-FR')}</span>
                        <span>{genderLabels[player.gender] ?? player.gender}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button disabled={generating} onClick={handleGenerate}>
                {generating ? 'Generating...' : 'Generate Document'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
