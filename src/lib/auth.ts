import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'employee';
  is_active: boolean;
  created_at: string;
};

// Returns the authenticated user's profile, or null when signed out.
// Wrapped in React cache() so repeated calls within one server render (e.g.
// the app layout AND the page) share a single auth + DB round trip.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, is_active, created_at')
    .eq('id', user.id)
    .single();

  return (profile as Profile) ?? null;
});

// Guard for any authenticated page. Redirects to /login when signed out and
// blocks accounts an admin has deactivated.
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (!profile.is_active) redirect('/login?disabled=1');
  return profile;
}

// Guard for admin-only pages / APIs.
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== 'admin') redirect('/dashboard?forbidden=1');
  return profile;
}
