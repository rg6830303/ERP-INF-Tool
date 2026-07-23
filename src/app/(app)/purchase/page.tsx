'use client';

import { PackageSearch } from 'lucide-react';
import { DocumentModule, type DocConfig } from '@/components/data/DocumentModule';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

const config: DocConfig = {
  table: 'purchases',
  lineTable: 'purchase_items',
  lineFk: 'purchase_id',
  title: 'Purchase',
  singular: 'Purchase',
  subtitle: 'Purchase bills from suppliers — filter supplier wise, date wise and item wise.',
  docNoField: 'bill_no',
  docNoLabel: 'Bill No.',
  dateField: 'purchase_date',
  dateLabel: 'Purchase Date',
  partyField: 'supplier_id',
  partyTable: 'suppliers',
  partyCodeKey: 'supplier_code',
  partyLabel: 'Supplier',
  statusDefault: 'ordered',
  statusOptions: [
    { value: 'draft', label: 'Draft' },
    { value: 'ordered', label: 'Ordered' },
    { value: 'received', label: 'Received' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  lineHasHs: false,
  extraHeaderFields: [{ name: 'remarks', label: 'Remarks', type: 'textarea' }],
  columns: [
    { key: 'bill_no', label: 'Bill No.', className: 'font-medium text-slate-900' },
    { key: 'purchase_date', label: 'Date', render: (r) => formatDate(r.purchase_date) },
    { key: 'supplier', label: 'Supplier', render: (r) => r.suppliers?.name || '—' },
    {
      key: 'total_amount',
      label: 'Total',
      className: 'text-right',
      render: (r) => formatCurrency(r.total_amount, r.currency),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ],
};

export default function PurchasePage() {
  return <DocumentModule config={config} icon={PackageSearch} />;
}
