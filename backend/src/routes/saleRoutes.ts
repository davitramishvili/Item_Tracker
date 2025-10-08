import { Router } from 'express';
import { createSale, createMultiItemSale, getSalesByDate, updateSale, returnSale, deleteSale } from '../controllers/saleController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new sale
router.post('/', createSale);

// Create a multi-item sale
router.post('/multi', createMultiItemSale);

// Get sales by date
router.get('/', getSalesByDate);

// Update a sale
router.put('/:id', updateSale);

// Return a sale
router.post('/:id/return', returnSale);

// Delete a sale
router.delete('/:id', deleteSale);

export default router;
