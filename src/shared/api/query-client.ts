import { QueryClient } from '@tanstack/react-query';

export const QUERY_CLIENT = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

