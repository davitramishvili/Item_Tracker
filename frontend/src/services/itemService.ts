import api from './api';
import type { Item, CreateItemData, UpdateItemData, ItemsResponse, ItemResponse } from '../types/item';

export const itemService = {
  // Get all items
  getAll: async (): Promise<Item[]> => {
    const response = await api.get<ItemsResponse>('/items');
    return response.data.items;
  },

  // Get a single item by ID
  getById: async (id: number): Promise<Item> => {
    const response = await api.get<ItemResponse>(`/items/${id}`);
    return response.data.item;
  },

  // Create a new item
  create: async (data: CreateItemData): Promise<Item> => {
    const response = await api.post<ItemResponse>('/items', data);
    return response.data.item;
  },

  // Update an item
  update: async (id: number, data: UpdateItemData): Promise<Item> => {
    const response = await api.put<ItemResponse>(`/items/${id}`, data);
    return response.data.item;
  },

  // Delete an item
  delete: async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`);
  },

  // Search items
  search: async (query: string): Promise<Item[]> => {
    const response = await api.get<ItemsResponse>(`/items/search?q=${encodeURIComponent(query)}`);
    return response.data.items;
  },

  // Get items by category
  getByCategory: async (category: string): Promise<Item[]> => {
    const response = await api.get<ItemsResponse>(`/items/category/${encodeURIComponent(category)}`);
    return response.data.items;
  },
};
