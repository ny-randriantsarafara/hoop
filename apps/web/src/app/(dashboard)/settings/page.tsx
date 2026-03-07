'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { RotateCcw } from 'lucide-react';
import type { Club } from '@hoop/shared';
import { Permission } from '@hoop/shared';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { RequirePermission } from '@/shared/ui/require-permission';
import { fetchMyClub } from '@/features/settings/api/settings-api';
import { SeasonManager } from '@/features/settings/ui/season-manager';
import { CategoryManager } from '@/features/settings/ui/category-manager';
import { FeatureFlagsManager } from '@/features/settings/ui/feature-flags-manager';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClub = useCallback(
    async (showLoading: boolean) => {
      if (!session?.accessToken) return;
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const data = await fetchMyClub(session.accessToken);
        setClub(data);
      } catch {
        setError('Failed to load club information');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session?.accessToken],
  );

  useEffect(() => {
    loadClub(true);
  }, [loadClub]);

  return (
    <RequirePermission permission={Permission.SettingsManage}>
      <SettingsContent
        club={club}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={() => loadClub(false)}
      />
    </RequirePermission>
  );
}

interface SettingsContentProps {
  readonly club: Club | null;
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly error: string | null;
  readonly onRefresh: () => void;
}

function SettingsContent({ club, loading, refreshing, error, onRefresh }: SettingsContentProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="mb-2 h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-2 h-3 w-20" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your club settings</p>
        </div>
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your club settings</p>
        </div>
        <p className="text-destructive">No club associated with your account</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your club settings</p>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={refreshing || loading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Club Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd>{club.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Section</dt>
              <dd>{club.section}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Address</dt>
              <dd>{club.address}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{club.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{club.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <SeasonManager />
      <CategoryManager />
      <FeatureFlagsManager />
    </div>
  );
}
