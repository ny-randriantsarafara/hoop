function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? '/api';
}

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, body, ...restOptions } = options;

  const headers: Record<string, string> = {
    ...Object.fromEntries(Object.entries(customHeaders ?? {})),
  };

  // Only set Content-Type for requests with a body to avoid parser errors on bodyless requests
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...restOptions,
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
