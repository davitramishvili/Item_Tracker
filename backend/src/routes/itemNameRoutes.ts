import { Router } from 'express';
import { getItemNames, deleteItemName } from '../controllers/itemNameController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all item names for the user
router.get('/', getItemNames);

// Delete an item name
router.delete('/:id', deleteItemName);

export default router;
