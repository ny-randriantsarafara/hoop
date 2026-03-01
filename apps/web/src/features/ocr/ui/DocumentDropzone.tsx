'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isValidFile(file: File): string | null {
  const supportedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]);
  if (!supportedTypes.has(file.type)) {
    return 'Unsupported file type. Use JPEG, PNG, WebP, or PDF.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum size is 5 MB.';
  }
  return null;
}

interface DocumentDropzoneProps {
  readonly onFileSelected: (file: File) => void;
  readonly disabled?: boolean;
  readonly error?: string | null;
}

export function DocumentDropzone({ onFileSelected, disabled, error }: DocumentDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const fileError = isValidFile(file);
      if (fileError) {
        setValidationError(fileError);
        return;
      }
      setValidationError(null);
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
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
    if (disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
    e.target.value = '';
  }

  function handleZoneClick() {
    if (!disabled) fileInputRef.current?.click();
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedFile(null);
    setValidationError(null);
  }

  const displayError = validationError ?? error;

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleZoneClick}
        onKeyDown={(e) => e.key === 'Enter' && handleZoneClick()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer',
          dragOver
            ? 'border-primary bg-primary/5'
            : displayError
              ? 'border-destructive/50'
              : 'border-muted-foreground/30 hover:border-muted-foreground/50',
        )}
      >
        {selectedFile ? (
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-sm">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Drop a document or click to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WebP, or PDF (max 5 MB)
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="hidden"
      />

      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}
    </div>
  );
}
