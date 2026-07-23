'use client';

import { BadgePercent } from 'lucide-react';
import { CrudModule } from '@/components/data/CrudModule';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ModuleConfig } from '@/components/data/types';

const config: ModuleConfig = {
  table: 'incentives',
  title: 'Export Incentives',
  singular: 'Incentive',
  subtitle: 'Track RODTEP, Duty Drawback, EPCG & other export incentive claims.',
  selectQuery: '*, buyers(name)',
  orderColumn: 'claim_date',
  searchKeys: ['shipping_bill_no', 'scheme', 'notes'],
  filters: [
    { kind: 'search', placeholder: 'Search shipping bill, scheme…' },
    {
      kind: 'select',
      name: 'scheme',
      label: 'Scheme',
      options: [
        { value: 'RODTEP', label: 'RODTEP' },
        { value: 'Duty Drawback', label: 'Duty Drawback' },
        { value: 'EPCG', label: 'EPCG' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      kind: 'select',
      name: 'status',
      label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'filed', label: 'Filed' },
        { value: 'approved', label: 'Approved' },
        { value: 'received', label: 'Received' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    { kind: 'dateRange', column: 'claim_date', label: 'Claim from' },
  ],
  columns: [
    { key: 'claim_date', label: 'Claim Date', render: (r) => formatDate(r.claim_date) },
    { key: 'shipping_bill_no', label: 'Shipping Bill', className: 'font-medium text-slate-900' },
    { key: 'scheme', label: 'Scheme' },
    { key: 'buyer', label: 'Buyer', render: (r) => r.buyers?.name || '—' },
    {
      key: 'incentive_amount',
      label: 'Incentive',
      render: (r) => formatCurrency(r.incentive_amount, r.currency),
    },
    { key: 'incentive_rate', label: 'Rate %' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'received_date', label: 'Received', render: (r) => formatDate(r.received_date) },
  ],
  fields: [
    { name: 'claim_date', label: 'Claim Date', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
    { name: 'shipping_bill_no', label: 'Shipping Bill No.', type: 'text', required: true },
    {
      name: 'scheme',
      label: 'Scheme',
      type: 'select',
      default: 'RODTEP',
      options: [
        { value: 'RODTEP', label: 'RODTEP' },
        { value: 'Duty Drawback', label: 'Duty Drawback' },
        { value: 'EPCG', label: 'EPCG' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      name: 'buyer_id',
      label: 'Buyer',
      type: 'reference',
      reference: { table: 'buyers', valueKey: 'id', labelKey: 'name', codeKey: 'buyer_code', activeOnly: true },
    },
    { name: 'incentive_rate', label: 'Incentive Rate (%)', type: 'number', step: '0.0001', default: 0 },
    { name: 'incentive_amount', label: 'Incentive Amount', type: 'number', step: '0.01', required: true, default: 0 },
    { name: 'currency', label: 'Currency', type: 'text', default: 'INR' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      default: 'pending',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'filed', label: 'Filed' },
        { value: 'approved', label: 'Approved' },
        { value: 'received', label: 'Received' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    { name: 'received_date', label: 'Received Date', type: 'date' },
    { name: 'received_amount', label: 'Received Amount', type: 'number', step: '0.01' },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
};

export default function IncentivePage() {
  return <CrudModule config={config} icon={BadgePercent} />;
}
