import { apiClient } from '@/shared/lib/api-client';
import type { Club } from '@hoop/shared';

export function fetchMyClub(token: string): Promise<Club> {
  return apiClient<Club>('/clubs/me', { token });
}
