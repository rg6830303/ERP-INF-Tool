'use client';

import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export type ItemOption = {
  id: string;
  item_code: string;
  name: string;
  unit: string;
  hs_code: string | null;
  default_unit_price: number;
};

export type LineRow = {
  item_id: string;
  description: string;
  hs_code: string;
  quantity: string;
  unit: string;
  unit_price: string;
};

export function emptyLine(): LineRow {
  return { item_id: '', description: '', hs_code: '', quantity: '1', unit: 'PCS', unit_price: '0' };
}

export function LineItemsEditor({
  items,
  lines,
  onChange,
  currency = 'USD',
  showHs = true,
}: {
  items: ItemOption[];
  lines: LineRow[];
  onChange: (lines: LineRow[]) => void;
  currency?: string;
  showHs?: boolean;
}) {
  function update(idx: number, patch: Partial<LineRow>) {
    onChange(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function pickItem(idx: number, itemId: string) {
    const it = items.find((x) => x.id === itemId);
    if (!it) {
      update(idx, { item_id: '' });
      return;
    }
    update(idx, {
      item_id: itemId,
      description: it.name,
      hs_code: it.hs_code ?? '',
      unit: it.unit,
      unit_price: String(it.default_unit_price ?? 0),
    });
  }

  const total = lines.reduce(
    (sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0),
    0,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label mb-0">Line Items</span>
        <button
          type="button"
          onClick={() => onChange([...lines, emptyLine()])}
          className="btn-secondary py-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Add line
        </button>
      </div>

      <div className="space-y-3">
        {lines.map((l, idx) => {
          const amount = (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0);
          return (
            <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-12">
                <div className="col-span-2 sm:col-span-4">
                  <label className="label">Item</label>
                  <select
                    className="input"
                    value={l.item_id}
                    onChange={(e) => pickItem(idx, e.target.value)}
                  >
                    <option value="">— Select / free text —</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.item_code} — {it.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <label className="label">Description</label>
                  <input
                    className="input"
                    value={l.description}
                    onChange={(e) => update(idx, { description: e.target.value })}
                    placeholder="Item description"
                  />
                </div>
                {showHs && (
                  <div className="sm:col-span-2">
                    <label className="label">HS Code</label>
                    <input
                      className="input"
                      value={l.hs_code}
                      onChange={(e) => update(idx, { hs_code: e.target.value })}
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="label">Unit</label>
                  <input
                    className="input"
                    value={l.unit}
                    onChange={(e) => update(idx, { unit: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="label">Quantity</label>
                  <input
                    type="number"
                    step="0.001"
                    className="input"
                    value={l.quantity}
                    onChange={(e) => update(idx, { quantity: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="label">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={l.unit_price}
                    onChange={(e) => update(idx, { unit_price: e.target.value })}
                  />
                </div>
                <div className="flex items-end sm:col-span-4">
                  <div className="w-full rounded-lg bg-white px-3 py-2 text-sm">
                    <span className="text-xs text-slate-400">Amount: </span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(amount, currency)}
                    </span>
                  </div>
                </div>
                <div className="flex items-end justify-end sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => onChange(lines.filter((_, i) => i !== idx))}
                    className="btn-ghost p-2 text-red-500 hover:bg-red-50"
                    aria-label="Remove line"
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-3">
        <div className="text-right">
          <span className="text-xs uppercase tracking-wide text-slate-400">Total</span>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(total, currency)}</p>
        </div>
      </div>
    </div>
  );
}
