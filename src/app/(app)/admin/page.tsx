import Link from 'next/link';
import {
  ShieldCheck,
  Users2,
  UserCheck,
  Activity,
  Database,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { formatDateTime } from '@/lib/format';
import type { ActivityLog } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const supabase = createClient();

  const [{ count: totalUsers }, { count: activeUsers }, { count: adminUsers }, { data: recent }] =
    await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

  const logs = (recent as ActivityLog[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Master controls for accounts, activity and the database."
        icon={ShieldCheck}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Accounts" value={totalUsers ?? 0} icon={Users2} tone="brand" />
        <StatCard label="Active Accounts" value={activeUsers ?? 0} icon={UserCheck} tone="green" />
        <StatCard label="Administrators" value={adminUsers ?? 0} icon={ShieldCheck} tone="amber" />
      </div>

      {/* Admin tools */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            href: '/admin/users',
            title: 'Employee Accounts',
            desc: 'Create, disable, reset passwords & set roles.',
            icon: Users2,
          },
          {
            href: '/admin/activity',
            title: 'Activity Log',
            desc: 'Full audit trail of every action & login.',
            icon: Activity,
          },
          {
            href: '/admin/database',
            title: 'Database Access',
            desc: 'Browse tables & run read-only queries.',
            icon: Database,
          },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="card group flex flex-col gap-3 p-5 transition hover:border-brand-300 hover:shadow-soft"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{t.desc}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          <Link href="/admin/activity" className="btn-ghost text-sm text-brand-600">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Action</th>
                <th>Table</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td className="text-slate-500">{formatDateTime(l.created_at)}</td>
                    <td className="font-medium text-slate-800">{l.username || '—'}</td>
                    <td>
                      <span className="badge bg-slate-100 text-slate-600">{l.action}</span>
                    </td>
                    <td>{l.table_name || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
