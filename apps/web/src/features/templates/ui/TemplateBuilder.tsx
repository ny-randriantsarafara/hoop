'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { placeholderRegistry, type PlaceholderDefinition } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import { getFormString } from '@/shared/lib/formUtils';
import { generateTemplate } from '../api/templateApi';

const documentEntries = placeholderRegistry.filter((p) => p.scope === 'document');
const playerEntries = placeholderRegistry.filter((p) => p.scope === 'player');

function getLabelForKey(key: string): string {
  const entry = placeholderRegistry.find((p) => p.key === key);
  return entry?.label ?? key;
}

export function TemplateBuilder() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  function togglePlaceholder(key: string) {
    setSelectedColumns((prev) => {
      if (prev.includes(key)) return prev.filter((c) => c !== key);
      return [...prev, key];
    });
  }

  function moveUp(index: number) {
    if (index <= 0) return;
    setSelectedColumns((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index >= selectedColumns.length - 1) return;
    setSelectedColumns((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function renderCheckboxGroup(title: string, entries: ReadonlyArray<PlaceholderDefinition>) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="flex flex-wrap gap-4">
          {entries.map((entry) => (
            <label
              key={entry.key}
              className="flex items-center gap-2 cursor-pointer group"
              title={entry.description}
            >
              <input
                type="checkbox"
                checked={selectedColumns.includes(entry.key)}
                onChange={() => togglePlaceholder(entry.key)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">{entry.label}</span>
              <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </label>
          ))}
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.accessToken) return;

    const formData = new FormData(e.currentTarget);
    const name = getFormString(formData, 'name').trim();
    const description = getFormString(formData, 'description').trim() || undefined;

    if (!name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    if (selectedColumns.length === 0) {
      toast({ title: 'Select at least one column', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await generateTemplate(session.accessToken, {
        name,
        description,
        columns: selectedColumns,
      });
      toast({ title: 'Template created', variant: 'success' });
      router.push('/templates');
      router.refresh();
    } catch {
      toast({ title: 'Failed to create template', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create Template</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name (required)</Label>
            <Input id="name" name="name" required placeholder="e.g. Federal License Form" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional description" />
          </div>

          <div className="space-y-4">
            {renderCheckboxGroup('Document-level', documentEntries)}
            {renderCheckboxGroup('Per-player row', playerEntries)}
          </div>

          <div className="space-y-2">
            <Label>Column order (selected columns)</Label>
            <div className="rounded-md border p-4 space-y-2 min-h-[80px]">
              {selectedColumns.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Select placeholders above to define column order
                </p>
              ) : (
                selectedColumns.map((key, index) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted/50"
                  >
                    <span className="text-sm">{getLabelForKey(key)}</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveDown(index)}
                        disabled={index === selectedColumns.length - 1}
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Template'}
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
