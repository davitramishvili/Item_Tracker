import { Router } from 'express';
import { getItemNames, updateItemName, deleteItemName } from '../controllers/itemNameController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all item names for the user
router.get('/', getItemNames);

// Update an item name
router.put('/:id', updateItemName);

// Delete an item name
router.delete('/:id', deleteItemName);

export default router;
