'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import { cn } from '@/shared/lib/utils';
import { getFormString } from '@/shared/lib/formUtils';
import { uploadTemplate } from '../api/templateApi';

const ACCEPTED_TYPES = '.xlsx,.docx';

export function TemplateUploadForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && isValidFile(dropped)) {
      setFile(dropped);
    } else {
      toast({ title: 'Invalid file. Use .xlsx or .docx', variant: 'destructive' });
    }
  }

  function isValidFile(f: File): boolean {
    const ext = f.name.split('.').pop()?.toLowerCase();
    return ext === 'xlsx' || ext === 'docx';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected && isValidFile(selected)) {
      setFile(selected);
    } else if (selected) {
      toast({ title: 'Invalid file. Use .xlsx or .docx', variant: 'destructive' });
    }
    e.target.value = '';
  }

  function handleZoneClick() {
    fileInputRef.current?.click();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.accessToken || !file) return;

    const formData = new FormData(e.currentTarget);
    const name = getFormString(formData, 'name').trim();
    const description = getFormString(formData, 'description').trim();

    if (!name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await uploadTemplate(session.accessToken, file, name, description);
      toast({ title: 'Template uploaded', variant: 'success' });
      router.push('/templates');
      router.refresh();
    } catch {
      toast({ title: 'Failed to upload template', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Template</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Template file</Label>
            <div
              role="button"
              tabIndex={0}
              onClick={handleZoneClick}
              onKeyDown={(e) => e.key === 'Enter' && handleZoneClick()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              )}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : 'Drag and drop or click to select .xlsx or .docx'}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (required)</Label>
            <Input id="name" name="name" required placeholder="e.g. Federal License Form" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Optional description"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload'}
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
