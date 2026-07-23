'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Search, RefreshCw, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDateTime } from '@/lib/format';
import type { ActivityLog } from '@/types/database';

const ACTIONS = ['LOGIN', 'LOGOUT', 'INSERT', 'UPDATE', 'DELETE'];

export default function ActivityPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState('');
  const [action, setAction] = useState('');
  const [table, setTable] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500);
    if (user.trim()) q = q.ilike('username', `%${user.trim()}%`);
    if (action) q = q.eq('action', action);
    if (table.trim()) q = q.ilike('table_name', `%${table.trim()}%`);
    if (dateFrom) q = q.gte('created_at', dateFrom);
    if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59`);
    const { data } = await q;
    setRows((data as ActivityLog[]) ?? []);
    setLoading(false);
  }, [supabase, user, action, table, dateFrom, dateTo]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Activity Log"
        subtitle="Complete audit trail of every login and data change."
        icon={Activity}
        action={
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="card mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="label">User</label>
          <input className="input" value={user} onChange={(e) => setUser(e.target.value)} placeholder="username" />
        </div>
        <div>
          <label className="label">Action</label>
          <select className="input" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Table</label>
          <input className="input" value={table} onChange={(e) => setTable(e.target.value)} placeholder="sales…" />
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="flex items-end lg:col-span-6">
          <button onClick={load} className="btn-primary">
            <Search className="h-4 w-4" /> Apply filters
          </button>
        </div>
      </div>

      <p className="mb-2 px-1 text-sm text-slate-500">
        {loading ? 'Loading…' : `${rows.length} events`}
      </p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Action</th>
              <th>Table</th>
              <th>Record</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No activity matches the filters.
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-slate-500">{formatDateTime(l.created_at)}</td>
                  <td className="font-medium text-slate-800">{l.username || '—'}</td>
                  <td>
                    <span className="badge bg-slate-100 text-slate-600">{l.action}</span>
                  </td>
                  <td>{l.table_name || '—'}</td>
                  <td className="max-w-[140px] truncate text-slate-500" title={l.record_id ?? ''}>
                    {l.record_id || '—'}
                  </td>
                  <td className="max-w-[220px] truncate text-slate-600">
                    {(l.details as any)?.summary ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
