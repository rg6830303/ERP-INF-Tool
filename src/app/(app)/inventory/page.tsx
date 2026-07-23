'use client';

import { useState } from 'react';
import { Boxes } from 'lucide-react';
import { CrudModule } from '@/components/data/CrudModule';
import { InventoryStock } from '@/components/data/InventoryStock';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatNumber, formatDate } from '@/lib/format';
import type { ModuleConfig } from '@/components/data/types';

const movementsConfig: ModuleConfig = {
  table: 'stock_movements',
  title: 'Stock Movements',
  singular: 'Movement',
  subtitle: 'Record goods received (in), dispatched (out) or adjustments.',
  selectQuery: '*, items(name, item_code, unit)',
  orderColumn: 'movement_date',
  searchKeys: ['reference_no', 'reference_type', 'notes'],
  filters: [
    { kind: 'search', placeholder: 'Search reference, notes…' },
    {
      kind: 'reference',
      name: 'item_id',
      label: 'Item',
      reference: { table: 'items', valueKey: 'id', labelKey: 'name', codeKey: 'item_code', activeOnly: true },
    },
    {
      kind: 'select',
      name: 'movement_type',
      label: 'Type',
      options: [
        { value: 'in', label: 'In' },
        { value: 'out', label: 'Out' },
        { value: 'adjustment', label: 'Adjustment' },
      ],
    },
    { kind: 'dateRange', column: 'movement_date', label: 'From date' },
  ],
  columns: [
    { key: 'movement_date', label: 'Date', render: (r) => formatDate(r.movement_date) },
    {
      key: 'item',
      label: 'Item',
      className: 'font-medium text-slate-900',
      render: (r) => (r.items ? `${r.items.item_code} — ${r.items.name}` : '—'),
    },
    { key: 'movement_type', label: 'Type', render: (r) => <StatusBadge value={r.movement_type} /> },
    {
      key: 'quantity',
      label: 'Qty',
      className: 'text-right',
      render: (r) => (
        <span className={r.movement_type === 'out' ? 'text-red-600' : 'text-emerald-600'}>
          {r.movement_type === 'out' ? '−' : '+'}
          {formatNumber(r.quantity)} {r.items?.unit ?? ''}
        </span>
      ),
    },
    { key: 'reference_type', label: 'Ref Type' },
    { key: 'reference_no', label: 'Reference' },
    { key: 'notes', label: 'Notes' },
  ],
  fields: [
    { name: 'movement_date', label: 'Date', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
    {
      name: 'item_id',
      label: 'Item',
      type: 'reference',
      required: true,
      reference: { table: 'items', valueKey: 'id', labelKey: 'name', codeKey: 'item_code', activeOnly: true },
    },
    {
      name: 'movement_type',
      label: 'Movement Type',
      type: 'select',
      required: true,
      default: 'in',
      options: [
        { value: 'in', label: 'In (received)' },
        { value: 'out', label: 'Out (dispatched)' },
        { value: 'adjustment', label: 'Adjustment' },
      ],
    },
    { name: 'quantity', label: 'Quantity', type: 'number', step: '0.001', required: true },
    { name: 'reference_type', label: 'Reference Type', type: 'text', placeholder: 'Purchase / Sale / Manual' },
    { name: 'reference_no', label: 'Reference No.', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
};

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <InventoryStock refreshKey={refreshKey} />
      <CrudModule
        config={movementsConfig}
        icon={Boxes}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
