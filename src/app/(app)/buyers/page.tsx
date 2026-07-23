'use client';

import { Users2 } from 'lucide-react';
import { CrudModule } from '@/components/data/CrudModule';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ModuleConfig } from '@/components/data/types';

const config: ModuleConfig = {
  table: 'buyers',
  title: 'Buyers',
  singular: 'Buyer',
  subtitle: 'Foreign customers & importers you sell to.',
  selectQuery: '*',
  orderColumn: 'created_at',
  searchKeys: ['name', 'buyer_code', 'contact_person', 'country', 'email'],
  filters: [{ kind: 'search', placeholder: 'Search name, code, country…' }],
  columns: [
    { key: 'buyer_code', label: 'Code', className: 'font-medium text-slate-900' },
    { key: 'name', label: 'Name', className: 'font-medium text-slate-900' },
    { key: 'contact_person', label: 'Contact' },
    { key: 'country', label: 'Country' },
    { key: 'currency', label: 'Currency' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => <StatusBadge value={r.is_active ? 'active' : 'inactive'} />,
    },
  ],
  fields: [
    { name: 'buyer_code', label: 'Buyer Code', type: 'text', required: true, placeholder: 'BUY-1001' },
    { name: 'name', label: 'Company Name', type: 'text', required: true },
    { name: 'contact_person', label: 'Contact Person', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'currency', label: 'Currency', type: 'text', default: 'USD', placeholder: 'USD' },
    { name: 'tax_id', label: 'Tax / VAT ID', type: 'text' },
    { name: 'address', label: 'Address', type: 'textarea', colSpan: 2 },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
};

export default function BuyersPage() {
  return <CrudModule config={config} icon={Users2} />;
}
