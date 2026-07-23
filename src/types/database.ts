// Hand-written row types mirroring the Supabase schema (supabase/migrations).

export type UserRole = 'admin' | 'employee';
export type SaleStatus = 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled';
export type MovementType = 'in' | 'out' | 'adjustment';
export type EntryType = 'receipt' | 'payment';
export type PartyType = 'buyer' | 'supplier' | 'other';
export type IncentiveStatus = 'pending' | 'filed' | 'approved' | 'received' | 'rejected';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Buyer {
  id: string;
  buyer_code: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  address: string | null;
  currency: string;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  item_code: string;
  name: string;
  description: string | null;
  hs_code: string | null;
  unit: string;
  category: string | null;
  default_unit_price: number;
  currency: string;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_no: string;
  buyer_id: string;
  sale_date: string;
  currency: string;
  exchange_rate: number;
  incoterm: string | null;
  port_of_loading: string | null;
  port_of_discharge: string | null;
  destination_country: string | null;
  shipping_bill_no: string | null;
  shipping_bill_date: string | null;
  bl_awb_no: string | null;
  container_no: string | null;
  vessel_name: string | null;
  total_amount: number;
  status: SaleStatus;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  buyers?: Pick<Buyer, 'id' | 'name' | 'buyer_code' | 'country'> | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  item_id: string | null;
  description: string | null;
  hs_code: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  line_no: number;
}

export interface Purchase {
  id: string;
  bill_no: string;
  supplier_id: string;
  purchase_date: string;
  currency: string;
  exchange_rate: number;
  total_amount: number;
  status: PurchaseStatus;
  remarks: string | null;
  created_at: string;
  suppliers?: Pick<Supplier, 'id' | 'name' | 'supplier_code'> | null;
}

export interface StockMovement {
  id: string;
  item_id: string;
  movement_date: string;
  movement_type: MovementType;
  quantity: number;
  reference_type: string | null;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
  items?: Pick<Item, 'id' | 'name' | 'item_code' | 'unit'> | null;
}

export interface InventoryStatus {
  item_id: string;
  item_code: string;
  item_name: string;
  unit: string;
  category: string | null;
  hs_code: string | null;
  reorder_level: number;
  on_hand: number;
}

export interface AccountEntry {
  id: string;
  entry_date: string;
  entry_type: EntryType;
  party_type: PartyType;
  buyer_id: string | null;
  supplier_id: string | null;
  party_name: string | null;
  amount: number;
  currency: string;
  payment_mode: string | null;
  reference_no: string | null;
  against_invoice: string | null;
  notes: string | null;
  created_at: string;
}

export interface Incentive {
  id: string;
  sale_id: string | null;
  buyer_id: string | null;
  shipping_bill_no: string | null;
  scheme: string;
  claim_date: string;
  incentive_rate: number;
  incentive_amount: number;
  currency: string;
  status: IncentiveStatus;
  received_date: string | null;
  received_amount: number | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: string | null;
  username: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
