import { apiClient } from '@/shared/lib/api-client';
import type { Gender } from '@hoop/shared';

export interface CategoryConfig {
  readonly id: string;
  readonly clubId: string;
  readonly name: string;
  readonly gender: Gender;
  readonly minAge: number;
  readonly maxAge: number | null;
  readonly displayOrder: number;
}

export function fetchCategories(token: string): Promise<CategoryConfig[]> {
  return apiClient<CategoryConfig[]>('/categories', { token });
}

export interface CategoryPayload {
  readonly name: string;
  readonly gender: Gender;
  readonly minAge: number;
  readonly maxAge: number | null;
  readonly displayOrder: number;
}

export function createCategory(token: string, data: CategoryPayload): Promise<CategoryConfig> {
  return apiClient<CategoryConfig>('/categories', {
    token,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCategory(
  token: string,
  id: string,
  data: Partial<CategoryPayload>,
): Promise<CategoryConfig> {
  return apiClient<CategoryConfig>(`/categories/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteCategory(token: string, id: string): Promise<void> {
  return apiClient<undefined>(`/categories/${id}`, { token, method: 'DELETE' });
}
