import Link from 'next/link';
import {
  ShoppingCart,
  PackageSearch,
  Users2,
  Package,
  BadgePercent,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Sale } from '@/types/database';

export const dynamic = 'force-dynamic';

type Stats = {
  sales_count: number;
  sales_total: number;
  sales_total_month: number;
  purchase_total: number;
  buyers_count: number;
  suppliers_count: number;
  items_count: number;
  pending_incentive_amt: number;
  low_stock_count: number;
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: statsData } = await supabase.rpc('erp_dashboard');
  const stats = (statsData as Stats) ?? ({} as Stats);

  const { data: recentSales } = await supabase
    .from('sales')
    .select('id, invoice_no, sale_date, total_amount, currency, status, buyers(name)')
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile.full_name || profile.username}`}
        subtitle="Here's an overview of your import/export operations."
        icon={TrendingUp}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sales (this month)"
          value={formatCurrency(stats.sales_total_month ?? 0)}
          hint={`${stats.sales_count ?? 0} total invoices`}
          icon={ShoppingCart}
          tone="brand"
        />
        <StatCard
          label="Total Purchases"
          value={formatCurrency(stats.purchase_total ?? 0)}
          icon={PackageSearch}
          tone="slate"
        />
        <StatCard
          label="Pending Incentives"
          value={formatCurrency(stats.pending_incentive_amt ?? 0, 'INR')}
          icon={BadgePercent}
          tone="amber"
        />
        <StatCard
          label="Low Stock Items"
          value={stats.low_stock_count ?? 0}
          hint="at / below reorder level"
          icon={AlertTriangle}
          tone={stats.low_stock_count > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active Buyers" value={stats.buyers_count ?? 0} icon={Users2} tone="brand" />
        <StatCard label="Active Suppliers" value={stats.suppliers_count ?? 0} icon={PackageSearch} tone="slate" />
        <StatCard label="Active Items" value={stats.items_count ?? 0} icon={Package} tone="green" />
      </div>

      {/* Recent sales */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Sales</h2>
          <Link href="/sales" className="btn-ghost text-sm text-brand-600">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Buyer</th>
                <th className="text-right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!recentSales || recentSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No sales recorded yet.{' '}
                    <Link href="/sales" className="text-brand-600 underline">
                      Create your first sale
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                (recentSales as unknown as Sale[]).map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-slate-900">{s.invoice_no}</td>
                    <td>{formatDate(s.sale_date)}</td>
                    <td>{s.buyers?.name || '—'}</td>
                    <td className="text-right">{formatCurrency(s.total_amount, s.currency)}</td>
                    <td>
                      <StatusBadge value={s.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { href: '/sales', label: 'New Sale', icon: ShoppingCart },
            { href: '/purchase', label: 'New Purchase', icon: PackageSearch },
            { href: '/inventory', label: 'Stock', icon: Package },
            { href: '/accounts', label: 'Accounts', icon: BadgePercent },
            { href: '/buyers', label: 'Buyers', icon: Users2 },
            { href: '/incentive', label: 'Incentives', icon: BadgePercent },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="card flex flex-col items-center gap-2 p-4 text-center transition hover:border-brand-300 hover:shadow-soft"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-700">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
