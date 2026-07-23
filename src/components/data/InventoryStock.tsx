'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/format';
import type { InventoryStatus } from '@/types/database';

// Read-only current-stock snapshot from the `inventory_status` view.
export function InventoryStock({ refreshKey }: { refreshKey: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<InventoryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory_status')
      .select('*')
      .order('item_name', { ascending: true })
      .limit(1000);
    setRows((data as InventoryStatus[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return (
      r.item_name?.toLowerCase().includes(t) ||
      r.item_code?.toLowerCase().includes(t) ||
      r.category?.toLowerCase().includes(t)
    );
  });

  const lowStock = filtered.filter((r) => Number(r.on_hand) <= Number(r.reorder_level)).length;

  return (
    <div className="card mb-8 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Current Stock on Hand</h2>
          <p className="text-xs text-slate-500">
            {loading ? 'Loading…' : `${filtered.length} items`}
            {lowStock > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" /> {lowStock} at/below reorder level
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search items…"
              className="input pl-9"
            />
          </div>
          <button onClick={load} className="btn-secondary" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-auto">
        <table className="data-table">
          <thead className="sticky top-0">
            <tr>
              <th>Code</th>
              <th>Item</th>
              <th>Category</th>
              <th>HS Code</th>
              <th className="text-right">On Hand</th>
              <th className="text-right">Reorder</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  No items yet. Add items and record stock movements.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const low = Number(r.on_hand) <= Number(r.reorder_level);
                return (
                  <tr key={r.item_id}>
                    <td className="font-medium text-slate-900">{r.item_code}</td>
                    <td className="font-medium text-slate-900">{r.item_name}</td>
                    <td>{r.category || '—'}</td>
                    <td>{r.hs_code || '—'}</td>
                    <td className="text-right">
                      <span
                        className={`badge ${
                          low ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {formatNumber(r.on_hand)}
                      </span>
                    </td>
                    <td className="text-right text-slate-500">{formatNumber(r.reorder_level)}</td>
                    <td>{r.unit}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
