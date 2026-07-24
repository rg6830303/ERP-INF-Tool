'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, RefreshCw, Loader2, Inbox, Filter, X, Eye, Pencil, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Drawer } from '@/components/ui/Drawer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  LineItemsEditor,
  emptyLine,
  type LineRow,
  type ItemOption,
} from './LineItemsEditor';
import type { FieldDef, Option, ColumnDef } from './types';

type Row = Record<string, any>;

export type DocConfig = {
  table: 'sales' | 'purchases';
  lineTable: 'sale_items' | 'purchase_items';
  lineFk: 'sale_id' | 'purchase_id';
  title: string;
  singular: string;
  subtitle?: string;
  docNoField: string;
  docNoLabel: string;
  dateField: string;
  dateLabel: string;
  partyField: string; // buyer_id | supplier_id
  partyTable: 'buyers' | 'suppliers';
  partyCodeKey: string; // buyer_code | supplier_code
  partyLabel: string;
  statusOptions: Option[];
  statusDefault: string;
  extraHeaderFields: FieldDef[];
  columns: ColumnDef[];
  lineHasHs: boolean;
};

export function DocumentModule({ config, icon }: { config: DocConfig; icon?: LucideIcon }) {
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [parties, setParties] = useState<Option[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);

  // Filters — the three from the spec: party (buyer) wise, date wise, item wise
  const [search, setSearch] = useState('');
  const [partyId, setPartyId] = useState('');
  const [itemId, setItemId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // New/edit-document drawer
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [header, setHeader] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Detail drawer
  const [detail, setDetail] = useState<Row | null>(null);
  const [detailLines, setDetailLines] = useState<Row[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const partySelect = `${config.partyTable}(id, name, ${config.partyCodeKey}, country)`;

  // ---- Load reference data --------------------------------------------------
  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: it }] = await Promise.all([
        supabase
          .from(config.partyTable)
          .select(`id, name, ${config.partyCodeKey}`)
          .eq('is_active', true)
          .order('name')
          .limit(1000),
        supabase
          .from('items')
          .select('id, item_code, name, unit, hs_code, default_unit_price')
          .eq('is_active', true)
          .order('name')
          .limit(1000),
      ]);
      setParties(
        (p ?? []).map((r: Row) => ({
          value: r.id,
          label: `${r[config.partyCodeKey]} — ${r.name}`,
        })),
      );
      setItems((it as ItemOption[]) ?? []);
    })();
  }, [supabase, config.partyTable, config.partyCodeKey]);

  // ---- Fetch documents ------------------------------------------------------
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    const selectStr = itemId
      ? `*, ${partySelect}, ${config.lineTable}!inner(item_id)`
      : `*, ${partySelect}`;

    let query = supabase.from(config.table).select(selectStr).limit(500);

    const term = search.trim();
    if (term) {
      const safe = term.replace(/[%,()]/g, ' ');
      query = query.or(`${config.docNoField}.ilike.%${safe}%`);
    }
    if (partyId) query = query.eq(config.partyField, partyId);
    if (status) query = query.eq('status', status);
    if (itemId) query = query.eq(`${config.lineTable}.item_id`, itemId);
    if (dateFrom) query = query.gte(config.dateField, dateFrom);
    if (dateTo) query = query.lte(config.dateField, dateTo);

    query = query.order(config.dateField, { ascending: false });

    const { data, error } = await query;
    if (error) setError(error.message);

    // Dedupe (inner join on lines can repeat header rows)
    const seen = new Set<string>();
    const deduped = ((data as Row[]) ?? []).filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    setRows(deduped);
    setLoading(false);
  }, [supabase, config, search, partyId, status, itemId, dateFrom, dateTo, partySelect]);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFilters() {
    setSearch('');
    setPartyId('');
    setItemId('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setTimeout(fetchRows, 0);
  }

  const hasFilters =
    !!search || !!partyId || !!itemId || !!status || !!dateFrom || !!dateTo;

  // ---- New / edit document --------------------------------------------------
  function openNew() {
    const init: Record<string, string> = {
      [config.docNoField]: '',
      [config.partyField]: '',
      [config.dateField]: new Date().toISOString().slice(0, 10),
      currency: 'USD',
      exchange_rate: '1',
      status: config.statusDefault,
    };
    for (const f of config.extraHeaderFields) init[f.name] = f.default != null ? String(f.default) : '';
    setHeader(init);
    setLines([emptyLine()]);
    setEditingId(null);
    setFormError(null);
    setOpen(true);
  }

  async function openEdit(row: Row) {
    const init: Record<string, string> = {
      [config.docNoField]: row[config.docNoField] ?? '',
      [config.partyField]: row[config.partyField] ?? '',
      [config.dateField]: row[config.dateField] ?? '',
      currency: row.currency ?? 'USD',
      exchange_rate: String(row.exchange_rate ?? '1'),
      status: row.status ?? config.statusDefault,
    };
    for (const f of config.extraHeaderFields) {
      const v = row[f.name];
      init[f.name] = v === null || v === undefined ? '' : String(v);
    }
    setHeader(init);
    setEditingId(String(row.id));
    setFormError(null);
    setOpen(true);

    // Load existing line items into the editor.
    const { data } = await supabase
      .from(config.lineTable)
      .select('*')
      .eq(config.lineFk, row.id)
      .order('line_no');
    const existing: LineRow[] = (data as Row[] | null)?.map((l) => ({
      item_id: l.item_id ?? '',
      description: l.description ?? '',
      hs_code: l.hs_code ?? '',
      quantity: String(l.quantity ?? '0'),
      unit: l.unit ?? 'PCS',
      unit_price: String(l.unit_price ?? '0'),
    })) ?? [];
    setLines(existing.length ? existing : [emptyLine()]);
  }

  async function remove(row: Row) {
    if (!confirm(`Delete ${config.docNoLabel} ${row[config.docNoField]}? This cannot be undone.`))
      return;
    setDeletingId(String(row.id));
    // Line items cascade-delete via the foreign key.
    const { error } = await supabase.from(config.table).delete().eq('id', row.id);
    setDeletingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setToast(`${config.singular} deleted.`);
    setTimeout(() => setToast(null), 3000);
    fetchRows();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!header[config.docNoField]?.trim()) {
      setFormError(`${config.docNoLabel} is required.`);
      return;
    }
    if (!header[config.partyField]) {
      setFormError(`${config.partyLabel} is required.`);
      return;
    }
    const validLines = lines.filter(
      (l) => (l.item_id || l.description.trim()) && parseFloat(l.quantity) > 0,
    );
    if (validLines.length === 0) {
      setFormError('Add at least one line item with a quantity.');
      return;
    }

    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();

    // Header payload
    const headerPayload: Record<string, unknown> = {
      [config.docNoField]: header[config.docNoField].trim(),
      [config.partyField]: header[config.partyField],
      [config.dateField]: header[config.dateField] || null,
      currency: header.currency || 'USD',
      exchange_rate: Number(header.exchange_rate) || 1,
      status: header.status || config.statusDefault,
    };
    for (const f of config.extraHeaderFields) {
      const v = header[f.name];
      headerPayload[f.name] = v === '' || v == null ? null : f.type === 'number' ? Number(v) : v;
    }

    // Resolve the document id (existing on edit, new on insert).
    let docId = editingId;
    if (editingId) {
      const { error: upErr } = await supabase
        .from(config.table)
        .update(headerPayload)
        .eq('id', editingId);
      if (upErr) {
        setSaving(false);
        setFormError(upErr.message);
        return;
      }
      // Replace the line items wholesale.
      await supabase.from(config.lineTable).delete().eq(config.lineFk, editingId);
    } else {
      headerPayload.created_by = userRes.user?.id ?? null;
      const { data: inserted, error: headErr } = await supabase
        .from(config.table)
        .insert(headerPayload)
        .select('id')
        .single();
      if (headErr || !inserted) {
        setSaving(false);
        setFormError(headErr?.message ?? 'Failed to save document.');
        return;
      }
      docId = inserted.id;
    }

    const linePayload = validLines.map((l, i) => ({
      [config.lineFk]: docId,
      item_id: l.item_id || null,
      description: l.description || null,
      ...(config.lineHasHs ? { hs_code: l.hs_code || null } : {}),
      quantity: Number(l.quantity) || 0,
      unit: l.unit || 'PCS',
      unit_price: Number(l.unit_price) || 0,
      line_no: i + 1,
    }));

    const { error: lineErr } = await supabase.from(config.lineTable).insert(linePayload);
    if (lineErr) {
      // On a fresh insert, roll back the orphan header (best effort).
      if (!editingId && docId) await supabase.from(config.table).delete().eq('id', docId);
      setSaving(false);
      setFormError(`Failed to save line items: ${lineErr.message}`);
      return;
    }

    setSaving(false);
    setOpen(false);
    setToast(`${config.singular} ${editingId ? 'updated' : 'saved'} successfully.`);
    setTimeout(() => setToast(null), 3000);
    fetchRows();
  }

  // ---- Detail ---------------------------------------------------------------
  async function openDetail(row: Row) {
    setDetail(row);
    setDetailLoading(true);
    const { data } = await supabase
      .from(config.lineTable)
      .select('*, items(item_code, name)')
      .eq(config.lineFk, row.id)
      .order('line_no');
    setDetailLines((data as Row[]) ?? []);
    setDetailLoading(false);
  }

  const totalValue = rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);

  return (
    <div>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        icon={icon}
        action={
          <>
            <button onClick={fetchRows} className="btn-secondary" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> New {config.singular}
            </button>
          </>
        }
      />

      {toast && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {toast}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Filter className="h-4 w-4 text-brand-600" /> Search &amp; Filters
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="btn-ghost text-xs">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="label">Search {config.docNoLabel}</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchRows()}
                className="input pl-9"
                placeholder={`e.g. ${config.docNoLabel} number`}
              />
            </div>
          </div>

          {/* Party (Buyer) wise */}
          <div>
            <label className="label">{config.partyLabel} wise</label>
            <select className="input" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
              <option value="">All {config.partyLabel.toLowerCase()}s</option>
              {parties.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Item wise */}
          <div>
            <label className="label">Item wise</label>
            <select className="input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">All items</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.item_code} — {it.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {config.statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date wise */}
          <div>
            <label className="label">Date from</label>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Date to</label>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button onClick={fetchRows} className="btn-primary w-full">
              <Search className="h-4 w-4" /> Apply
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${rows.length} record${rows.length === 1 ? '' : 's'}`}
        </p>
        {!loading && rows.length > 0 && (
          <p className="text-sm text-slate-500">
            Total value:{' '}
            <span className="font-semibold text-slate-800">{formatCurrency(totalValue)}</span>
          </p>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {config.columns.map((c) => (
                <th key={c.key} className={c.className}>
                  {c.label}
                </th>
              ))}
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={config.columns.length + 1} className="py-12 text-center text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 1} className="py-14 text-center text-slate-400">
                  <Inbox className="mx-auto mb-2 h-8 w-8" />
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {config.columns.map((c) => (
                    <td key={c.key} className={c.className}>
                      {c.render ? c.render(row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openDetail(row)} className="btn-ghost p-1.5" title="View details">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(row)} className="btn-ghost p-1.5" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(row)}
                        className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                        title="Delete"
                        disabled={deletingId === String(row.id)}
                      >
                        {deletingId === String(row.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New / edit document drawer */}
      <Drawer
        open={open}
        title={editingId ? `Edit ${config.singular}` : `New ${config.singular}`}
        subtitle={
          editingId
            ? `Update this ${config.singular.toLowerCase()} and its line items`
            : `Create a ${config.singular.toLowerCase()} with line items`
        }
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">
                {config.docNoLabel} <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={header[config.docNoField] ?? ''}
                onChange={(e) => setHeader((p) => ({ ...p, [config.docNoField]: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">
                {config.partyLabel} <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={header[config.partyField] ?? ''}
                onChange={(e) => setHeader((p) => ({ ...p, [config.partyField]: e.target.value }))}
              >
                <option value="">Select…</option>
                {parties.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{config.dateLabel}</label>
              <input
                type="date"
                className="input"
                value={header[config.dateField] ?? ''}
                onChange={(e) => setHeader((p) => ({ ...p, [config.dateField]: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={header.status ?? config.statusDefault}
                onChange={(e) => setHeader((p) => ({ ...p, status: e.target.value }))}
              >
                {config.statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Currency</label>
              <input
                className="input"
                value={header.currency ?? 'USD'}
                onChange={(e) => setHeader((p) => ({ ...p, currency: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Exchange Rate</label>
              <input
                type="number"
                step="0.0001"
                className="input"
                value={header.exchange_rate ?? '1'}
                onChange={(e) => setHeader((p) => ({ ...p, exchange_rate: e.target.value }))}
              />
            </div>

            {config.extraHeaderFields.map((f) => (
              <div key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="label">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    className="input min-h-[70px]"
                    value={header[f.name] ?? ''}
                    onChange={(e) => setHeader((p) => ({ ...p, [f.name]: e.target.value }))}
                  />
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    step={f.step}
                    className="input"
                    placeholder={f.placeholder}
                    value={header[f.name] ?? ''}
                    onChange={(e) => setHeader((p) => ({ ...p, [f.name]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <LineItemsEditor
              items={items}
              lines={lines}
              onChange={setLines}
              currency={header.currency || 'USD'}
              showHs={config.lineHasHs}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : editingId ? (
                <>Update {config.singular}</>
              ) : (
                <>Save {config.singular}</>
              )}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Detail drawer */}
      <Drawer
        open={!!detail}
        title={detail ? `${config.docNoLabel} ${detail[config.docNoField]}` : ''}
        subtitle={
          detail
            ? `${detail[config.partyTable]?.name ?? ''} · ${formatDate(detail[config.dateField])}`
            : ''
        }
        onClose={() => setDetail(null)}
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label={config.partyLabel} value={detail[config.partyTable]?.name} />
              <Info label="Status" value={<StatusBadge value={detail.status} />} />
              <Info label={config.dateLabel} value={formatDate(detail[config.dateField])} />
              <Info
                label="Total"
                value={formatCurrency(detail.total_amount, detail.currency)}
              />
              {config.extraHeaderFields.map((f) => (
                <Info key={f.name} label={f.label} value={detail[f.name]} />
              ))}
              {detail.remarks && <Info label="Remarks" value={detail.remarks} />}
            </div>

            <div>
              <p className="label">Line Items</p>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-right">Qty</th>
                      <th>Unit</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailLoading ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        </td>
                      </tr>
                    ) : (
                      detailLines.map((l) => (
                        <tr key={l.id}>
                          <td className="font-medium text-slate-800">
                            {l.items?.name || l.description || '—'}
                          </td>
                          <td className="text-right">{l.quantity}</td>
                          <td>{l.unit}</td>
                          <td className="text-right">
                            {formatCurrency(l.unit_price, detail.currency)}
                          </td>
                          <td className="text-right font-medium">
                            {formatCurrency(l.amount, detail.currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value || '—'}</p>
    </div>
  );
}
