'use client';

import { useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/toast';
import { cn } from '@/shared/lib/utils';
import type { SpreadsheetPreview, CellMapping } from '@hoop/shared';
import { previewTemplate, uploadTemplate } from '../api/templateApi';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { PlaceholderDropdown } from './PlaceholderDropdown';
import { PlaceholderSidebar } from './PlaceholderSidebar';
import { TemplateMetadataForm } from './TemplateMetadataForm';

type FlowState =
  | { step: 'upload' }
  | { step: 'previewing' }
  | { step: 'editor'; preview: SpreadsheetPreview; file: File }
  | { step: 'saving' }
  | { step: 'saved' }
  | { step: 'error'; message: string };

export function TemplateUploadFlow() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [state, setState] = useState<FlowState>({ step: 'upload' });
  const [dragOver, setDragOver] = useState(false);
  const [cellMappings, setCellMappings] = useState<CellMapping[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    placement: 'below' | 'above';
  } | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!session?.accessToken) return;

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx') {
        toast({ title: 'Only .xlsx files are supported for visual editing', variant: 'destructive' });
        return;
      }

      fileRef.current = file;
      setState({ step: 'previewing' });

      try {
        const preview = await previewTemplate(session.accessToken, file);

        const initialMappings: CellMapping[] = preview.cells
          .filter((cell) => cell.placeholder !== null)
          .map((cell) => ({
            row: cell.row,
            col: cell.col,
            value: cell.placeholder as string,
          }));

        setCellMappings(initialMappings);
        setTemplateName(file.name.replace(/\.xlsx$/i, ''));
        setState({ step: 'editor', preview, file });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse file';
        setState({ step: 'error', message });
      }
    },
    [session?.accessToken, toast],
  );

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
    if (dropped) handleFile(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
    e.target.value = '';
  }

  function handleCellClick(row: number, col: number) {
    const cellElement = document.querySelector(`[data-cell="${row}:${col}"]`);
    const rect = cellElement?.getBoundingClientRect();

    if (!rect) {
      setSelectedCell({ row, col });
      setDropdownPosition({ top: 200, left: 200, placement: 'below' });
      return;
    }

    const dropdownWidth = 288;
    const dropdownHeight = 380;
    const gap = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow >= dropdownHeight + gap ? 'below' : 'above';

    const top =
      placement === 'below'
        ? rect.bottom + gap
        : rect.top - dropdownHeight - gap;

    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - dropdownWidth - 8),
    );

    setSelectedCell({ row, col });
    setDropdownPosition({ top, left, placement });
  }

  function handlePlaceholderSelect(_key: string, updatedValue: string) {
    if (!selectedCell) return;

    setCellMappings((prev) => {
      const filtered = prev.filter(
        (m) => m.row !== selectedCell.row || m.col !== selectedCell.col,
      );
      if (!updatedValue.trim()) return filtered;
      return [...filtered, { row: selectedCell.row, col: selectedCell.col, value: updatedValue }];
    });

    setSelectedCell(null);
    setDropdownPosition(null);
  }

  function handlePlaceholderRemoveFromDropdown() {
    if (!selectedCell) return;

    setCellMappings((prev) =>
      prev.filter((m) => m.row !== selectedCell.row || m.col !== selectedCell.col),
    );

    setSelectedCell(null);
    setDropdownPosition(null);
  }

  function handlePlaceholderRemoveFromSidebar(row: number, col: number) {
    setCellMappings((prev) => prev.filter((m) => m.row !== row || m.col !== col));
  }

  function handleCloseDropdown() {
    setSelectedCell(null);
    setDropdownPosition(null);
  }

  async function handleSave() {
    if (!session?.accessToken) return;
    if (state.step !== 'editor') return;

    const name = templateName.trim();
    if (!name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    setState({ step: 'saving' });

    try {
      await uploadTemplate(
        session.accessToken,
        state.file,
        name,
        templateDescription.trim(),
        cellMappings,
      );
      setState({ step: 'saved' });
      toast({ title: 'Template saved', variant: 'success' });
    } catch {
      toast({ title: 'Failed to save template', variant: 'destructive' });
      setState({ step: 'editor', preview: state.preview, file: state.file });
    }
  }

  function handleReset() {
    setState({ step: 'upload' });
    setCellMappings([]);
    setSelectedCell(null);
    setDropdownPosition(null);
    setTemplateName('');
    setTemplateDescription('');
    fileRef.current = null;
  }

  if (state.step === 'previewing') {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium">Parsing spreadsheet...</p>
          <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'saving') {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium">Saving template...</p>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'saved') {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle className="h-10 w-10 text-green-600 mb-4" />
          <p className="text-sm font-medium">Template saved successfully</p>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleReset}>Upload another</Button>
            <Button variant="outline" onClick={() => router.push('/templates')}>
              View templates
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
          <CardTitle>Upload Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">{state.message}</p>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'editor') {
    const currentValue = selectedCell
      ? cellMappings.find(
          (m) => m.row === selectedCell.row && m.col === selectedCell.col,
        )?.value ?? ''
      : '';

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Visual Template Editor</h2>
            <span className="text-sm text-muted-foreground">
              Click cells to assign placeholders
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Start over
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!templateName.trim()}>
              Save Template
            </Button>
          </div>
        </div>

        <TemplateMetadataForm
          name={templateName}
          description={templateDescription}
          onNameChange={setTemplateName}
          onDescriptionChange={setTemplateDescription}
        />

        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <SpreadsheetGrid
              preview={state.preview}
              cellMappings={cellMappings}
              selectedCell={selectedCell}
              onCellClick={handleCellClick}
            />
          </div>
          <div className="w-64 shrink-0">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Placeholders</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <PlaceholderSidebar
                  mappings={cellMappings}
                  onRemove={handlePlaceholderRemoveFromSidebar}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {selectedCell && dropdownPosition && (
          <PlaceholderDropdown
            position={dropdownPosition}
            placement={dropdownPosition.placement}
            currentValue={currentValue}
            onSelect={handlePlaceholderSelect}
            onRemove={handlePlaceholderRemoveFromDropdown}
            onClose={handleCloseDropdown}
          />
        )}
      </div>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          )}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Drop a spreadsheet or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">.xlsx files only</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
