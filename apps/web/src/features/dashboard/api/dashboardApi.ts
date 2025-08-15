import { apiClient } from '@/shared/lib/apiClient';

export interface DashboardStats {
  readonly totalPlayers: number;
  readonly activeLicenses: number;
}

export function fetchDashboardStats(token: string): Promise<DashboardStats> {
  return apiClient<DashboardStats>('/dashboard/stats', { token });
}
