import { promisePool } from '../config/database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface SaleGroup {
  id: number;
  user_id: number;
  buyer_name: string | null;
  buyer_phone: string | null;
  notes: string | null;
  sale_date: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSaleGroupData {
  user_id: number;
  buyer_name?: string;
  buyer_phone?: string;
  notes?: string;
  sale_date: string;
}

export interface UpdateSaleGroupData {
  buyer_name?: string;
  buyer_phone?: string;
  notes?: string;
  sale_date?: string;
}

export class SaleGroupModel {
  // Create a new sale group
  static async create(data: CreateSaleGroupData): Promise<number> {
    const [result] = await promisePool.query<ResultSetHeader>(
      `INSERT INTO sale_groups
        (user_id, buyer_name, buyer_phone, notes, sale_date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.buyer_name || null,
        data.buyer_phone || null,
        data.notes || null,
        data.sale_date
      ]
    );

    return result.insertId;
  }

  // Get all sale groups for a user by date
  static async findByDate(userId: number, saleDate: string): Promise<SaleGroup[]> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT * FROM sale_groups WHERE user_id = ? AND sale_date = ? ORDER BY created_at DESC',
      [userId, saleDate]
    );
    return rows as SaleGroup[];
  }

  // Get a single sale group by ID
  static async findById(id: number, userId: number): Promise<SaleGroup | null> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT * FROM sale_groups WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows.length > 0 ? (rows[0] as SaleGroup) : null;
  }

  // Update a sale group
  static async update(id: number, userId: number, data: UpdateSaleGroupData): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

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
      `UPDATE sale_groups SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Delete a sale group (will cascade delete all sales in the group)
  static async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await promisePool.query<ResultSetHeader>(
      'DELETE FROM sale_groups WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}
