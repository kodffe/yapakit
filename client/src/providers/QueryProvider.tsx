import { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

/**
 * IndexedDB Persister using idb-keyval.
 * Stores the entire TanStack Query cache for offline resilience.
 */
const IDB_KEY = 'yapakit-query-cache';

const createIDBPersister = (): Persister => ({
  persistClient: async (client: PersistedClient) => {
    await set(IDB_KEY, client);
  },
  restoreClient: async () => {
    return await get<PersistedClient>(IDB_KEY);
  },
  removeClient: async () => {
    await del(IDB_KEY);
  },
});

const persister = createIDBPersister();

/**
 * QueryClient configured for offline-first POS workflows:
 * - Queries use 'offlineFirst': execute from cache immediately and sync background.
 * - Mutations use 'online': PAUSE when offline and auto-fire when connection returns.
 *   This prevents network errors and keeps mutations in a "paused" queue.
 * - Mutations retry up to 3 times on transient server errors.
 * - staleTime of 5 minutes avoids excessive refetches.
 * - gcTime of 24 hours keeps the cache for a full shift.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 3,
      networkMode: 'online',
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app with PersistQueryClientProvider for IndexedDB-backed cache.
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
