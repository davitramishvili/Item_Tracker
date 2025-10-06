export interface Item {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  quantity: number;
  category?: string;
  image_url?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateItemData {
  name: string;
  description?: string;
  quantity?: number;
  category?: string;
  image_url?: string;
  location?: string;
}

export interface UpdateItemData {
  name?: string;
  description?: string;
  quantity?: number;
  category?: string;
  image_url?: string;
  location?: string;
}

export interface ItemsResponse {
  items: Item[];
}

export interface ItemResponse {
  item: Item;
  message?: string;
}
