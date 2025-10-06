import { promisePool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface ItemHistory {
  id?: number;
  item_id: number;
  user_id: number;
  quantity_before: number;
  quantity_after: number;
  change_amount: number;
  changed_at?: Date;
}

export interface ItemSnapshot {
  id?: number;
  item_id: number;
  user_id: number;
  name: string;
  quantity: number;
  price_per_unit?: number;
  currency?: 'GEL' | 'USD';
  category?: string;
  snapshot_date: string; // YYYY-MM-DD format
  snapshot_type: 'auto' | 'manual';
  created_at?: Date;
}

export class HistoryModel {
  // Create history entry when quantity changes
  static async createHistoryEntry(data: Omit<ItemHistory, 'id' | 'changed_at'>): Promise<ItemHistory> {
    const [result] = await promisePool.execute<ResultSetHeader>(
      'INSERT INTO item_history (item_id, user_id, quantity_before, quantity_after, change_amount) VALUES (?, ?, ?, ?, ?)',
      [data.item_id, data.user_id, data.quantity_before, data.quantity_after, data.change_amount]
    );

    const [rows] = await promisePool.execute<RowDataPacket[]>(
      'SELECT * FROM item_history WHERE id = ?',
      [result.insertId]
    );

    return rows[0] as ItemHistory;
  }

  // Get history for a specific item
  static async getItemHistory(itemId: number, userId: number): Promise<ItemHistory[]> {
    const [rows] = await promisePool.execute<RowDataPacket[]>(
      'SELECT * FROM item_history WHERE item_id = ? AND user_id = ? ORDER BY changed_at DESC',
      [itemId, userId]
    );

    return rows as ItemHistory[];
  }

  // Create or update daily snapshot
  static async createSnapshot(data: Omit<ItemSnapshot, 'id' | 'created_at'>): Promise<ItemSnapshot> {
    // Try to insert, if exists update (ON DUPLICATE KEY UPDATE)
    await promisePool.execute(
      `INSERT INTO item_snapshots
        (item_id, user_id, name, quantity, price_per_unit, currency, category, snapshot_date, snapshot_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        quantity = VALUES(quantity),
        price_per_unit = VALUES(price_per_unit),
        currency = VALUES(currency),
        category = VALUES(category),
        snapshot_type = VALUES(snapshot_type),
        created_at = CURRENT_TIMESTAMP`,
      [
        data.item_id,
        data.user_id,
        data.name,
        data.quantity,
        data.price_per_unit,
        data.currency,
        data.category,
        data.snapshot_date,
        data.snapshot_type
      ]
    );

    const [rows] = await promisePool.execute<RowDataPacket[]>(
      'SELECT * FROM item_snapshots WHERE item_id = ? AND snapshot_date = ?',
      [data.item_id, data.snapshot_date]
    );

    return rows[0] as ItemSnapshot;
  }

  // Create snapshots for all items of a user
  static async createUserSnapshots(userId: number, snapshotType: 'auto' | 'manual' = 'auto'): Promise<number> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const [items] = await promisePool.execute<RowDataPacket[]>(
      'SELECT * FROM items WHERE user_id = ?',
      [userId]
    );

    let count = 0;
    for (const item of items) {
      await this.createSnapshot({
        item_id: item.id,
        user_id: userId,
        name: item.name,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        currency: item.currency,
        category: item.category,
        snapshot_date: today,
        snapshot_type: snapshotType
      });
      count++;
    }

    return count;
  }

  // Get snapshots for a specific item
  static async getItemSnapshots(itemId: number, userId: number): Promise<ItemSnapshot[]> {
    const [rows] = await promisePool.execute<RowDataPacket[]>(
      'SELECT * FROM item_snapshots WHERE item_id = ? AND user_id = ? ORDER BY snapshot_date DESC',
      [itemId, userId]
    );

    return rows as ItemSnapshot[];
  }

  // Get all snapshots for a specific date
  static async getUserSnapshotsByDate(userId: number, date: string): Promise<ItemSnapshot[]> {
    const [rows] = await promisePool.execute<RowDataPacket[]>(
      'SELECT * FROM item_snapshots WHERE user_id = ? AND snapshot_date = ? ORDER BY name ASC',
      [userId, date]
    );

    return rows as ItemSnapshot[];
  }

  // Check if snapshot exists for today
  static async hasSnapshotToday(userId: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await promisePool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM item_snapshots WHERE user_id = ? AND snapshot_date = ?',
      [userId, today]
    );

    return (rows[0] as any).count > 0;
  }
}
