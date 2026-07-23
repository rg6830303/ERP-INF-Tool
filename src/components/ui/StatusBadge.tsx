const TONES: Record<string, string> = {
  // sales
  draft: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  // purchase
  ordered: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700',
  // incentive
  pending: 'bg-slate-100 text-slate-600',
  filed: 'bg-blue-100 text-blue-700',
  approved: 'bg-indigo-100 text-indigo-700',
  rejected: 'bg-red-100 text-red-700',
  // entry type / movement
  receipt: 'bg-emerald-100 text-emerald-700',
  payment: 'bg-red-100 text-red-700',
  in: 'bg-emerald-100 text-emerald-700',
  out: 'bg-red-100 text-red-700',
  adjustment: 'bg-amber-100 text-amber-700',
  // generic
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-200 text-slate-600',
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const tone = TONES[value.toLowerCase()] ?? 'bg-slate-100 text-slate-600';
  return <span className={`badge ${tone}`}>{value.replace(/_/g, ' ')}</span>;
}
