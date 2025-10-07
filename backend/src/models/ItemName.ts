import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface ItemName {
  id: number;
  user_id: number;
  name: string;
  created_at: Date;
}

export class ItemNameModel {
  // Get all item names for a user
  static async findByUserId(userId: number): Promise<ItemName[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM item_names WHERE user_id = ? ORDER BY name ASC',
      [userId]
    );
    return rows as ItemName[];
  }

  // Add a new item name (case-insensitive, trimmed)
  static async addName(userId: number, name: string): Promise<void> {
    const trimmedName = name.trim();

    // Check if name already exists (case-insensitive)
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM item_names WHERE user_id = ? AND LOWER(name) = LOWER(?)',
      [userId, trimmedName]
    );

    // Only insert if it doesn't exist
    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO item_names (user_id, name) VALUES (?, ?)',
        [userId, trimmedName]
      );
    }
  }

  // Delete an item name
  static async deleteName(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM item_names WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  // Delete an item name by name string
  static async deleteByName(userId: number, name: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM item_names WHERE user_id = ? AND LOWER(name) = LOWER(?)',
      [userId, name.trim()]
    );
    return result.affectedRows > 0;
  }
}
