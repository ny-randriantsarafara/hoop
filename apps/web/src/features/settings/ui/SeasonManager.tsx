'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { Season } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useToast } from '@/shared/ui/toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/ui/table';
import {
  fetchSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
} from '../api/seasonApi';

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function SeasonManager() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newActive, setNewActive] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSeasons = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSeasons(session.accessToken);
      setSeasons(data);
    } catch {
      setError('Failed to load seasons');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  async function handleAdd() {
    if (!session?.accessToken || !newLabel.trim() || !newStart || !newEnd) return;
    setSaving(true);
    try {
      await createSeason(session.accessToken, {
        label: newLabel.trim(),
        startDate: newStart,
        endDate: newEnd,
        active: newActive,
      });
      toast({ title: 'Season created', variant: 'success' });
      setAdding(false);
      setNewLabel('');
      setNewStart('');
      setNewEnd('');
      setNewActive(false);
      loadSeasons();
    } catch {
      toast({ title: 'Failed to create season', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(season: Season) {
    setEditId(season.id);
    setEditLabel(season.label);
    setEditStart(new Date(season.startDate).toISOString().split('T')[0] ?? '');
    setEditEnd(new Date(season.endDate).toISOString().split('T')[0] ?? '');
  }

  function cancelEdit() {
    setEditId(null);
    setEditLabel('');
    setEditStart('');
    setEditEnd('');
  }

  async function handleEdit() {
    if (!session?.accessToken || !editId || !editLabel.trim()) return;
    setSaving(true);
    try {
      await updateSeason(session.accessToken, editId, {
        label: editLabel.trim(),
        startDate: editStart,
        endDate: editEnd,
      });
      toast({ title: 'Season updated', variant: 'success' });
      setEditId(null);
      loadSeasons();
    } catch {
      toast({ title: 'Failed to update season', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(season: Season) {
    if (!session?.accessToken) return;
    try {
      await updateSeason(session.accessToken, season.id, { active: !season.active });
      toast({
        title: season.active ? 'Season deactivated' : 'Season activated',
        variant: 'success',
      });
      loadSeasons();
    } catch {
      toast({ title: 'Failed to update season', variant: 'destructive' });
    }
  }

  async function handleDeleteConfirm() {
    if (!session?.accessToken || !deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteSeason(session.accessToken, deleteId);
      toast({ title: 'Season deleted', variant: 'success' });
      setDeleteId(null);
      loadSeasons();
    } catch {
      toast({ title: 'Failed to delete season', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  }

  function cancelAdd() {
    setAdding(false);
    setNewLabel('');
    setNewStart('');
    setNewEnd('');
    setNewActive(false);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seasons</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seasons</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Seasons</CardTitle>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Season
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        {adding && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-medium">New Season</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="new-label">Label</Label>
                <Input
                  id="new-label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. 2024-2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-start">Start Date</Label>
                <Input
                  id="new-start"
                  type="date"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-end">End Date</Label>
                <Input
                  id="new-end"
                  type="date"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2 space-y-0 sm:items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newActive}
                    onChange={(e) => setNewActive(e.target.checked)}
                    className="rounded border-input"
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={saving || !newLabel.trim() || !newStart || !newEnd}
              >
                <Check className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancelAdd} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasons.map((season) => (
                <TableRow key={season.id}>
                  {editId === season.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleEdit}
                            disabled={saving || !editLabel.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{season.label}</TableCell>
                      <TableCell>{formatDate(season.startDate)}</TableCell>
                      <TableCell>{formatDate(season.endDate)}</TableCell>
                      <TableCell>
                        {season.active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(season)}
                            disabled={saving}
                            title={season.active ? 'Deactivate' : 'Activate'}
                          >
                            {season.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(season)}
                            disabled={saving}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(season.id)}
                            disabled={saving}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {seasons.map((season) => (
            <div
              key={season.id}
              className="rounded-lg border p-4 space-y-2"
            >
              {editId === season.id ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Start</Label>
                      <Input
                        type="date"
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End</Label>
                      <Input
                        type="date"
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleEdit}
                      disabled={saving || !editLabel.trim()}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{season.label}</span>
                    {season.active && <Badge variant="success">Active</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(season.startDate)} — {formatDate(season.endDate)}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(season)}
                      disabled={saving}
                    >
                      {season.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(season)}
                      disabled={saving}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(season.id)}
                      disabled={saving}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {seasons.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">
            No seasons yet. Add your first season above.
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Season"
        description="Are you sure you want to delete this season? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </Card>
  );
}
