import { promisePool } from '../config/database';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Item {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
  quantity?: number;
  price_per_unit?: number;
  currency?: 'GEL' | 'USD';
  category?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class ItemModel {
  // Get all items for a user
  static async findByUserId(userId: number): Promise<Item[]> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows as Item[];
  }

  // Get a single item by ID
  static async findById(itemId: number, userId: number): Promise<Item | null> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT * FROM items WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );
    return rows.length > 0 ? (rows[0] as Item) : null;
  }

  // Create a new item
  static async create(item: Item): Promise<Item> {
    const [result] = await promisePool.query<ResultSetHeader>(
      `INSERT INTO items (user_id, name, description, quantity, price_per_unit, currency, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        item.user_id,
        item.name,
        item.description || null,
        item.quantity || 1,
        item.price_per_unit || 0,
        item.currency || 'USD',
        item.category || null,
      ]
    );

    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT * FROM items WHERE id = ?',
      [result.insertId]
    );
    return rows[0] as Item;
  }

  // Update an item
  static async update(itemId: number, userId: number, updates: Partial<Item>): Promise<Item | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(updates.quantity);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.price_per_unit !== undefined) {
      fields.push('price_per_unit = ?');
      values.push(updates.price_per_unit);
    }
    if (updates.currency !== undefined) {
      fields.push('currency = ?');
      values.push(updates.currency);
    }

    if (fields.length === 0) {
      return this.findById(itemId, userId);
    }

    values.push(itemId, userId);

    await promisePool.query(
      `UPDATE items SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return this.findById(itemId, userId);
  }

  // Delete an item
  static async delete(itemId: number, userId: number): Promise<boolean> {
    const [result] = await promisePool.query<ResultSetHeader>(
      'DELETE FROM items WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );
    return result.affectedRows > 0;
  }

  // Search items
  static async search(userId: number, query: string): Promise<Item[]> {
    const searchTerm = `%${query}%`;
    const [rows] = await promisePool.query<RowDataPacket[]>(
      `SELECT * FROM items
       WHERE user_id = ?
       AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR location LIKE ?)
       ORDER BY created_at DESC`,
      [userId, searchTerm, searchTerm, searchTerm, searchTerm]
    );
    return rows as Item[];
  }

  // Get items by category
  static async findByCategory(userId: number, category: string): Promise<Item[]> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT * FROM items WHERE user_id = ? AND category = ? ORDER BY created_at DESC',
      [userId, category]
    );
    return rows as Item[];
  }
}
