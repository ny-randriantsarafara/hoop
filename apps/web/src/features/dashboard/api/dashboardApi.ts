import { apiClient } from '@/shared/lib/apiClient';

export interface CategoryCount {
  readonly category: string;
  readonly count: number;
}

export interface DashboardStats {
  readonly totalPlayers: number;
  readonly activeLicenses: number;
  readonly expiringLicenses: number;
  readonly playersByCategory: ReadonlyArray<CategoryCount>;
}

export function fetchDashboardStats(token: string): Promise<DashboardStats> {
  return apiClient<DashboardStats>('/dashboard/stats', { token });
}
