'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { FeatureKey } from '@hoop/shared';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import { apiClient } from '@/shared/lib/api-client';

interface FeatureFlag {
  key: FeatureKey;
  enabled: boolean;
}

const FEATURE_LABELS: Record<FeatureKey, { title: string; description: string }> = {
  ocr_import: {
    title: 'OCR Import',
    description: 'Allow importing player data from scanned documents using AI-powered OCR',
  },
};

export function FeatureFlagsManager() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<FeatureKey | null>(null);

  const loadFlags = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<FeatureFlag[]>('/feature-flags', {
        token: session.accessToken,
      });
      setFlags(data);
    } catch {
      setError('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const toggleFlag = async (key: FeatureKey, currentEnabled: boolean) => {
    if (!session?.accessToken) return;
    setUpdating(key);
    try {
      const updated = await apiClient<FeatureFlag>('/feature-flags', {
        method: 'PUT',
        token: session.accessToken,
        body: JSON.stringify({ key, enabled: !currentEnabled }),
      });
      setFlags((prev) => prev.map((f) => (f.key === key ? updated : f)));
      toast({
        title: 'Feature updated',
        description: `${FEATURE_LABELS[key]?.title ?? key} has been ${updated.enabled ? 'enabled' : 'disabled'}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update feature flag',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>Enable or disable features for your club</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flags.map((flag) => {
            const label = FEATURE_LABELS[flag.key];
            return (
              <div
                key={flag.key}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="font-medium">{label?.title ?? flag.key}</div>
                  {label?.description && (
                    <p className="text-sm text-muted-foreground">{label.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={flag.enabled}
                  disabled={updating === flag.key}
                  onClick={() => toggleFlag(flag.key, flag.enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    flag.enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      flag.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
          {flags.length === 0 && (
            <p className="text-sm text-muted-foreground">No feature flags available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
