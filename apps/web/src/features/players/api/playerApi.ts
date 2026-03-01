import { apiClient } from '@/shared/lib/apiClient';
import type { Player, License } from '@hoop/shared';

export function fetchPlayers(
  token: string,
  filters?: Record<string, string | undefined>,
): Promise<Player[]> {
  const params = new URLSearchParams();
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
  }
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
