import { Request, Response } from 'express';
import { SaleModel, CreateSaleData, UpdateSaleData, CreateMultiItemSaleData } from '../models/Sale';
import { SaleGroupModel } from '../models/SaleGroup';
import { ItemModel } from '../models/Item';

// Create a new sale
export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { item_id, quantity_sold, sale_price, buyer_name, buyer_phone, notes, sale_date } = req.body;

    if (!item_id || !quantity_sold || !sale_price) {
      res.status(400).json({ error: 'Item ID, quantity sold, and sale price are required' });
      return;
    }

    // Get the item to verify stock and get details
    const item = await ItemModel.findById(item_id, userId);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    // Verify item is in stock
    if (item.category !== 'in_stock') {
      res.status(400).json({ error: 'Can only sell items that are in stock' });
      return;
    }

    // Verify sufficient quantity
    if ((item.quantity || 0) < quantity_sold) {
      res.status(400).json({ error: `Insufficient stock. Available: ${item.quantity || 0}` });
      return;
    }

    // Create sale using multi-item structure (single item in a group)
    const saleData: CreateMultiItemSaleData = {
      user_id: userId,
      buyer_name,
      buyer_phone,
      notes,
      sale_date: sale_date || new Date().toISOString().split('T')[0],
      items: [{
        item_id: item.id!,
        item_name: item.name,
        quantity_sold: parseInt(quantity_sold),
        sale_price: parseFloat(sale_price),
        currency: item.currency || 'USD',
        notes: notes || null
      }]
    };

    const saleGroupId = await SaleModel.createMultiItem(saleData);

    // Reduce item quantity
    const newQuantity = (item.quantity || 0) - quantity_sold;
    await ItemModel.update(item_id, userId, { quantity: newQuantity });

    res.status(201).json({
      message: 'Sale created successfully',
      saleGroupId,
      newQuantity
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
};

// Create a multi-item sale
export const createMultiItemSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { items, buyer_name, buyer_phone, notes, sale_date } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one item is required' });
      return;
    }

    // Validate all items before creating the sale
    for (const itemData of items) {
      if (!itemData.item_id || !itemData.quantity_sold || !itemData.sale_price) {
        res.status(400).json({ error: 'Each item must have item_id, quantity_sold, and sale_price' });
        return;
      }

      const item = await ItemModel.findById(itemData.item_id, userId);
      if (!item) {
        res.status(404).json({ error: `Item with ID ${itemData.item_id} not found` });
        return;
      }

      if (item.category !== 'in_stock') {
        res.status(400).json({ error: `${item.name} is not in stock` });
        return;
      }

      if ((item.quantity || 0) < itemData.quantity_sold) {
        res.status(400).json({ error: `Insufficient stock for ${item.name}. Available: ${item.quantity || 0}` });
        return;
      }
    }

    // Get full item details and prepare data
    const itemsWithDetails = await Promise.all(
      items.map(async (itemData: any) => {
        const item = await ItemModel.findById(itemData.item_id, userId);
        return {
          item_id: item!.id!,
          item_name: item!.name,
          quantity_sold: parseInt(itemData.quantity_sold),
          sale_price: parseFloat(itemData.sale_price),
          currency: item!.currency || 'USD',
          notes: itemData.notes || null
        };
      })
    );

    const saleData: CreateMultiItemSaleData = {
      user_id: userId,
      buyer_name,
      buyer_phone,
      notes,
      sale_date: sale_date || new Date().toISOString().split('T')[0],
      items: itemsWithDetails
    };

    const saleGroupId = await SaleModel.createMultiItem(saleData);

    // Reduce quantities for all items
    for (const itemData of items) {
      const item = await ItemModel.findById(itemData.item_id, userId);
      if (item) {
        const newQuantity = (item.quantity || 0) - itemData.quantity_sold;
        await ItemModel.update(itemData.item_id, userId, { quantity: newQuantity });
      }
    }

    res.status(201).json({
      message: 'Multi-item sale created successfully',
      saleGroupId
    });
  } catch (error) {
    console.error('Create multi-item sale error:', error);
    res.status(500).json({ error: 'Failed to create multi-item sale' });
  }
};

// Get sales by date (grouped)
export const getSalesByDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { date } = req.query;

    console.log('📅 getSalesByDate called - userId:', userId, 'date:', date);

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Date is required' });
      return;
    }

    const salesGroups = await SaleModel.findGroupedByDate(userId, date);
    console.log('✅ Found', salesGroups.length, 'sale groups');
    res.json({ sales: salesGroups });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

// Update a sale
export const updateSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const saleId = parseInt(req.params.id);
    const { quantity_sold, sale_price, buyer_name, buyer_phone, notes, sale_date } = req.body;

    const sale = await SaleModel.findById(saleId, userId);
    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    // If quantity is being updated, verify stock availability
    if (quantity_sold !== undefined && quantity_sold !== sale.quantity_sold) {
      const item = await ItemModel.findById(sale.item_id, userId);
      if (!item) {
        res.status(404).json({ error: 'Associated item not found' });
        return;
      }

      const quantityDifference = quantity_sold - sale.quantity_sold;
      if ((item.quantity || 0) < quantityDifference) {
        res.status(400).json({ error: `Insufficient stock for this change. Available: ${item.quantity || 0}` });
        return;
      }

      // Adjust item quantity
      const newQuantity = (item.quantity || 0) - quantityDifference;
      await ItemModel.update(sale.item_id, userId, { quantity: newQuantity });
    }

    const updateData: UpdateSaleData = {
      quantity_sold: quantity_sold !== undefined ? parseInt(quantity_sold) : undefined,
      sale_price: sale_price !== undefined ? parseFloat(sale_price) : undefined,
      buyer_name,
      buyer_phone,
      notes,
      sale_date
    };

    const updated = await SaleModel.update(saleId, userId, updateData);
    if (!updated) {
      res.status(400).json({ error: 'Failed to update sale' });
      return;
    }

    const updatedSale = await SaleModel.findById(saleId, userId);
    res.json({ message: 'Sale updated successfully', sale: updatedSale });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
};

// Return a sale
export const returnSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const saleId = parseInt(req.params.id);
    const { add_to_stock } = req.body; // boolean: true = add back to stock, false = discard

    const sale = await SaleModel.findById(saleId, userId);
    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    if (sale.status === 'returned') {
      res.status(400).json({ error: 'Sale already returned' });
      return;
    }

    // Mark sale as returned
    await SaleModel.markAsReturned(saleId, userId);

    // If adding back to stock, increase item quantity
    if (add_to_stock === true) {
      const item = await ItemModel.findById(sale.item_id, userId);
      if (item) {
        const newQuantity = (item.quantity || 0) + sale.quantity_sold;
        await ItemModel.update(sale.item_id, userId, { quantity: newQuantity });
      }
    }

    res.json({
      message: add_to_stock ? 'Sale returned and stock restored' : 'Sale returned (item discarded)',
      addedToStock: add_to_stock
    });
  } catch (error) {
    console.error('Return sale error:', error);
    res.status(500).json({ error: 'Failed to return sale' });
  }
};

// Delete a sale
export const deleteSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const saleId = parseInt(req.params.id);

    const deleted = await SaleModel.delete(saleId, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
};
