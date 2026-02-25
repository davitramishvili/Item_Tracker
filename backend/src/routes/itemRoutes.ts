import { Router } from 'express';
import {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  searchItems,
  getItemsByCategory,
} from '../controllers/itemController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All item routes require authentication
router.use(authenticate);

// Get all items for the authenticated user
router.get('/', getItems);

// Search items
router.get('/search', searchItems);

// Get items by category
router.get('/category/:category', getItemsByCategory);

// Get a single item by ID
router.get('/:id', getItem);

// Create a new item
router.post('/', createItem);

// Update an item
router.put('/:id', updateItem);

// Delete an item
router.delete('/:id', deleteItem);

export default router;
