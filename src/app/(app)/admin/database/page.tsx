'use client';

import { useMemo, useState } from 'react';
import { Database, Play, Loader2, Table2, Terminal, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';

const BROWSE_TABLES = [
  'profiles',
  'buyers',
  'suppliers',
  'items',
  'sales',
  'sale_items',
  'purchases',
  'purchase_items',
  'stock_movements',
  'account_entries',
  'incentives',
  'activity_logs',
  'inventory_status',
];

function DynamicTable({ rows }: { rows: Record<string, any>[] }) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-slate-400">No rows returned.</p>;
  }
  const cols = Object.keys(rows[0]);
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => {
                const v = r[c];
                const text =
                  v === null || v === undefined
                    ? '—'
                    : typeof v === 'object'
                      ? JSON.stringify(v)
                      : String(v);
                return (
                  <td key={c} className="max-w-[240px] truncate" title={text}>
                    {text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DatabasePage() {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<'browse' | 'sql'>('browse');

  // Browse
  const [table, setTable] = useState('sales');
  const [browseRows, setBrowseRows] = useState<Record<string, any>[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  async function browse() {
    setBrowseLoading(true);
    setBrowseError(null);
    const { data, error } = await supabase.from(table).select('*').limit(100);
    if (error) setBrowseError(error.message);
    setBrowseRows((data as Record<string, any>[]) ?? []);
    setBrowseLoading(false);
  }

  // SQL console
  const [sql, setSql] = useState('select invoice_no, sale_date, total_amount, status\nfrom sales\norder by sale_date desc\nlimit 20;');
  const [sqlRows, setSqlRows] = useState<Record<string, any>[]>([]);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [ran, setRan] = useState(false);

  async function runSql() {
    setSqlLoading(true);
    setSqlError(null);
    setRan(true);
    const { data, error } = await supabase.rpc('admin_execute_sql', { query: sql });
    if (error) setSqlError(error.message);
    setSqlRows((data as Record<string, any>[]) ?? []);
    setSqlLoading(false);
  }

  return (
    <div>
      <PageHeader
        title="Database Access"
        subtitle="Direct visibility into every table with a read-only SQL console."
        icon={Database}
      />

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab('browse')}
          className={tab === 'browse' ? 'btn-primary' : 'btn-secondary'}
        >
          <Table2 className="h-4 w-4" /> Table Browser
        </button>
        <button
          onClick={() => setTab('sql')}
          className={tab === 'sql' ? 'btn-primary' : 'btn-secondary'}
        >
          <Terminal className="h-4 w-4" /> SQL Console
        </button>
      </div>

      {tab === 'browse' ? (
        <div>
          <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[220px]">
              <label className="label">Table / View</label>
              <select className="input" value={table} onChange={(e) => setTable(e.target.value)}>
                {BROWSE_TABLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={browse} className="btn-primary" disabled={browseLoading}>
              {browseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Load rows
            </button>
            <span className="text-sm text-slate-400">Showing up to 100 rows.</span>
          </div>

          {browseError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {browseError}
            </div>
          )}
          <DynamicTable rows={browseRows} />
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Read-only console — only <code>SELECT</code> / <code>WITH</code> queries run (max
              500 rows). For writes or DDL, use the Supabase SQL editor.
            </span>
          </div>

          <div className="card p-4">
            <label className="label">SQL Query</label>
            <textarea
              className="input min-h-[140px] font-mono text-sm"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
            />
            <div className="mt-3 flex justify-end">
              <button onClick={runSql} className="btn-primary" disabled={sqlLoading}>
                {sqlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run query
              </button>
            </div>
          </div>

          {sqlError && (
            <div className="my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {sqlError}
            </div>
          )}

          {ran && !sqlError && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-500">{sqlRows.length} rows</p>
              <DynamicTable rows={sqlRows} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
