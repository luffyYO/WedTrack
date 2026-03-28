import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — data stays fresh
      gcTime: 10 * 60 * 1000,      // 10 min — keep in cache
      retry: 1,
      refetchOnWindowFocus: false,  // don't re-fetch just because user switched tabs
    },
  },
});
