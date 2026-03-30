/**
 * SWR fetcher utility
 * Wraps fetch with auth token from Clerk
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Basic fetcher without auth
export const fetcher = async (url: string) => {
  const res = await fetch(`${API_URL}${url}`);
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

// Fetcher with auth token
export const authFetcher = async (url: string, token: string | null) => {
  const res = await fetch(`${API_URL}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

// POST fetcher with auth
export const postFetcher = async (
  url: string,
  token: string | null,
  body?: Record<string, unknown>,
) => {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error('Failed to post');
  }
  return res.json();
};

// DELETE fetcher with auth
export const deleteFetcher = async (url: string, token: string | null) => {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error('Failed to delete');
  }
  return res.json();
};
