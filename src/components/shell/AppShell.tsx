'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell({
  username,
  fullName,
  role,
  expiresAt,
  children,
}: {
  username: string;
  fullName: string | null;
  role: 'admin' | 'employee';
  expiresAt: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} open={open} onClose={() => setOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          username={username}
          fullName={fullName}
          role={role}
          expiresAt={expiresAt}
          onMenu={() => setOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
