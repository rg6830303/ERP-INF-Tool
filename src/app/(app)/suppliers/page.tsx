'use client';

import { Truck } from 'lucide-react';
import { CrudModule } from '@/components/data/CrudModule';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ModuleConfig } from '@/components/data/types';

const config: ModuleConfig = {
  table: 'suppliers',
  title: 'Suppliers',
  singular: 'Supplier',
  subtitle: 'Vendors & manufacturers you purchase from.',
  selectQuery: '*',
  orderColumn: 'created_at',
  searchKeys: ['name', 'supplier_code', 'contact_person', 'country', 'email'],
  filters: [{ kind: 'search', placeholder: 'Search name, code, country…' }],
  columns: [
    { key: 'supplier_code', label: 'Code', className: 'font-medium text-slate-900' },
    { key: 'name', label: 'Name', className: 'font-medium text-slate-900' },
    { key: 'contact_person', label: 'Contact' },
    { key: 'country', label: 'Country' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => <StatusBadge value={r.is_active ? 'active' : 'inactive'} />,
    },
  ],
  fields: [
    { name: 'supplier_code', label: 'Supplier Code', type: 'text', required: true, placeholder: 'SUP-2001' },
    { name: 'name', label: 'Company Name', type: 'text', required: true },
    { name: 'contact_person', label: 'Contact Person', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'tax_id', label: 'Tax / GST ID', type: 'text' },
    { name: 'address', label: 'Address', type: 'textarea', colSpan: 2 },
    { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
  ],
};

export default function SuppliersPage() {
  return <CrudModule config={config} icon={Truck} />;
}
