'use client';

import { useState } from 'react';
import { Ship, ShieldCheck, Users2, Database, Activity } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            {isAdmin ? <ShieldCheck className="h-6 w-6" /> : <Ship className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{APP_NAME}</p>
            <p className={`text-xs ${isAdmin ? 'text-slate-300' : 'text-brand-100'}`}>
              {isAdmin ? 'Administrator Console' : APP_TAGLINE}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold leading-snug">Master control of the entire tool.</h2>
            <ul className="space-y-2 text-sm text-slate-200">
              <li className="flex items-center gap-2">
                <Users2 className="h-4 w-4 text-slate-400" /> Create, edit & disable employee accounts
              </li>
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-400" /> Direct database access & queries
              </li>
              <li className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" /> Full activity & audit trail
              </li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold leading-snug">
              Manage sales, purchase, inventory, accounts &amp; incentives — in one place.
            </h2>
            <p className="text-sm text-brand-100">
              Fast data entry and powerful Buyer / Date / Item search across your whole
              import-export workflow.
            </p>
          </div>
        )}

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

        <div className="mb-6 md:hidden">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${
                isAdmin ? 'bg-slate-900' : 'bg-brand-600'
              }`}
            >
              {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <Ship className="h-5 w-5" />}
            </div>
            <span className="font-bold text-slate-900">{APP_NAME}</span>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900">
          {isAdmin ? 'Admin sign in' : 'Employee sign in'}
        </h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          {isAdmin
            ? 'Restricted to administrator accounts.'
            : 'Sign in to your account to continue.'}
        </p>

        {/* key forces a fresh form (and clears errors) when switching tabs */}
        <LoginForm key={portal} portal={portal} notice={notice} />

        <p className="mt-6 text-center text-xs text-slate-400">
          Accounts are provisioned by your administrator.
        </p>
      </div>
    </div>
  );
}
