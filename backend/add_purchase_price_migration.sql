-- Migration to add purchase price fields to items table
-- Run this script to add purchase_price and purchase_currency columns

USE item_tracker;

-- Add purchase_price column (default to 0 for existing items)
ALTER TABLE items
ADD COLUMN purchase_price DECIMAL(10, 2) DEFAULT 0 AFTER price_per_unit;

-- Add purchase_currency column (default to USD for existing items)
ALTER TABLE items
ADD COLUMN purchase_currency ENUM('GEL', 'USD') DEFAULT 'USD' AFTER purchase_price;

-- Update existing items to have purchase_price = 0 and purchase_currency matching their selling currency
UPDATE items SET purchase_currency = currency WHERE purchase_currency IS NULL;

-- Verify the changes
SELECT 'Migration completed successfully!' as message;
SELECT COUNT(*) as total_items FROM items;
