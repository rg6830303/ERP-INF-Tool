'use client';

import { ShoppingCart } from 'lucide-react';
import { DocumentModule, type DocConfig } from '@/components/data/DocumentModule';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

const config: DocConfig = {
  table: 'sales',
  lineTable: 'sale_items',
  lineFk: 'sale_id',
  title: 'Sales',
  singular: 'Sale',
  subtitle: 'Export sales invoices — filter buyer wise, date wise and item wise.',
  docNoField: 'invoice_no',
  docNoLabel: 'Invoice No.',
  dateField: 'sale_date',
  dateLabel: 'Sale Date',
  partyField: 'buyer_id',
  partyTable: 'buyers',
  partyCodeKey: 'buyer_code',
  partyLabel: 'Buyer',
  statusDefault: 'confirmed',
  statusOptions: [
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  lineHasHs: true,
  extraHeaderFields: [
    { name: 'incoterm', label: 'Incoterm', type: 'text', placeholder: 'FOB / CIF / EXW' },
    { name: 'destination_country', label: 'Destination Country', type: 'text' },
    { name: 'port_of_loading', label: 'Port of Loading', type: 'text' },
    { name: 'port_of_discharge', label: 'Port of Discharge', type: 'text' },
    { name: 'shipping_bill_no', label: 'Shipping Bill No.', type: 'text' },
    { name: 'shipping_bill_date', label: 'Shipping Bill Date', type: 'date' },
    { name: 'bl_awb_no', label: 'BL / AWB No.', type: 'text' },
    { name: 'container_no', label: 'Container No.', type: 'text' },
    { name: 'vessel_name', label: 'Vessel / Flight', type: 'text' },
    { name: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  columns: [
    { key: 'invoice_no', label: 'Invoice', className: 'font-medium text-slate-900' },
    { key: 'sale_date', label: 'Date', render: (r) => formatDate(r.sale_date) },
    { key: 'buyer', label: 'Buyer', render: (r) => r.buyers?.name || '—' },
    { key: 'destination_country', label: 'Destination' },
    {
      key: 'total_amount',
      label: 'Total',
      className: 'text-right',
      render: (r) => formatCurrency(r.total_amount, r.currency),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ],
};

export default function SalesPage() {
  return <DocumentModule config={config} icon={ShoppingCart} />;
}
