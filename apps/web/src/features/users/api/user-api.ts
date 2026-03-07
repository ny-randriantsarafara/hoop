import { apiClient } from '@/shared/lib/api-client';
import type { PublicUser, Role } from '@hoop/shared';

export interface CreateUserPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role: Role;
}

export interface UpdateUserPayload {
  readonly name?: string;
  readonly email?: string;
  readonly role?: Role;
}

export function fetchUsers(token: string): Promise<PublicUser[]> {
  return apiClient<PublicUser[]>('/users', { token });
}

export function fetchUser(token: string, id: string): Promise<PublicUser> {
  return apiClient<PublicUser>(`/users/${id}`, { token });
}

export function createUser(token: string, data: CreateUserPayload): Promise<PublicUser> {
  return apiClient<PublicUser>('/users', {
    token,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateUser(
  token: string,
  id: string,
  data: UpdateUserPayload,
): Promise<PublicUser> {
  return apiClient<PublicUser>(`/users/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteUser(token: string, id: string): Promise<void> {
  return apiClient<undefined>(`/users/${id}`, { token, method: 'DELETE' });
}

export function resetUserPassword(token: string, id: string, password: string): Promise<void> {
  return apiClient<undefined>(`/users/${id}/reset-password`, {
    token,
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}
