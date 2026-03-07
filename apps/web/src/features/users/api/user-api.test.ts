import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from './user-api';

const { mockApiClient } = vi.hoisted(() => ({
  mockApiClient: vi.fn(),
}));

vi.mock('@/shared/lib/api-client', () => ({
  apiClient: mockApiClient,
}));

beforeEach(() => {
  mockApiClient.mockReset();
});

describe('user-api', () => {
  it('fetches users list', async () => {
    mockApiClient.mockResolvedValueOnce([]);
    await fetchUsers('token');
    expect(mockApiClient).toHaveBeenCalledWith('/users', { token: 'token' });
  });

  it('fetches a single user', async () => {
    mockApiClient.mockResolvedValueOnce({});
    await fetchUser('token', 'user-1');
    expect(mockApiClient).toHaveBeenCalledWith('/users/user-1', { token: 'token' });
  });

  it('creates a user', async () => {
    mockApiClient.mockResolvedValueOnce({});
    await createUser('token', {
      name: 'Coach',
      email: 'coach@test.mg',
      password: 'password123',
      role: 'adminClub',
    });
    expect(mockApiClient).toHaveBeenCalledWith('/users', {
      token: 'token',
      method: 'POST',
      body: JSON.stringify({
        name: 'Coach',
        email: 'coach@test.mg',
        password: 'password123',
        role: 'adminClub',
      }),
    });
  });

  it('updates a user', async () => {
    mockApiClient.mockResolvedValueOnce({});
    await updateUser('token', 'user-1', { name: 'Head Coach' });
    expect(mockApiClient).toHaveBeenCalledWith('/users/user-1', {
      token: 'token',
      method: 'PUT',
      body: JSON.stringify({ name: 'Head Coach' }),
    });
  });

  it('deletes a user', async () => {
    mockApiClient.mockResolvedValueOnce(undefined);
    await deleteUser('token', 'user-1');
    expect(mockApiClient).toHaveBeenCalledWith('/users/user-1', {
      token: 'token',
      method: 'DELETE',
    });
  });

  it('resets a user password', async () => {
    mockApiClient.mockResolvedValueOnce(undefined);
    await resetUserPassword('token', 'user-1', 'password123');
    expect(mockApiClient).toHaveBeenCalledWith('/users/user-1/reset-password', {
      token: 'token',
      method: 'POST',
      body: JSON.stringify({ password: 'password123' }),
    });
  });
});
