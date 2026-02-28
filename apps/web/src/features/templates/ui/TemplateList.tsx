'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Download, Trash2 } from 'lucide-react';
import type { Template } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { TableSkeleton } from '@/shared/ui/skeleton';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { useToast } from '@/shared/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/table';
import { fetchTemplates, deleteTemplate, downloadTemplate } from '../api/templateApi';

export function TemplateList() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTemplates(session.accessToken);
      setTemplates(data);
    } catch {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function handleDeleteConfirm() {
    if (!session?.accessToken || !deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteTemplate(session.accessToken, deleteId);
      toast({ title: 'Template deleted', variant: 'success' });
      setDeleteId(null);
      loadTemplates();
    } catch {
      toast({ title: 'Failed to delete template', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDownload(template: Template) {
    if (!session?.accessToken) return;
    setDownloadId(template.id);
    try {
      const filename = `${template.name}.${template.format}`;
      await downloadTemplate(session.accessToken, template.id, filename);
      toast({ title: 'Template downloaded', variant: 'success' });
    } catch {
      toast({ title: 'Failed to download template', variant: 'destructive' });
    } finally {
      setDownloadId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
      )}

      <div className="hidden md:block rounded-lg border">
        {loading ? (
          <TableSkeleton columns={5} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Placeholders</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No templates yet. Upload a template or create one with the builder.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{template.format.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{template.placeholders.length}</TableCell>
                    <TableCell>
                      {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(template)}
                          disabled={downloadId !== null}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(template.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading...</p>
        ) : (
          <>
            {templates.map((template) => (
              <div key={template.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{template.name}</span>
                  <Badge variant="secondary">{template.format.toUpperCase()}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{template.placeholders.length} placeholders</span>
                  <span>{new Date(template.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(template)}
                    disabled={downloadId !== null}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(template.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No templates yet. Upload a template or create one with the builder.
              </p>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
