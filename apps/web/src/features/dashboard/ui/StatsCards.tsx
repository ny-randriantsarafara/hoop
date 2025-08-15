'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { fetchDashboardStats, type DashboardStats } from '../api/dashboardApi';

const statCards = [
  { key: 'totalPlayers', label: 'Total Players', icon: Users, color: 'text-blue-600' },
  { key: 'activeLicenses', label: 'Active Licenses', icon: Award, color: 'text-emerald-600' },
] as const;

export function StatsCards() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    fetchDashboardStats(session.accessToken)
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">{error}</div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = stats ? stats[card.key] : '—';

        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
