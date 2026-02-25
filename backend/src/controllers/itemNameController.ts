import { Request, Response } from 'express';
import { ItemNameModel } from '../models/ItemName';

// Get all item names for the authenticated user
export const getItemNames = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemNames = await ItemNameModel.findByUserId(userId);
    res.json({ itemNames });
  } catch (error) {
    console.error('Get item names error:', error);
    res.status(500).json({ error: 'Failed to fetch item names' });
  }
};

// Update an item name (and all items using that name)
export const updateItemName = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemNameId = parseInt(req.params.id);
    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const result = await ItemNameModel.updateName(itemNameId, userId, name.trim());
    if (!result.success) {
      res.status(404).json({ error: 'Item name not found or duplicate name' });
      return;
    }

    const itemNames = await ItemNameModel.findByUserId(userId);
    const updatedItem = itemNames.find(item => item.id === itemNameId);
    res.json({
      itemName: updatedItem,
      oldName: result.oldName,
      message: 'Item name and all related items updated successfully'
    });
  } catch (error) {
    console.error('Update item name error:', error);
    res.status(500).json({ error: 'Failed to update item name' });
  }
};

// Delete an item name
export const deleteItemName = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemNameId = parseInt(req.params.id);

    const deleted = await ItemNameModel.deleteName(itemNameId, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Item name not found' });
      return;
    }

    res.json({ message: 'Item name deleted successfully' });
  } catch (error) {
    console.error('Delete item name error:', error);
    res.status(500).json({ error: 'Failed to delete item name' });
  }
};
