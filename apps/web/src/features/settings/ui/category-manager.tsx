'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { genderLabels } from '@hoop/shared';
import type { Gender } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useToast } from '@/shared/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryConfig,
} from '../api/category-api';

const GENDER_OPTIONS: ReadonlyArray<Gender> = ['G', 'F', 'H', 'D'];

function parseGender(value: string): Gender {
  if (value === 'F') return 'F';
  if (value === 'H') return 'H';
  if (value === 'D') return 'D';
  return 'G';
}

interface CategoryDraft {
  readonly name: string;
  readonly gender: Gender;
  readonly minAge: string;
  readonly maxAge: string;
  readonly displayOrder: string;
}

const EMPTY_DRAFT: CategoryDraft = {
  name: '',
  gender: 'G',
  minAge: '',
  maxAge: '',
  displayOrder: '0',
};

function buildPayload(draft: CategoryDraft): {
  readonly name: string;
  readonly gender: Gender;
  readonly minAge: number;
  readonly maxAge: number | null;
  readonly displayOrder: number;
} | null {
  const trimmedName = draft.name.trim();
  const parsedMinAge = Number(draft.minAge);
  const parsedMaxAge = draft.maxAge.trim() === '' ? null : Number(draft.maxAge);
  const parsedDisplayOrder = Number(draft.displayOrder);

  const hasInvalidMinAge = Number.isNaN(parsedMinAge) || parsedMinAge < 0;
  const hasInvalidMaxAge =
    parsedMaxAge !== null && (Number.isNaN(parsedMaxAge) || parsedMaxAge < 0);
  const hasInvalidDisplayOrder = Number.isNaN(parsedDisplayOrder) || parsedDisplayOrder < 0;

  if (!trimmedName || hasInvalidMinAge || hasInvalidMaxAge || hasInvalidDisplayOrder) {
    return null;
  }

  if (parsedMaxAge !== null && parsedMaxAge < parsedMinAge) {
    return null;
  }

  return {
    name: trimmedName,
    gender: draft.gender,
    minAge: parsedMinAge,
    maxAge: parsedMaxAge,
    displayOrder: parsedDisplayOrder,
  };
}

function toDraft(category: CategoryConfig): CategoryDraft {
  return {
    name: category.name,
    gender: category.gender,
    minAge: String(category.minAge),
    maxAge: category.maxAge === null ? '' : String(category.maxAge),
    displayOrder: String(category.displayOrder),
  };
}

export function CategoryManager() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ReadonlyArray<CategoryConfig>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<CategoryDraft>(EMPTY_DRAFT);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CategoryDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchCategories(session.accessToken);
      setCategories(data);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function updateNewDraft<K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) {
    setNewDraft((current) => ({ ...current, [key]: value }));
  }

  function updateEditDraft<K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) {
    setEditDraft((current) => ({ ...current, [key]: value }));
  }

  function cancelAdd() {
    setAdding(false);
    setNewDraft(EMPTY_DRAFT);
  }

  function startEdit(category: CategoryConfig) {
    setEditId(category.id);
    setEditDraft(toDraft(category));
  }

  function cancelEdit() {
    setEditId(null);
    setEditDraft(EMPTY_DRAFT);
  }

  async function handleCreate() {
    if (!session?.accessToken) {
      return;
    }

    const payload = buildPayload(newDraft);
    if (!payload) {
      toast({ title: 'Please provide valid category values', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await createCategory(session.accessToken, payload);
      toast({ title: 'Category created', variant: 'success' });
      cancelAdd();
      await loadCategories();
    } catch {
      toast({ title: 'Failed to create category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!session?.accessToken || !editId) {
      return;
    }

    const payload = buildPayload(editDraft);
    if (!payload) {
      toast({ title: 'Please provide valid category values', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await updateCategory(session.accessToken, editId, payload);
      toast({ title: 'Category updated', variant: 'success' });
      cancelEdit();
      await loadCategories();
    } catch {
      toast({ title: 'Failed to update category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!session?.accessToken || !deleteId) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteCategory(session.accessToken, deleteId);
      toast({ title: 'Category deleted', variant: 'success' });
      setDeleteId(null);
      await loadCategories();
    } catch {
      toast({ title: 'Failed to delete category', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
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
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const canSaveNew = buildPayload(newDraft) !== null;
  const canSaveEdit = buildPayload(editDraft) !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categories</CardTitle>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-medium">New Category</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="new-category-name">Name</Label>
                <Input
                  id="new-category-name"
                  value={newDraft.name}
                  onChange={(event) => updateNewDraft('name', event.target.value)}
                  placeholder="e.g. U12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-category-gender">Gender</Label>
                <Select
                  id="new-category-gender"
                  value={newDraft.gender}
                  onChange={(event) => updateNewDraft('gender', parseGender(event.target.value))}
                >
                  {GENDER_OPTIONS.map((gender) => (
                    <option key={gender} value={gender}>
                      {genderLabels[gender]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-category-min-age">Min Age</Label>
                <Input
                  id="new-category-min-age"
                  type="number"
                  min={0}
                  value={newDraft.minAge}
                  onChange={(event) => updateNewDraft('minAge', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-category-max-age">Max Age</Label>
                <Input
                  id="new-category-max-age"
                  type="number"
                  min={0}
                  value={newDraft.maxAge}
                  onChange={(event) => updateNewDraft('maxAge', event.target.value)}
                  placeholder="Leave empty for open-ended"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-category-order">Display Order</Label>
                <Input
                  id="new-category-order"
                  type="number"
                  min={0}
                  value={newDraft.displayOrder}
                  onChange={(event) => updateNewDraft('displayOrder', event.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving || !canSaveNew}>
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

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age Range</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  {editId === category.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editDraft.name}
                          onChange={(event) => updateEditDraft('name', event.target.value)}
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editDraft.gender}
                          onChange={(event) =>
                            updateEditDraft('gender', parseGender(event.target.value))
                          }
                        >
                          {GENDER_OPTIONS.map((gender) => (
                            <option key={gender} value={gender}>
                              {genderLabels[gender]}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            min={0}
                            value={editDraft.minAge}
                            onChange={(event) => updateEditDraft('minAge', event.target.value)}
                            className="h-9"
                          />
                          <Input
                            type="number"
                            min={0}
                            value={editDraft.maxAge}
                            onChange={(event) => updateEditDraft('maxAge', event.target.value)}
                            className="h-9"
                            placeholder="∞"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={editDraft.displayOrder}
                          onChange={(event) => updateEditDraft('displayOrder', event.target.value)}
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleUpdate}
                            disabled={saving || !canSaveEdit}
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
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{genderLabels[category.gender]}</TableCell>
                      <TableCell>
                        {category.minAge} - {category.maxAge ?? '∞'}
                      </TableCell>
                      <TableCell>{category.displayOrder}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(category)}
                            disabled={saving}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(category.id)}
                            disabled={saving}
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

        <div className="space-y-3 md:hidden">
          {categories.map((category) => (
            <div key={category.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {category.name} ({genderLabels[category.gender]})
                </span>
                <span className="text-sm text-muted-foreground">#{category.displayOrder}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Ages {category.minAge} - {category.maxAge ?? '∞'}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(category)}
                  disabled={saving}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteId(category.id)}
                  disabled={saving}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">
            No categories yet. Add your first category above.
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
          }
        }}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </Card>
  );
}
