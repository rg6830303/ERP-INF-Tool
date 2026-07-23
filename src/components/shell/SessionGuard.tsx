'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

// Enforces the hard session lifetime on the client: shows the remaining time,
// warns near the end, and force-signs-out at zero. The authoritative check is
// still server-side (middleware + the session-start cookie's max-age); this is
// the in-tab experience so an idle tab doesn't silently stay "logged in".
export function SessionGuard({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(() => expiresAt - Date.now());

  const doSignOut = useCallback(async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      /* ignore network errors — we redirect regardless */
    }
    window.location.href = '/login?expired=1';
  }, []);

  useEffect(() => {
    const tick = () => {
      const left = expiresAt - Date.now();
      setRemaining(left);
      if (left <= 0) doSignOut();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, doSignOut]);

  if (remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const warning = remaining <= 5 * 60 * 1000; // last 5 minutes

  return (
    <span
      title="Time remaining before automatic sign-out"
      className={`badge gap-1 ${
        warning ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {warning ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {h > 0 ? `${h}h ` : ''}
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}
