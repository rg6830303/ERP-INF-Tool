// Centralised app configuration derived from environment variables.

export const AUTH_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN?.trim() || 'infinityexports.local';

export const SESSION_MAX_HOURS = Number(
  process.env.NEXT_PUBLIC_SESSION_MAX_HOURS ?? '6',
);

export const SESSION_MAX_MS = SESSION_MAX_HOURS * 60 * 60 * 1000;

// httpOnly cookie that records when the current session began. Its max-age is
// the hard session lifetime, so its absence => the 6-hour window has elapsed.
export const SESSION_START_COOKIE = 'ie_session_start';

export const APP_NAME = 'Infinity Exports';
export const APP_TAGLINE = 'Import / Export ERP';

// Map a bare username to the synthetic email used by Supabase Auth.
export function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  return `${clean}@${AUTH_EMAIL_DOMAIN}`;
}

// Recover the username from a synthetic email (for display).
export function emailToUsername(email: string | null | undefined): string {
  if (!email) return '';
  const at = email.indexOf('@');
  return at === -1 ? email : email.slice(0, at);
}
