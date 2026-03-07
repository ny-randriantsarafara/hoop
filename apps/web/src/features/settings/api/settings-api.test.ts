import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMyClub } from './settings-api';

const { mockApiClient } = vi.hoisted(() => ({
  mockApiClient: vi.fn(),
}));

vi.mock('@/shared/lib/api-client', () => ({
  apiClient: mockApiClient,
}));

beforeEach(() => {
  mockApiClient.mockReset();
});

describe('settings-api', () => {
  it('fetches club info with no-store cache policy', async () => {
    mockApiClient.mockResolvedValueOnce({});
    await fetchMyClub('token');
    expect(mockApiClient).toHaveBeenCalledWith('/clubs/me', { token: 'token', cache: 'no-store' });
  });
});
