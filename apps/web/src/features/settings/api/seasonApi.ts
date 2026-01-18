import { apiClient } from '@/shared/lib/apiClient';
import type { Season } from '@hoop/shared';

export function fetchSeasons(token: string): Promise<Season[]> {
  return apiClient<Season[]>('/seasons', { token });
}

export function createSeason(
  token: string,
  data: { label: string; startDate: string; endDate: string; active: boolean },
): Promise<Season> {
  return apiClient<Season>('/seasons', {
    token,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateSeason(
  token: string,
  id: string,
  data: Partial<{ label: string; startDate: string; endDate: string; active: boolean }>,
): Promise<Season> {
  return apiClient<Season>(`/seasons/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteSeason(token: string, id: string): Promise<void> {
  return apiClient<undefined>(`/seasons/${id}`, { token, method: 'DELETE' });
}
