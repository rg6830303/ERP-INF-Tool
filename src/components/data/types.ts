import type { ReactNode } from 'react';

export type Option = { value: string; label: string };

export type ReferenceSpec = {
  table: string;
  valueKey: string;
  labelKey: string;
  codeKey?: string;
  // optional filter, e.g. only active rows
  activeOnly?: boolean;
};

export type FieldDef = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'reference';
  required?: boolean;
  placeholder?: string;
  options?: Option[];
  reference?: ReferenceSpec;
  step?: string;
  default?: string | number;
  colSpan?: 1 | 2;
  help?: string;
};

export type ColumnDef = {
  key: string;
  label: string;
  render?: (row: Record<string, any>) => ReactNode;
  className?: string;
};

export type FilterDef =
  | { kind: 'search'; placeholder?: string }
  | { kind: 'select'; name: string; label: string; options: Option[] }
  | { kind: 'reference'; name: string; label: string; reference: ReferenceSpec }
  | { kind: 'dateRange'; column: string; label?: string };

export type ModuleConfig = {
  table: string;
  title: string;
  singular: string;
  subtitle?: string;
  selectQuery: string;
  orderColumn: string;
  ascending?: boolean;
  searchKeys: string[];
  columns: ColumnDef[];
  fields: FieldDef[];
  filters?: FilterDef[];
  // Map raw form strings to typed insert payload (numbers, nulls, etc.)
  buildInsert?: (values: Record<string, string>) => Record<string, unknown>;
};
