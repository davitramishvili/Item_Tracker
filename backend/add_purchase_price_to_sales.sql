-- Migration to add purchase_price column to sales table
-- This will allow us to track the purchase cost at the time of sale
-- Run this script on your AWS database

USE item_tracker;

-- Add purchase_price column to sales table
ALTER TABLE sales
ADD COLUMN purchase_price DECIMAL(10, 2) DEFAULT 0 AFTER sale_price;

-- Update existing sales with purchase_price from items table where possible
UPDATE sales s
INNER JOIN items i ON s.item_id = i.id
SET s.purchase_price = i.purchase_price
WHERE s.item_id IS NOT NULL;

-- Verify the changes
SELECT 'Migration completed successfully!' as message;
SELECT COUNT(*) as total_sales_with_purchase_price
FROM sales
WHERE purchase_price > 0;
