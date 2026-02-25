import express from 'express';
import {
  getItemHistory,
  getItemSnapshots,
  createManualSnapshot,
  getSnapshotsByDate,
  checkSnapshotToday,
  deleteSnapshot
} from '../controllers/historyController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get history for specific item
router.get('/item/:itemId', getItemHistory);

// Get snapshots for specific item
router.get('/snapshots/item/:itemId', getItemSnapshots);

// Create manual snapshot
router.post('/snapshot', createManualSnapshot);

// Get snapshots for specific date
router.get('/snapshots/date/:date', getSnapshotsByDate);

// Check if snapshot exists for today
router.get('/snapshot/today', checkSnapshotToday);

// Delete a snapshot
router.delete('/snapshot/:snapshotId', deleteSnapshot);

export default router;
