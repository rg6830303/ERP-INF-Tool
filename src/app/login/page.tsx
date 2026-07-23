import { Ship } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, SESSION_MAX_HOURS } from '@/lib/constants';
import { LoginForm } from './login-form';

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

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-900 p-10 text-white md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Ship className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{APP_NAME}</p>
              <p className="text-xs text-brand-100">{APP_TAGLINE}</p>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold leading-snug">
              Manage sales, purchase, inventory, accounts &amp; incentives — in one place.
            </h2>
            <p className="text-sm text-brand-100">
              Secure in-house tool for the entire import/export workflow. Fast data
              entry, powerful search and complete audit trails.
            </p>
          </div>
          <p className="text-xs text-brand-200">
            Sessions automatically end after {SESSION_MAX_HOURS} hours for your security.
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          <div className="mb-6 md:hidden">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Ship className="h-5 w-5" />
              </div>
              <span className="font-bold text-slate-900">{APP_NAME}</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Sign in to your account to continue.
          </p>

          <LoginForm notice={notice} />

          <p className="mt-6 text-center text-xs text-slate-400">
            Accounts are provisioned by your administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
