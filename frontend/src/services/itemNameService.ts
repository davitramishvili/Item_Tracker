import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ItemName {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const itemNameService = {
  // Get all item names for the user
  getAll: async (): Promise<ItemName[]> => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/item-names`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.itemNames;
  },

  // Delete an item name
  delete: async (id: number): Promise<void> => {
    const token = getAuthToken();
    await axios.delete(`${API_URL}/item-names/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
