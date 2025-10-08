import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Sale {
  id: number;
  user_id: number;
  item_id: number;
  item_name: string;
  quantity_sold: number;
  sale_price: number;
  total_amount: number;
  currency: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  notes: string | null;
  sale_date: string;
  status: 'active' | 'returned';
  created_at: string;
  updated_at: string;
}

export interface CreateSaleData {
  item_id: number;
  quantity_sold: number;
  sale_price: number;
  buyer_name?: string;
  buyer_phone?: string;
  notes?: string;
  sale_date?: string;
}

export interface UpdateSaleData {
  quantity_sold?: number;
  sale_price?: number;
  buyer_name?: string;
  buyer_phone?: string;
  notes?: string;
  sale_date?: string;
}

const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const saleService = {
  // Create a new sale
  create: async (data: CreateSaleData): Promise<any> => {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/sales`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get sales by date
  getByDate: async (date: string): Promise<Sale[]> => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/sales?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.sales;
  },

  // Update a sale
  update: async (id: number, data: UpdateSaleData): Promise<Sale> => {
    const token = getAuthToken();
    const response = await axios.put(`${API_URL}/sales/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.sale;
  },

  // Return a sale
  returnSale: async (id: number, addToStock: boolean): Promise<any> => {
    const token = getAuthToken();
    const response = await axios.post(
      `${API_URL}/sales/${id}/return`,
      { add_to_stock: addToStock },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Delete a sale
  delete: async (id: number): Promise<void> => {
    const token = getAuthToken();
    await axios.delete(`${API_URL}/sales/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
