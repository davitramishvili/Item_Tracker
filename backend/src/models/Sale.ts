import { promisePool } from '../config/database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

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
  created_at: Date;
  updated_at: Date;
}

export interface CreateSaleData {
  user_id: number;
  item_id: number;
  item_name: string;
  quantity_sold: number;
  sale_price: number;
  currency: string;
  buyer_name?: string;
  buyer_phone?: string;
  notes?: string;
  sale_date: string;
}

export interface UpdateSaleData {
  quantity_sold?: number;
  sale_price?: number;
  buyer_name?: string;
  buyer_phone?: string;
  notes?: string;
  sale_date?: string;
}

export class SaleModel {
  // Create a new sale
  static async create(data: CreateSaleData): Promise<number> {
    const total_amount = data.quantity_sold * data.sale_price;

    const [result] = await promisePool.query<ResultSetHeader>(
      `INSERT INTO sales
        (user_id, item_id, item_name, quantity_sold, sale_price, total_amount, currency, buyer_name, buyer_phone, notes, sale_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.item_id,
        data.item_name,
        data.quantity_sold,
        data.sale_price,
        total_amount,
        data.currency,
        data.buyer_name || null,
        data.buyer_phone || null,
        data.notes || null,
        data.sale_date
      ]
    );

    return result.insertId;
  }

  // Get all sales for a user by date
  static async findByDate(userId: number, saleDate: string): Promise<Sale[]> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT * FROM sales WHERE user_id = ? AND sale_date = ? ORDER BY created_at DESC',
      [userId, saleDate]
    );
    return rows as Sale[];
  }

  // Get a single sale by ID
  static async findById(id: number, userId: number): Promise<Sale | null> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT * FROM sales WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows.length > 0 ? (rows[0] as Sale) : null;
  }

  // Update a sale
  static async update(id: number, userId: number, data: UpdateSaleData): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.quantity_sold !== undefined) {
      updates.push('quantity_sold = ?');
      values.push(data.quantity_sold);
    }
    if (data.sale_price !== undefined) {
      updates.push('sale_price = ?');
      values.push(data.sale_price);
    }
    if (data.quantity_sold !== undefined || data.sale_price !== undefined) {
      // Recalculate total_amount if either quantity or price changed
      const sale = await this.findById(id, userId);
      if (sale) {
        const newQuantity = data.quantity_sold ?? sale.quantity_sold;
        const newPrice = data.sale_price ?? sale.sale_price;
        updates.push('total_amount = ?');
        values.push(newQuantity * newPrice);
      }
    }
    if (data.buyer_name !== undefined) {
      updates.push('buyer_name = ?');
      values.push(data.buyer_name || null);
    }
    if (data.buyer_phone !== undefined) {
      updates.push('buyer_phone = ?');
      values.push(data.buyer_phone || null);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes || null);
    }
    if (data.sale_date !== undefined) {
      updates.push('sale_date = ?');
      values.push(data.sale_date);
    }

    if (updates.length === 0) return false;

    values.push(id, userId);

    const [result] = await promisePool.query<ResultSetHeader>(
      `UPDATE sales SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Mark sale as returned
  static async markAsReturned(id: number, userId: number): Promise<boolean> {
    const [result] = await promisePool.query<ResultSetHeader>(
      'UPDATE sales SET status = ? WHERE id = ? AND user_id = ?',
      ['returned', id, userId]
    );
    return result.affectedRows > 0;
  }

  // Delete a sale
  static async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await promisePool.query<ResultSetHeader>(
      'DELETE FROM sales WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  // Get sales statistics for a user
  static async getStatsByDateRange(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<any> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_sales,
        SUM(quantity_sold) as total_items_sold,
        SUM(total_amount) as total_revenue,
        currency
       FROM sales
       WHERE user_id = ? AND sale_date BETWEEN ? AND ? AND status = 'active'
       GROUP BY currency`,
      [userId, startDate, endDate]
    );
    return rows;
  }
}
