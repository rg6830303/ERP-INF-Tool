import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SESSION_START_COOKIE } from '@/lib/constants';

// Called by the client-side session guard when the 6-hour window elapses, and
// by the manual "Sign out" action. Revokes the session and clears cookies.
export async function POST() {
  const supabase = createClient();
  try {
    await supabase.rpc('log_auth_event', { p_action: 'LOGOUT' });
  } catch {
    /* ignore */
  }
  await supabase.auth.signOut();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_START_COOKIE, '', { maxAge: 0, path: '/' });
  return res;
}
