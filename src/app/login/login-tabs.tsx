'use client';

import { useState } from 'react';
import { Ship, ShieldCheck } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { Logo } from '@/components/ui/Logo';
import { LoginForm } from './login-form';

type Portal = 'user' | 'admin';

export function LoginTabs({
  notice,
  sessionHours,
}: {
  notice?: string | null;
  sessionHours: number;
}) {
  const [portal, setPortal] = useState<Portal>('user');
  const isAdmin = portal === 'admin';

  return (
    <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2">
      {/* Brand panel — theme changes per portal */}
      <div
        className={`hidden flex-col justify-between p-10 text-white transition-colors md:flex ${
          isAdmin
            ? 'bg-gradient-to-br from-slate-900 to-slate-800'
            : 'bg-gradient-to-br from-brand-700 to-brand-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <Logo size={40} />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{APP_NAME}</p>
            <p className={`text-xs ${isAdmin ? 'text-slate-300' : 'text-brand-100'}`}>
              {isAdmin ? 'Administrator Console' : APP_TAGLINE}
            </p>
          </div>
        </div>

        {/* Logo mark, centered */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <Logo size={140} rounded={false} />
          </div>
        </div>

        <p className={`text-xs ${isAdmin ? 'text-slate-400' : 'text-brand-200'}`}>
          Sessions automatically end after {sessionHours} hours for your security.
        </p>
      </div>

      {/* Form panel */}
      <div className="p-8 sm:p-10">
        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setPortal('user')}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              !isAdmin ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Ship className="h-4 w-4" /> Employee
          </button>
          <button
            type="button"
            onClick={() => setPortal('admin')}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              isAdmin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Administrator
          </button>
        </div>

        {/* Mobile brand */}
        <div className="mb-6 flex items-center gap-2 md:hidden">
          <Logo size={36} />
          <span className="font-bold text-slate-900">{APP_NAME}</span>
        </div>

        <h1 className="text-xl font-bold text-slate-900">
          {isAdmin ? 'Admin sign in' : 'Employee sign in'}
        </h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Sign in to continue.</p>

        {/* key forces a fresh form (and clears errors) when switching tabs */}
        <LoginForm key={portal} portal={portal} notice={notice} />

        <p className="mt-6 text-center text-xs text-slate-400">
          Accounts are provisioned by your administrator.
        </p>
      </div>
    </div>
  );
}
