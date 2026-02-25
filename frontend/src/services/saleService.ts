import api from './api';

export interface Sale {
  id: number;
  user_id: number;
  sale_group_id: number | null;
  item_id: number;
  item_name: string;
  quantity_sold: number;
  sale_price: number;
  purchase_price: number;
  total_amount: number;
  currency: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  notes: string | null;
  sale_date: string;
  status: 'active' | 'returned';
  returned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleGroup {
  group_id: number;
  buyer_name: string | null;
  buyer_phone: string | null;
  notes: string | null;
  sale_date: string;
  created_at: string;
  items: Sale[];
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

export interface CreateMultiItemSaleData {
  buyer_name?: string;
  buyer_phone?: string;
  notes?: string;
  sale_date?: string;
  items: {
    item_id: number;
    quantity_sold: number;
    sale_price: number;
    notes?: string;
  }[];
}

export interface UpdateSaleData {
  quantity_sold?: number;
  sale_price?: number;
  buyer_name?: string;
  buyer_phone?: string;
  notes?: string;
  sale_date?: string;
}

export interface SaleStatistics {
  totalItemsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  byCurrency: {
    currency: string;
    itemsSold: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];
}

export interface SalesDateRangeResponse {
  sales: SaleGroup[];
  statistics: SaleStatistics;
}

export const saleService = {
  // Create a new sale
  create: async (data: CreateSaleData): Promise<any> => {
    const response = await api.post('/sales', data);
    return response.data;
  },

  // Create a multi-item sale
  createMultiItem: async (data: CreateMultiItemSaleData): Promise<any> => {
    const response = await api.post('/sales/multi', data);
    return response.data;
  },

  // Get sales by date (returns grouped sales)
  getByDate: async (date: string): Promise<SaleGroup[]> => {
    const response = await api.get(`/sales?date=${date}`);
    return response.data.sales;
  },

  // Get sales by date range with statistics
  getByDateRange: async (startDate: string, endDate: string): Promise<SalesDateRangeResponse> => {
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const response = await api.get(`/sales/range?startDate=${startDate}&endDate=${endDate}&_t=${timestamp}`);
    return response.data;
  },

  // Update a sale
  update: async (id: number, data: UpdateSaleData): Promise<Sale> => {
    const response = await api.put(`/sales/${id}`, data);
    return response.data.sale;
  },

  // Return a sale
  returnSale: async (id: number, addToStock: boolean): Promise<any> => {
    const response = await api.post(`/sales/${id}/return`, { add_to_stock: addToStock });
    return response.data;
  },

  // Delete a sale
  delete: async (id: number): Promise<void> => {
    await api.delete(`/sales/${id}`);
  },
};
