import { Env } from './Env';

// Base API URL - defaults to localhost in development
const API_BASE_URL = Env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type FetchOptions = {
  params?: Record<string, string | number | boolean | undefined>;
} & RequestInit;

/**
 * Custom fetch wrapper for API calls to NestJS backend
 */
export async function api<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies for auth
  });

  // Handle non-OK responses
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An unexpected error occurred',
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// HTTP method helpers
export const apiGet = <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
  api<T>(endpoint, { method: 'GET', params });

export const apiPost = <T>(endpoint: string, data?: unknown) =>
  api<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined });

export const apiPut = <T>(endpoint: string, data?: unknown) =>
  api<T>(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined });

export const apiPatch = <T>(endpoint: string, data?: unknown) =>
  api<T>(endpoint, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });

export const apiDelete = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'DELETE' });
