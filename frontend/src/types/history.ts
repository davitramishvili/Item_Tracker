export interface ItemHistory {
  id: number;
  item_id: number;
  user_id: number;
  quantity_before: number;
  quantity_after: number;
  change_amount: number;
  changed_at: string;
}

export interface ItemSnapshot {
  id: number;
  item_id: number;
  user_id: number;
  name: string;
  quantity: number;
  price_per_unit?: number;
  currency?: 'GEL' | 'USD';
  category?: string;
  snapshot_date: string;
  snapshot_type: 'auto' | 'manual';
  created_at: string;
}
