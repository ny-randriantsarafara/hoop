import { apiClient } from '@/shared/lib/apiClient';
import type { Player, License } from '@hoop/shared';

export interface PlayerFilters {
  readonly search?: string;
  readonly gender?: string;
  readonly birthDateFrom?: string;
  readonly birthDateTo?: string;
  readonly category?: string;
}

export function fetchPlayers(token: string, filters?: PlayerFilters): Promise<Player[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.gender) params.set('gender', filters.gender);
  if (filters?.birthDateFrom) params.set('birthDateFrom', filters.birthDateFrom);
  if (filters?.birthDateTo) params.set('birthDateTo', filters.birthDateTo);
  if (filters?.category) params.set('category', filters.category);
  const query = params.toString();
  return apiClient<Player[]>(`/players${query ? `?${query}` : ''}`, { token });
}

export function fetchPlayer(token: string, id: string): Promise<Player> {
  return apiClient<Player>(`/players/${id}`, { token });
}

export function fetchPlayerLicenses(token: string, id: string): Promise<License[]> {
  return apiClient<License[]>(`/players/${id}/licenses`, { token });
}

export function createPlayer(
  token: string,
  data: {
    clubId: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    address: string;
    phone?: string;
    email?: string;
  },
): Promise<Player> {
  return apiClient<Player>('/players', { token, method: 'POST', body: JSON.stringify(data) });
}

export function updatePlayer(
  token: string,
  id: string,
  data: Record<string, unknown>,
): Promise<Player> {
  return apiClient<Player>(`/players/${id}`, { token, method: 'PUT', body: JSON.stringify(data) });
}

export function deletePlayer(token: string, id: string): Promise<void> {
  return apiClient<undefined>(`/players/${id}`, { token, method: 'DELETE' });
}
