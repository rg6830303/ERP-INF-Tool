'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  SESSION_MAX_HOURS,
  SESSION_START_COOKIE,
  usernameToEmail,
} from '@/lib/constants';

const credentials = z.object({
  username: z.string().trim().min(1, 'Username is required').max(64),
  password: z.string().min(1, 'Password is required').max(200),
  portal: z.enum(['user', 'admin']).default('user'),
});

export type LoginState = { error: string | null };

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentials.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    portal: formData.get('portal') ?? 'user',
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const { portal } = parsed.data;
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(parsed.data.username),
    password: parsed.data.password,
  });

  if (error || !data.user) {
    // Deliberately generic — never reveal whether the username exists.
    return { error: 'Invalid username or password.' };
  }

  // Block accounts an admin has deactivated, and enforce the admin portal.
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active, role')
    .eq('id', data.user.id)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { error: 'This account has been disabled. Contact your administrator.' };
  }

  if (portal === 'admin' && profile.role !== 'admin') {
    await supabase.auth.signOut();
    return { error: 'This is not an administrator account. Use the Employee tab.' };
  }

  // Start the hard 6-hour session window.
  cookies().set(SESSION_START_COOKIE, new Date().toISOString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_HOURS * 60 * 60,
  });

  // Best-effort audit trail (never blocks login).
  try {
    await supabase.rpc('log_auth_event', { p_action: 'LOGIN' });
  } catch {
    /* ignore */
  }

  redirect(portal === 'admin' ? '/admin' : '/dashboard');
}

export async function signOut() {
  const supabase = createClient();
  try {
    await supabase.rpc('log_auth_event', { p_action: 'LOGOUT' });
  } catch {
    /* ignore */
  }
  await supabase.auth.signOut();
  cookies().delete(SESSION_START_COOKIE);
  redirect('/login');
}
