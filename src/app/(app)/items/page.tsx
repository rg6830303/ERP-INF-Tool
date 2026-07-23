'use client';

import { Package } from 'lucide-react';
import { CrudModule } from '@/components/data/CrudModule';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/format';
import type { ModuleConfig } from '@/components/data/types';

const config: ModuleConfig = {
  table: 'items',
  title: 'Items',
  singular: 'Item',
  subtitle: 'Products / SKUs traded, with HS codes for customs.',
  selectQuery: '*',
  orderColumn: 'created_at',
  searchKeys: ['name', 'item_code', 'hs_code', 'category', 'description'],
  filters: [{ kind: 'search', placeholder: 'Search name, code, HS code…' }],
  columns: [
    { key: 'item_code', label: 'Code', className: 'font-medium text-slate-900' },
    { key: 'name', label: 'Name', className: 'font-medium text-slate-900' },
    { key: 'hs_code', label: 'HS Code' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    {
      key: 'default_unit_price',
      label: 'Unit Price',
      render: (r) => formatCurrency(r.default_unit_price, r.currency),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => <StatusBadge value={r.is_active ? 'active' : 'inactive'} />,
    },
  ],
  fields: [
    { name: 'item_code', label: 'Item Code', type: 'text', required: true, placeholder: 'ITM-3001' },
    { name: 'name', label: 'Item Name', type: 'text', required: true },
    { name: 'hs_code', label: 'HS Code', type: 'text', placeholder: '6302.60' },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'unit', label: 'Unit', type: 'text', default: 'PCS', placeholder: 'PCS / KG / SET' },
    { name: 'default_unit_price', label: 'Default Unit Price', type: 'number', step: '0.01', default: 0 },
    { name: 'currency', label: 'Currency', type: 'text', default: 'USD' },
    { name: 'reorder_level', label: 'Reorder Level', type: 'number', step: '0.001', default: 0 },
    { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
  ],
};

export default function ItemsPage() {
  return <CrudModule config={config} icon={Package} />;
}
