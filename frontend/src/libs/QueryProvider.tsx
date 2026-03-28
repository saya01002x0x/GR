'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Env } from './Env';

// Default options for React Query
const defaultOptions = {
  queries: {
    // Stale time: how long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000,
    // Cache time: how long inactive data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000,
    // Retry failed requests up to 3 times
    retry: 3,
    // Refetch on window focus in production only
    refetchOnWindowFocus: Env.NODE_ENV === 'production',
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
  },
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient for each session to avoid sharing state between users
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions,
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
