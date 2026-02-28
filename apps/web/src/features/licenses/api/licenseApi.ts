import { apiClient } from '@/shared/lib/apiClient';
import type { CreateLicenseInput, License, LicenseWithRelations } from '@hoop/shared';

interface LicenseFilters {
  readonly status?: string;
  readonly category?: string;
}

export function fetchPlayerLicenses(token: string, playerId: string): Promise<License[]> {
  return apiClient<License[]>(`/players/${playerId}/licenses`, { token });
}

export function fetchLicenses(
  token: string,
  filters?: LicenseFilters,
): Promise<LicenseWithRelations[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.category) params.set('category', filters.category);
  const query = params.toString();
  return apiClient<LicenseWithRelations[]>(`/licenses${query ? `?${query}` : ''}`, { token });
}

export function createLicense(token: string, data: CreateLicenseInput): Promise<License> {
  return apiClient<License>('/licenses', {
    token,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function createLicensesBatch(
  token: string,
  licenses: ReadonlyArray<CreateLicenseInput>,
): Promise<{ licenses: License[] }> {
  return apiClient<{ licenses: License[] }>('/licenses/batch', {
    token,
    method: 'POST',
    body: JSON.stringify({ licenses }),
  });
}
