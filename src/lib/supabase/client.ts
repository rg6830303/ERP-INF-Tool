'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/constants';

// Browser Supabase client. Uses ONLY the public anon key; every request it
// makes is still governed by Row Level Security on the database.
//
// Config is read from window.__IE_SUPABASE__ (injected by the root layout at
// runtime) with a fallback to build-time NEXT_PUBLIC_* env vars — so the app
// works regardless of which env var name holds the anon key.
export function createClient() {
  const injected = typeof window !== 'undefined' ? window.__IE_SUPABASE__ : undefined;
  const url = injected?.url || getSupabaseUrl();
  const key = injected?.anonKey || getSupabaseAnonKey();
  return createBrowserClient(url, key);
}
