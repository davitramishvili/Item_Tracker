export interface Item {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  quantity: number;
  price_per_unit?: number;
  currency?: 'GEL' | 'USD';
  purchase_price?: number;
  purchase_currency?: 'GEL' | 'USD';
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateItemData {
  name: string;
  description?: string;
  quantity?: number;
  price_per_unit?: number;
  currency?: 'GEL' | 'USD';
  purchase_price?: number;
  purchase_currency?: 'GEL' | 'USD';
  category?: string;
  skipDuplicateCheck?: boolean;
}

export interface UpdateItemData {
  name?: string;
  description?: string;
  quantity?: number;
  price_per_unit?: number;
  currency?: 'GEL' | 'USD';
  purchase_price?: number;
  purchase_currency?: 'GEL' | 'USD';
  category?: string;
}

export interface ItemsResponse {
  items: Item[];
}

export interface ItemResponse {
  item: Item;
  message?: string;
}
