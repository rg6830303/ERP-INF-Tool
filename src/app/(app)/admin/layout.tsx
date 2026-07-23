import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Server-side gate: only active admins reach any /admin/* route.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
