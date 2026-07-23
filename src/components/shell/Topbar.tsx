'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, UserCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import { SessionGuard } from './SessionGuard';

export function Topbar({
  username,
  fullName,
  role,
  expiresAt,
  onMenu,
}: {
  username: string;
  fullName: string | null;
  role: 'admin' | 'employee';
  expiresAt: number;
  onMenu: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function handleSignOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    window.location.href = '/login?signedout=1';
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="btn-ghost p-2 lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <SessionGuard expiresAt={expiresAt} />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50"
          >
            <UserCircle2 className="h-6 w-6 text-brand-600" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-slate-800">
                {fullName || username}
              </span>
              <span className="block text-[11px] leading-tight text-slate-400">@{username}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 animate-fade-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-soft">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">{fullName || username}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  {role === 'admin' ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Administrator
                    </>
                  ) : (
                    'Employee'
                  )}
                </p>
              </div>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
