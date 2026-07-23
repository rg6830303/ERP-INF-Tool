'use client';

import { Wallet } from 'lucide-react';
import { CrudModule } from '@/components/data/CrudModule';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ModuleConfig } from '@/components/data/types';

const config: ModuleConfig = {
  table: 'account_entries',
  title: 'Accounts',
  singular: 'Entry',
  subtitle: 'Receipts and payments ledger across buyers & suppliers.',
  selectQuery: '*, buyers(name), suppliers(name)',
  orderColumn: 'entry_date',
  searchKeys: ['party_name', 'reference_no', 'against_invoice', 'payment_mode'],
  filters: [
    { kind: 'search', placeholder: 'Search party, reference, invoice…' },
    {
      kind: 'select',
      name: 'entry_type',
      label: 'Type',
      options: [
        { value: 'receipt', label: 'Receipt (money in)' },
        { value: 'payment', label: 'Payment (money out)' },
      ],
    },
    {
      kind: 'reference',
      name: 'buyer_id',
      label: 'Buyer',
      reference: { table: 'buyers', valueKey: 'id', labelKey: 'name', codeKey: 'buyer_code', activeOnly: true },
    },
    { kind: 'dateRange', column: 'entry_date', label: 'From date' },
  ],
  columns: [
    { key: 'entry_date', label: 'Date', render: (r) => formatDate(r.entry_date) },
    { key: 'entry_type', label: 'Type', render: (r) => <StatusBadge value={r.entry_type} /> },
    {
      key: 'party',
      label: 'Party',
      className: 'font-medium text-slate-900',
      render: (r) => r.buyers?.name || r.suppliers?.name || r.party_name || '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => (
        <span className={r.entry_type === 'payment' ? 'text-red-600' : 'text-emerald-600'}>
          {r.entry_type === 'payment' ? '−' : '+'}
          {formatCurrency(r.amount, r.currency)}
        </span>
      ),
    },
    { key: 'payment_mode', label: 'Mode' },
    { key: 'reference_no', label: 'Reference' },
    { key: 'against_invoice', label: 'Against Invoice' },
  ],
  fields: [
    { name: 'entry_date', label: 'Date', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
    {
      name: 'entry_type',
      label: 'Entry Type',
      type: 'select',
      required: true,
      options: [
        { value: 'receipt', label: 'Receipt (money in)' },
        { value: 'payment', label: 'Payment (money out)' },
      ],
    },
    {
      name: 'party_type',
      label: 'Party Type',
      type: 'select',
      default: 'buyer',
      options: [
        { value: 'buyer', label: 'Buyer' },
        { value: 'supplier', label: 'Supplier' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      name: 'buyer_id',
      label: 'Buyer (if applicable)',
      type: 'reference',
      reference: { table: 'buyers', valueKey: 'id', labelKey: 'name', codeKey: 'buyer_code', activeOnly: true },
    },
    {
      name: 'supplier_id',
      label: 'Supplier (if applicable)',
      type: 'reference',
      reference: { table: 'suppliers', valueKey: 'id', labelKey: 'name', codeKey: 'supplier_code', activeOnly: true },
    },
    { name: 'party_name', label: 'Party Name (free text)', type: 'text' },
    { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
    { name: 'currency', label: 'Currency', type: 'text', default: 'USD' },
    { name: 'payment_mode', label: 'Payment Mode', type: 'text', placeholder: 'Bank / Wire / LC / Cash' },
    { name: 'reference_no', label: 'Reference No.', type: 'text' },
    { name: 'against_invoice', label: 'Against Invoice', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
};

export default function AccountsPage() {
  return <CrudModule config={config} icon={Wallet} />;
}
