import { promisePool } from '../config/database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface ItemName {
  id: number;
  user_id: number;
  name: string;
  created_at: Date;
}

export class ItemNameModel {
  // Get all item names for a user
  static async findByUserId(userId: number): Promise<ItemName[]> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT * FROM item_names WHERE user_id = ? ORDER BY name ASC',
      [userId]
    );
    return rows as ItemName[];
  }

  // Add a new item name (case-insensitive, trimmed)
  static async addName(userId: number, name: string): Promise<void> {
    const trimmedName = name.trim();

    // Check if name already exists (case-insensitive)
    const [existing] = await promisePool.query<RowDataPacket[]>(
      'SELECT id FROM item_names WHERE user_id = ? AND LOWER(name) = LOWER(?)',
      [userId, trimmedName]
    );

    // Only insert if it doesn't exist
    if (existing.length === 0) {
      await promisePool.query(
        'INSERT INTO item_names (user_id, name) VALUES (?, ?)',
        [userId, trimmedName]
      );
    }
  }

  // Update an item name and all items using that name
  static async updateName(id: number, userId: number, name: string): Promise<{success: boolean, oldName?: string}> {
    const trimmedName = name.trim();

    // Get the current name before updating
    const [current] = await promisePool.query<RowDataPacket[]>(
      'SELECT name FROM item_names WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (current.length === 0) {
      return { success: false };
    }

    const oldName = current[0].name;

    // Check if another name with the same value exists (case-insensitive, excluding current id)
    const [existing] = await promisePool.query<RowDataPacket[]>(
      'SELECT id FROM item_names WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?',
      [userId, trimmedName, id]
    );

    // If duplicate exists, return false
    if (existing.length > 0) {
      return { success: false };
    }

    // Update the name in item_names table
    const [result] = await promisePool.query<ResultSetHeader>(
      'UPDATE item_names SET name = ? WHERE id = ? AND user_id = ?',
      [trimmedName, id, userId]
    );

    if (result.affectedRows === 0) {
      return { success: false };
    }

    // Update all items with the old name to the new name
    await promisePool.query(
      'UPDATE items SET name = ? WHERE user_id = ? AND name = ?',
      [trimmedName, userId, oldName]
    );

    return { success: true, oldName };
  }

  // Delete an item name
  static async deleteName(id: number, userId: number): Promise<boolean> {
    const [result] = await promisePool.query<ResultSetHeader>(
      'DELETE FROM item_names WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  // Delete an item name by name string
  static async deleteByName(userId: number, name: string): Promise<boolean> {
    const [result] = await promisePool.query<ResultSetHeader>(
      'DELETE FROM item_names WHERE user_id = ? AND LOWER(name) = LOWER(?)',
      [userId, name.trim()]
    );
    return result.affectedRows > 0;
  }
}
