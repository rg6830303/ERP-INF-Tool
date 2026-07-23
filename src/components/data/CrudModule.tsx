'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, RefreshCw, Loader2, Inbox, Filter, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Drawer } from '@/components/ui/Drawer';
import type { ModuleConfig, Option, ReferenceSpec, FieldDef } from './types';

type Row = Record<string, any>;

// A complete data-entry + search + list screen driven entirely by config.
export function CrudModule({
  config,
  icon,
  onSaved,
}: {
  config: ModuleConfig;
  icon?: LucideIcon;
  onSaved?: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Reference option cache for select/reference fields & filters
  const [refOptions, setRefOptions] = useState<Record<string, Option[]>>({});

  // Drawer / form
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const dateFilter = config.filters?.find((f) => f.kind === 'dateRange') as
    | { kind: 'dateRange'; column: string; label?: string }
    | undefined;

  // ---- Load reference options (buyers, suppliers, items, …) ----------------
  const referenceSpecs = useMemo(() => {
    const specs: { key: string; spec: ReferenceSpec }[] = [];
    for (const f of config.fields) {
      if (f.type === 'reference' && f.reference) specs.push({ key: f.name, spec: f.reference });
    }
    for (const f of config.filters ?? []) {
      if (f.kind === 'reference') specs.push({ key: f.name, spec: f.reference });
    }
    return specs;
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, Option[]> = {};
      await Promise.all(
        referenceSpecs.map(async ({ key, spec }) => {
          let q = supabase
            .from(spec.table)
            .select(`${spec.valueKey}, ${spec.labelKey}${spec.codeKey ? `, ${spec.codeKey}` : ''}`)
            .order(spec.labelKey, { ascending: true })
            .limit(1000);
          if (spec.activeOnly) q = q.eq('is_active', true);
          const { data } = await q;
          next[key] = (data ?? []).map((r: Row) => ({
            value: String(r[spec.valueKey]),
            label: spec.codeKey
              ? `${r[spec.codeKey]} — ${r[spec.labelKey]}`
              : String(r[spec.labelKey]),
          }));
        }),
      );
      if (!cancelled) setRefOptions(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [referenceSpecs, supabase]);

  // ---- Fetch rows with filters ---------------------------------------------
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase.from(config.table).select(config.selectQuery).limit(500);

    // Text search across configured keys
    const term = search.trim();
    if (term && config.searchKeys.length) {
      const safe = term.replace(/[%,()]/g, ' ');
      const ors = config.searchKeys.map((k) => `${k}.ilike.%${safe}%`).join(',');
      query = query.or(ors);
    }

    // Equality filters (select / reference)
    for (const [k, v] of Object.entries(filterValues)) {
      if (v) query = query.eq(k, v);
    }

    // Date range
    if (dateFilter) {
      if (dateFrom) query = query.gte(dateFilter.column, dateFrom);
      if (dateTo) query = query.lte(dateFilter.column, dateTo);
    }

    query = query.order(config.orderColumn, { ascending: config.ascending ?? false });

    const { data, error } = await query;
    if (error) setError(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [supabase, config, search, filterValues, dateFrom, dateTo, dateFilter]);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFilters() {
    setSearch('');
    setFilterValues({});
    setDateFrom('');
    setDateTo('');
    setTimeout(fetchRows, 0);
  }

  // ---- Add new record -------------------------------------------------------
  function openDrawer() {
    const initial: Record<string, string> = {};
    for (const f of config.fields) {
      initial[f.name] = f.default != null ? String(f.default) : '';
    }
    setForm(initial);
    setFormError(null);
    setDrawerOpen(true);
  }

  function optionsFor(f: FieldDef): Option[] {
    if (f.type === 'reference') return refOptions[f.name] ?? [];
    return f.options ?? [];
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Required validation
    for (const f of config.fields) {
      if (f.required && !form[f.name]?.trim()) {
        setFormError(`${f.label} is required.`);
        setSaving(false);
        return;
      }
    }

    // Build payload
    let payload: Record<string, unknown>;
    if (config.buildInsert) {
      payload = config.buildInsert(form);
    } else {
      payload = {};
      for (const f of config.fields) {
        const raw = form[f.name];
        if (raw === '' || raw == null) {
          payload[f.name] = null;
        } else if (f.type === 'number') {
          payload[f.name] = Number(raw);
        } else {
          payload[f.name] = raw;
        }
      }
    }

    // Attach creator where the column exists.
    const { data: userRes } = await supabase.auth.getUser();
    if (userRes.user) payload['created_by'] = userRes.user.id;

    const { error } = await supabase.from(config.table).insert(payload);
    setSaving(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setDrawerOpen(false);
    setToast(`${config.singular} saved successfully.`);
    setTimeout(() => setToast(null), 3000);
    fetchRows();
    onSaved?.();
  }

  const hasActiveFilters =
    Boolean(search) ||
    Object.values(filterValues).some(Boolean) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

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
            <button onClick={openDrawer} className="btn-primary">
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
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={resetFilters} className="btn-ghost text-xs">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="btn-ghost text-xs lg:hidden"
            >
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search box */}
            {config.filters?.some((f) => f.kind === 'search') !== false && (
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="label">Search</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchRows()}
                    className="input pl-9"
                    placeholder={
                      (config.filters?.find((f) => f.kind === 'search') as any)?.placeholder ??
                      'Search…'
                    }
                  />
                </div>
              </div>
            )}

            {/* Select & reference filters */}
            {config.filters?.map((f) => {
              if (f.kind === 'select' || f.kind === 'reference') {
                const opts = f.kind === 'reference' ? refOptions[f.name] ?? [] : f.options;
                return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    <select
                      className="input"
                      value={filterValues[f.name] ?? ''}
                      onChange={(e) =>
                        setFilterValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                      }
                    >
                      <option value="">All</option>
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              return null;
            })}

            {/* Date range */}
            {dateFilter && (
              <>
                <div>
                  <label className="label">{dateFilter.label ?? 'From date'}</label>
                  <input
                    type="date"
                    className="input"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">To date</label>
                  <input
                    type="date"
                    className="input"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button onClick={fetchRows} className="btn-primary w-full">
                <Search className="h-4 w-4" /> Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${rows.length} record${rows.length === 1 ? '' : 's'} found`}
        </p>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={config.columns.length} className="py-12 text-center text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length} className="py-14 text-center text-slate-400">
                  <Inbox className="mx-auto mb-2 h-8 w-8" />
                  No records found. Adjust filters or add a new {config.singular.toLowerCase()}.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id ?? i}>
                  {config.columns.map((c) => (
                    <td key={c.key} className={c.className}>
                      {c.render ? c.render(row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add drawer */}
      <Drawer
        open={drawerOpen}
        title={`New ${config.singular}`}
        subtitle={`Add a new ${config.singular.toLowerCase()} record`}
        onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {config.fields.map((f) => {
              const span = f.colSpan === 2 || f.type === 'textarea' ? 'sm:col-span-2' : '';
              return (
                <div key={f.name} className={span}>
                  <label className="label" htmlFor={f.name}>
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>

                  {f.type === 'textarea' ? (
                    <textarea
                      id={f.name}
                      className="input min-h-[80px]"
                      placeholder={f.placeholder}
                      value={form[f.name] ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                    />
                  ) : f.type === 'select' || f.type === 'reference' ? (
                    <select
                      id={f.name}
                      className="input"
                      value={form[f.name] ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      {optionsFor(f).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={f.name}
                      type={f.type}
                      step={f.step}
                      className="input"
                      placeholder={f.placeholder}
                      value={form[f.name] ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                    />
                  )}
                  {f.help && <p className="mt-1 text-xs text-slate-400">{f.help}</p>}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>Save {config.singular}</>
              )}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
