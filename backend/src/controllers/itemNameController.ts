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
