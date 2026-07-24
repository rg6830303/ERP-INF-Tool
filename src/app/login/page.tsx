import { SESSION_MAX_HOURS } from '@/lib/constants';
import { LoginTabs } from './login-tabs';

export const dynamic = 'force-dynamic';

function noticeFor(params: Record<string, string | string[] | undefined>): string | null {
  if (params.expired) return 'Your 6-hour session expired. Please sign in again.';
  if (params.disabled) return 'This account has been disabled. Contact your administrator.';
  if (params.signedout) return 'You have been signed out.';
  return null;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const notice = noticeFor(searchParams);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-950 px-4 py-10">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />

      <LoginTabs notice={notice} sessionHours={SESSION_MAX_HOURS} />
    </main>
  );
}
