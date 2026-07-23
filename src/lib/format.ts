// Small display helpers shared across modules.

export function formatCurrency(
  value: number | string | null | undefined,
  currency = 'USD',
): string {
  const n = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  if (n == null || Number.isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    // Unknown ISO currency code — fall back to a plain number + code.
    return `${n.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`;
  }
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 3 });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function titleCase(s: string): string {
  return s.replace(/(^|[\s_-])(\w)/g, (_, sep, c) => `${sep === '_' || sep === '-' ? ' ' : sep}${c.toUpperCase()}`);
}
