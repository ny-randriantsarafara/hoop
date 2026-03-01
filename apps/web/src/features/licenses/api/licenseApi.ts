import { apiClient } from '@/shared/lib/apiClient';
import type { CreateLicenseInput, License, LicenseWithRelations } from '@hoop/shared';

export function fetchPlayerLicenses(token: string, playerId: string): Promise<License[]> {
  return apiClient<License[]>(`/players/${playerId}/licenses`, { token });
}

export function fetchLicenses(
  token: string,
  filters?: Record<string, string | undefined>,
): Promise<LicenseWithRelations[]> {
  const params = new URLSearchParams();
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
  }
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
