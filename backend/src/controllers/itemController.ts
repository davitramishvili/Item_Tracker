import { Request, Response } from 'express';
import { ItemModel } from '../models/Item';
import { HistoryModel } from '../models/History';
import { ItemNameModel } from '../models/ItemName';

// Get all items for the authenticated user
export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const items = await ItemModel.findByUserId(userId);
    res.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

// Get a single item by ID
export const getItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.id);

    const item = await ItemModel.findById(itemId, userId);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

// Create a new item
export const createItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, description, quantity, category, price_per_unit, currency, purchase_price, purchase_currency, skipDuplicateCheck } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Item name is required' });
      return;
    }

    // Check for duplicate item (same name and category) unless skipDuplicateCheck is true
    if (!skipDuplicateCheck && category) {
      const existingItems = await ItemModel.findByUserId(userId);
      const duplicate = existingItems.find(
        item => item.name === name.trim() && item.category === category.trim()
      );

      if (duplicate) {
        // Return duplicate found response - frontend will handle the confirmation
        res.status(409).json({
          error: 'Duplicate item found',
          duplicate: duplicate,
          message: 'An item with this name already exists in this status'
        });
        return;
      }
    }

    const item = await ItemModel.create({
      user_id: userId,
      name: name.trim(),
      description: description?.trim(),
      quantity: quantity || 1,
      category: category?.trim(),
      price_per_unit: price_per_unit || 0,
      currency: currency || 'USD',
      purchase_price: purchase_price || 0,
      purchase_currency: purchase_currency || currency || 'USD',
    });

    // Add item name to item_names table for autocomplete
    await ItemNameModel.addName(userId, name.trim());

    res.status(201).json({ message: 'Item created successfully', item });
  } catch (error: any) {
    console.error('Create item error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to create item', details: error.message });
  }
};

// Update an item
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.id);
    const updates = req.body;

    // Check if item exists
    const existingItem = await ItemModel.findById(itemId, userId);
    if (!existingItem) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    // Track quantity changes
    if (updates.quantity !== undefined && updates.quantity !== existingItem.quantity) {
      await HistoryModel.createHistoryEntry({
        item_id: itemId,
        user_id: userId,
        quantity_before: existingItem.quantity || 0,
        quantity_after: updates.quantity,
        change_amount: updates.quantity - (existingItem.quantity || 0)
      });
    }

    // Trim string fields
    if (updates.name) updates.name = updates.name.trim();
    if (updates.description) updates.description = updates.description.trim();
    if (updates.category) updates.category = updates.category.trim();
    if (updates.image_url) updates.image_url = updates.image_url.trim();
    if (updates.location) updates.location = updates.location.trim();

    const item = await ItemModel.update(itemId, userId, updates);
    res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

// Delete an item
export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.id);

    const deleted = await ItemModel.delete(itemId, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

// Search items
export const searchItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = req.query.q as string;

    if (!query || query.trim() === '') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const items = await ItemModel.search(userId, query.trim());
    res.json({ items });
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
};

// Get items by category
export const getItemsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const category = req.params.category;

    const items = await ItemModel.findByCategory(userId, category);
    res.json({ items });
  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({ error: 'Failed to fetch items by category' });
  }
};
