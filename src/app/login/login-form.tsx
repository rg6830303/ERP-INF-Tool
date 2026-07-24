'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Eye, EyeOff, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { signIn, type LoginState } from './actions';

const initialState: LoginState = { error: null };

function SubmitButton({ portal }: { portal: 'user' | 'admin' }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`btn w-full text-white ${
        portal === 'admin'
          ? 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-500'
          : 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500'
      }`}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
        </>
      ) : portal === 'admin' ? (
        <>
          <ShieldCheck className="h-4 w-4" /> Sign in to Admin
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" /> Sign in
        </>
      )}
    </button>
  );
}

export function LoginForm({
  portal,
  notice,
}: {
  portal: 'user' | 'admin';
  notice?: string | null;
}) {
  const [state, formAction] = useFormState(signIn, initialState);
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="portal" value={portal} />

      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {notice}
        </div>
      )}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor={`username-${portal}`} className="label">
          Username
        </label>
        <input
          id={`username-${portal}`}
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          className="input"
          placeholder="Enter username"
        />
      </div>

      <div>
        <label htmlFor={`password-${portal}`} className="label">
          Password
        </label>
        <div className="relative">
          <input
            id={`password-${portal}`}
            name="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="input pr-10"
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <SubmitButton portal={portal} />
    </form>
  );
}
