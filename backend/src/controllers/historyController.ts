import { Request, Response } from 'express';
import { HistoryModel } from '../models/History';

// Get history for a specific item
export const getItemHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.itemId);

    const history = await HistoryModel.getItemHistory(itemId, userId);
    res.json({ history });
  } catch (error) {
    console.error('Get item history error:', error);
    res.status(500).json({ error: 'Failed to fetch item history' });
  }
};

// Get snapshots for a specific item
export const getItemSnapshots = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.itemId);

    const snapshots = await HistoryModel.getItemSnapshots(itemId, userId);
    res.json({ snapshots });
  } catch (error) {
    console.error('Get item snapshots error:', error);
    res.status(500).json({ error: 'Failed to fetch item snapshots' });
  }
};

// Create manual snapshot for all user items
export const createManualSnapshot = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Check if snapshot already exists for today
    const hasSnapshot = await HistoryModel.hasSnapshotToday(userId);

    const count = await HistoryModel.createUserSnapshots(userId, 'manual');

    res.json({
      message: hasSnapshot
        ? 'Snapshot updated successfully'
        : 'Snapshot created successfully',
      count,
      updated: hasSnapshot
    });
  } catch (error) {
    console.error('Create manual snapshot error:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
};

// Get user snapshots for a specific date
export const getSnapshotsByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const date = req.params.date; // YYYY-MM-DD format

    const snapshots = await HistoryModel.getUserSnapshotsByDate(userId, date);
    res.json({ snapshots, date });
  } catch (error) {
    console.error('Get snapshots by date error:', error);
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
};

// Check if snapshot exists for today
export const checkSnapshotToday = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const hasSnapshot = await HistoryModel.hasSnapshotToday(userId);

    res.json({ hasSnapshot, date: new Date().toISOString().split('T')[0] });
  } catch (error) {
    console.error('Check snapshot today error:', error);
    res.status(500).json({ error: 'Failed to check snapshot' });
  }
};
