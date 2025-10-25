import { Router } from 'express';
import { createSale, createMultiItemSale, getSalesByDate, getSalesByDateRange, updateSale, returnSale, deleteSale } from '../controllers/saleController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a multi-item sale (must come before '/')
router.post('/multi', createMultiItemSale);

// Create a new sale
router.post('/', createSale);

// Get sales by date range (must come before '/')
router.get('/range', getSalesByDateRange);

// Get sales by date
router.get('/', getSalesByDate);

// Update a sale
router.put('/:id', updateSale);

// Return a sale
router.post('/:id/return', returnSale);

// Delete a sale
router.delete('/:id', deleteSale);

export default router;
