'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';

const TOAST_LIMIT = 3;
const TOAST_DURATION = 4000;

interface ToastData {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly variant: 'default' | 'success' | 'destructive';
  readonly createdAt: number;
}

interface ToastContextValue {
  readonly toasts: ReadonlyArray<ToastData>;
  readonly toast: (props: {
    readonly title: string;
    readonly description?: string;
    readonly variant?: 'default' | 'success' | 'destructive';
  }) => void;
  readonly dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { readonly children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ReadonlyArray<ToastData>>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant = 'default',
    }: {
      readonly title: string;
      readonly description?: string;
      readonly variant?: 'default' | 'success' | 'destructive';
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const data: ToastData = { id, title, description, variant, createdAt: Date.now() };

      setToasts((prev) => {
        const next = [...prev, data].slice(-TOAST_LIMIT);
        next.forEach((t) => {
          if (!timeoutsRef.current.has(t.id)) {
            const timeout = setTimeout(() => dismiss(t.id), TOAST_DURATION);
            timeoutsRef.current.set(t.id, timeout);
          }
        });
        return next;
      });
    },
    [dismiss],
  );

  useEffect(() => () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current.clear();
  }, []);

  const value: ToastContextValue = { toasts, toast, dismiss };
  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast(): { readonly toast: ToastContextValue['toast'] } {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return { toast: ctx.toast };
}

const variantStyles = {
  default: 'border bg-background text-foreground',
  success: 'border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400',
  destructive:
    'border border-destructive/30 bg-destructive/10 text-destructive',
};

function ToastItem({
  data,
}: {
  readonly data: ToastData;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border p-4 shadow-lg animate-[toastSlideIn_0.3s_ease-out]',
        variantStyles[data.variant],
      )}
      aria-live="polite"
    >
      <p className="font-semibold">{data.title}</p>
      {data.description && (
        <p className="mt-1 text-sm opacity-90">{data.description}</p>
      )}
    </div>
  );
}

export function Toaster() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;

  const { toasts } = ctx;

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((data) => (
        <ToastItem key={data.id} data={data} />
      ))}
    </div>,
    document.body,
  );
}
