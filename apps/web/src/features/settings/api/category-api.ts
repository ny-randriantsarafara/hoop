import { apiClient } from '@/shared/lib/api-client';

export interface CategoryConfig {
  readonly id: string;
  readonly clubId: string;
  readonly name: string;
  readonly minAge: number;
  readonly maxAge: number | null;
  readonly displayOrder: number;
}

export function fetchCategories(token: string): Promise<CategoryConfig[]> {
  return apiClient<CategoryConfig[]>('/categories', { token });
}
