import {
  LayoutDashboard,
  ShoppingCart,
  PackageSearch,
  Boxes,
  Wallet,
  BadgePercent,
  Users2,
  Truck,
  Package,
  ShieldCheck,
  Activity,
  Database,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavSection = {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/sales', label: 'Sales', icon: ShoppingCart },
      { href: '/purchase', label: 'Purchase', icon: PackageSearch },
      { href: '/inventory', label: 'Inventory', icon: Boxes },
      { href: '/accounts', label: 'Accounts', icon: Wallet },
      { href: '/incentive', label: 'Incentive', icon: BadgePercent },
    ],
  },
  {
    title: 'Masters',
    items: [
      { href: '/buyers', label: 'Buyers', icon: Users2 },
      { href: '/suppliers', label: 'Suppliers', icon: Truck },
      { href: '/items', label: 'Items', icon: Package },
    ],
  },
  {
    title: 'Administration',
    adminOnly: true,
    items: [
      { href: '/admin', label: 'Admin Home', icon: ShieldCheck },
      { href: '/admin/users', label: 'Employees', icon: Users2 },
      { href: '/admin/activity', label: 'User Activity', icon: Activity },
      { href: '/admin/database', label: 'Database', icon: Database },
    ],
  },
];
