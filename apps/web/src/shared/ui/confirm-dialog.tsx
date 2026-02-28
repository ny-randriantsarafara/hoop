'use client';

import { forwardRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: 'default' | 'destructive';
  readonly onConfirm: () => void;
  readonly loading?: boolean;
}

export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      variant = 'default',
      onConfirm,
      loading = false,
    },
    _ref,
  ) => {
    const handleOverlayClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !loading) {
          onOpenChange(false);
        }
      },
      [onOpenChange, loading],
    );

    const handleConfirm = useCallback(() => {
      if (!loading) {
        onConfirm();
      }
    }, [onConfirm, loading]);

    const handleCancel = useCallback(() => {
      if (!loading) {
        onOpenChange(false);
      }
    }, [onOpenChange, loading]);

    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !loading) {
          onOpenChange(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }, [open, onOpenChange, loading]);

    if (!open) return null;

    const content = (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <div
          className="fixed inset-0 bg-black/50"
          aria-hidden="true"
          onClick={handleOverlayClick}
        />
        <div
          className="relative z-50 mx-4 w-full max-w-lg animate-[fadeIn_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          <Card>
            <CardHeader>
              <CardTitle id="confirm-dialog-title">{title}</CardTitle>
              <CardDescription id="confirm-dialog-description">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'Loading...' : confirmLabel}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );

    return createPortal(content, document.body);
  },
);

ConfirmDialog.displayName = 'ConfirmDialog';
