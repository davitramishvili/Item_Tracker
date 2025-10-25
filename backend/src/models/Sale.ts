import { promisePool } from '../config/database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Sale {
  id: number;
  user_id: number;
  sale_group_id: number | null;
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
  returned_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSaleData {
  user_id: number;
  sale_group_id?: number;
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

export interface CreateMultiItemSaleData {
  user_id: number;
  buyer_name?: string;
  buyer_phone?: string;
  notes?: string;
  sale_date: string;
  items: {
    item_id: number;
    item_name: string;
    quantity_sold: number;
    sale_price: number;
    currency: string;
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

export class SaleModel {
  // Create a new sale
  static async create(data: CreateSaleData): Promise<number> {
    const total_amount = data.quantity_sold * data.sale_price;

    const [result] = await promisePool.query<ResultSetHeader>(
      `INSERT INTO sales
        (user_id, sale_group_id, item_id, item_name, quantity_sold, sale_price, total_amount, currency, buyer_name, buyer_phone, notes, sale_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.sale_group_id || null,
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

  // Create a multi-item sale (with sale group)
  static async createMultiItem(data: CreateMultiItemSaleData): Promise<number> {
    const connection = await promisePool.getConnection();

    try {
      await connection.beginTransaction();

      // Create the sale group
      const [groupResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO sale_groups (user_id, buyer_name, buyer_phone, notes, sale_date)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.user_id,
          data.buyer_name || null,
          data.buyer_phone || null,
          data.notes || null,
          data.sale_date
        ]
      );

      const saleGroupId = groupResult.insertId;

      // Create individual sale records for each item
      for (const item of data.items) {
        const total_amount = item.quantity_sold * item.sale_price;

        await connection.query<ResultSetHeader>(
          `INSERT INTO sales
            (user_id, sale_group_id, item_id, item_name, quantity_sold, sale_price, total_amount, currency, notes, sale_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.user_id,
            saleGroupId,
            item.item_id,
            item.item_name,
            item.quantity_sold,
            item.sale_price,
            total_amount,
            item.currency,
            item.notes || null,
            data.sale_date
          ]
        );
      }

      await connection.commit();
      return saleGroupId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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
      'UPDATE sales SET status = ?, returned_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      ['returned', id, userId]
    );
    return result.affectedRows > 0;
  }

  // Get sales grouped by sale_group_id for a specific date
  static async findGroupedByDate(userId: number, saleDate: string): Promise<any[]> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      `SELECT
        sg.id as group_id,
        sg.buyer_name as group_buyer_name,
        sg.buyer_phone as group_buyer_phone,
        sg.notes as group_notes,
        sg.sale_date,
        sg.created_at as group_created_at,
        s.*
       FROM sale_groups sg
       LEFT JOIN sales s ON sg.id = s.sale_group_id
       WHERE sg.user_id = ? AND sg.sale_date = ?
       ORDER BY sg.created_at DESC, s.id ASC`,
      [userId, saleDate]
    );

    // Group the results by sale_group_id
    const grouped = new Map();

    for (const row of rows) {
      const groupId = row.group_id;

      if (!grouped.has(groupId)) {
        grouped.set(groupId, {
          group_id: groupId,
          buyer_name: row.group_buyer_name,
          buyer_phone: row.group_buyer_phone,
          notes: row.group_notes,
          sale_date: row.sale_date,
          created_at: row.group_created_at,
          items: []
        });
      }

      if (row.id) { // Only add if there's an actual sale item
        grouped.get(groupId).items.push({
          id: row.id,
          user_id: row.user_id,
          sale_group_id: row.sale_group_id,
          item_id: row.item_id,
          item_name: row.item_name,
          quantity_sold: row.quantity_sold,
          sale_price: row.sale_price,
          total_amount: row.total_amount,
          currency: row.currency,
          notes: row.notes,
          status: row.status,
          returned_at: row.returned_at,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
      }
    }

    return Array.from(grouped.values());
  }

  // Get sales grouped by sale_group_id for a date range
  static async findGroupedByDateRange(userId: number, startDate: string, endDate: string): Promise<any[]> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      `SELECT
        sg.id as group_id,
        sg.buyer_name as group_buyer_name,
        sg.buyer_phone as group_buyer_phone,
        sg.notes as group_notes,
        sg.sale_date,
        sg.created_at as group_created_at,
        s.*
       FROM sale_groups sg
       LEFT JOIN sales s ON sg.id = s.sale_group_id
       WHERE sg.user_id = ? AND sg.sale_date BETWEEN ? AND ?
       ORDER BY sg.created_at DESC, s.id ASC`,
      [userId, startDate, endDate]
    );

    // Group the results by sale_group_id
    const grouped = new Map();

    for (const row of rows) {
      const groupId = row.group_id;

      if (!grouped.has(groupId)) {
        grouped.set(groupId, {
          group_id: groupId,
          buyer_name: row.group_buyer_name,
          buyer_phone: row.group_buyer_phone,
          notes: row.group_notes,
          sale_date: row.sale_date,
          created_at: row.group_created_at,
          items: []
        });
      }

      if (row.id) { // Only add if there's an actual sale item
        grouped.get(groupId).items.push({
          id: row.id,
          user_id: row.user_id,
          sale_group_id: row.sale_group_id,
          item_id: row.item_id,
          item_name: row.item_name,
          quantity_sold: row.quantity_sold,
          sale_price: row.sale_price,
          total_amount: row.total_amount,
          currency: row.currency,
          notes: row.notes,
          status: row.status,
          returned_at: row.returned_at,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
      }
    }

    return Array.from(grouped.values());
  }

  // Delete a sale
  static async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await promisePool.query<ResultSetHeader>(
      'DELETE FROM sales WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  // Get sales statistics for a user with purchase price for profit calculation
  static async getStatsByDateRange(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<any> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_sales,
        SUM(s.quantity_sold) as total_items_sold,
        SUM(s.total_amount) as total_revenue,
        SUM(s.quantity_sold * COALESCE(i.purchase_price, 0)) as total_cost,
        s.currency
       FROM sales s
       LEFT JOIN items i ON s.item_id = i.id
       WHERE s.user_id = ? AND s.sale_date BETWEEN ? AND ? AND s.status = 'active'
       GROUP BY s.currency`,
      [userId, startDate, endDate]
    );
    return rows;
  }
}
