import { NextResponse } from 'next/server';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// Public diagnostics — reports whether Supabase config is wired up and reachable.
// Returns only booleans, never secret values. Handy for verifying a Vercel
// deployment: GET /api/health
export async function GET() {
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  const hasService = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  );

  let authReachable = false;
  let authStatus: number | null = null;
  if (url && anon) {
    try {
      const res = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: anon },
        cache: 'no-store',
      });
      authStatus = res.status;
      authReachable = res.ok;
    } catch {
      authReachable = false;
    }
  }

  const ok = Boolean(url) && Boolean(anon) && hasService && authReachable;

  return NextResponse.json(
    {
      ok,
      config: {
        supabaseUrl: Boolean(url),
        anonKey: Boolean(anon),
        serviceRoleKey: hasService,
      },
      auth: { reachable: authReachable, status: authStatus },
      hint: ok
        ? 'All good — Supabase is configured and reachable.'
        : 'Check the false values above. The browser needs the anon key; set NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) and SUPABASE_SERVICE_ROLE_KEY in your environment.',
    },
    { status: ok ? 200 : 503 },
  );
}
