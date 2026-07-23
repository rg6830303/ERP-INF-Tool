import { cookies } from 'next/headers';
import { requireProfile } from '@/lib/auth';
import { AppShell } from '@/components/shell/AppShell';
import { SESSION_START_COOKIE, SESSION_MAX_MS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  const startedRaw = cookies().get(SESSION_START_COOKIE)?.value;
  const startedAt = startedRaw ? new Date(startedRaw).getTime() : Date.now();
  const expiresAt = startedAt + SESSION_MAX_MS;

  return (
    <AppShell
      username={profile.username}
      fullName={profile.full_name}
      role={profile.role}
      expiresAt={expiresAt}
    >
      {children}
    </AppShell>
  );
}
