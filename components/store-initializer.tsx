'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * Mounts once in the dashboard layout.
 * Calls loadAll() which fetches from Supabase if credentials are set,
 * or silently uses mock data if not.
 */
export function StoreInitializer() {
  const loadAll = useStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return null;
}
