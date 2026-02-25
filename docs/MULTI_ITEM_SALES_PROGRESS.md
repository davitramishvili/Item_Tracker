# Multi-Item Sales Implementation Progress

## ✅ COMPLETED

### Database
- ✅ Created `sale_groups` table with buyer info and sale date
- ✅ Added `sale_group_id` and `returned_at` columns to `sales` table
- ✅ Created migration script (`migrate-existing-sales.js`) - works on local & AWS
- ✅ Migrated all 11 existing sales to new structure (each in its own group)

### Backend Models
- ✅ Created `SaleGroup` model (backend/src/models/SaleGroup.ts)
- ✅ Updated `Sale` interface with `sale_group_id` and `returned_at` fields
- ✅ Created `CreateMultiItemSaleData` interface
- ✅ Added `SaleModel.createMultiItem()` - creates sale group + multiple items with transaction
- ✅ Added `SaleModel.findGroupedByDate()` - retrieves sales grouped by sale_group_id
- ✅ Updated `SaleModel.markAsReturned()` to track `returned_at` timestamp

### Backend Controllers & Routes
- ✅ Created `createMultiItemSale()` controller
  - Validates all items before creating sale
  - Creates sale group + individual sales in transaction
  - Reduces inventory for all items
- ✅ Updated `getSalesByDate()` to return grouped sales
- ✅ Added `/api/sales/multi` POST endpoint

### Frontend Services & Types
- ✅ Updated `Sale` interface with new fields (`sale_group_id`, `returned_at`)
- ✅ Created `SaleGroup` interface
- ✅ Created `CreateMultiItemSaleData` interface
- ✅ Added `saleService.createMultiItem()` method
- ✅ Updated `saleService.getByDate()` return type to `SaleGroup[]`

---

## 🚧 IN PROGRESS / TODO

### Frontend UI - Dashboard Sell Modal
**Status:** Not started
**Location:** `frontend/src/pages/Dashboard.tsx` (lines 1023-1155)

**Changes needed:**
1. Add "Multi-item sale" checkbox toggle
2. When multi-item enabled:
   - Show main buyer info fields (shared)
   - Show "Add Item" button
   - For each additional item:
     - Item selector dropdown (only in_stock items)
     - Quantity input
     - Sale price input
     - Notes textarea (individual)
     - Remove button
3. Calculate and display:
   - Individual item totals
   - Grand total
4. Update submit handler to call appropriate endpoint

### Frontend UI - Sales History Display
**Status:** Not started
**Location:** `frontend/src/pages/History.tsx` (lines 548-629)

**Current issue:** Code expects `Sale[]` but now receives `SaleGroup[]`

**Changes needed:**
1. Update state type from `Sale[]` to `SaleGroup[]`
2. Display sales as expandable groups:
   - Collapsed: Show "Sale (X items)" with grand total
   - Expanded: Show all items in the group
3. Show group-level buyer info
4. Show individual item details with status
5. Display `returned_at` timestamp for returned items
6. Show both individual and grand totals

### Individual Item Operations
**Status:** Not started

**Changes needed:**
1. Edit individual items within a group
2. Return individual items (not whole group)
3. Delete individual items from a group
4. Handle empty groups after last item deleted

---

## Data Structure Examples

### Single-item Sale (Backward Compatible)
```json
{
  "group_id": 1,
  "buyer_name": "John Doe",
  "buyer_phone": "555-1234",
  "notes": "Customer notes",
  "sale_date": "2025-10-09",
  "created_at": "2025-10-09T10:30:00",
  "items": [
    {
      "id": 1,
      "item_id": 5,
      "item_name": "Widget",
      "quantity_sold": 2,
      "sale_price": 10.50,
      "total_amount": 21.00,
      "currency": "USD",
      "status": "active",
      "returned_at": null
    }
  ]
}
```

### Multi-item Sale
```json
{
  "group_id": 2,
  "buyer_name": "Jane Smith",
  "buyer_phone": "555-5678",
  "notes": "Bulk order",
  "sale_date": "2025-10-09",
  "created_at": "2025-10-09T14:15:00",
  "items": [
    {
      "id": 2,
      "item_id": 5,
      "item_name": "Widget",
      "quantity_sold": 5,
      "sale_price": 10.00,
      "total_amount": 50.00,
      "currency": "USD",
      "notes": "Bulk discount applied",
      "status": "active",
      "returned_at": null
    },
    {
      "id": 3,
      "item_id": 8,
      "item_name": "Gadget",
      "quantity_sold": 3,
      "sale_price": 25.00,
      "total_amount": 75.00,
      "currency": "EUR",
      "notes": null,
      "status": "returned",
      "returned_at": "2025-10-10T09:00:00"
    }
  ]
}
```

---

## Next Steps

1. Update Dashboard sell modal UI for multi-item selection
2. Update History page to display grouped sales
3. Implement individual item edit/return/delete functionality
4. Test all scenarios:
   - Create single-item sale (backward compatibility)
   - Create multi-item sale
   - Edit individual items
   - Return individual items
   - Delete individual items
   - Mixed currency sales
5. Update any translation strings needed

---

## Migration Instructions (AWS)

1. Upload new migration scripts:
   ```bash
   scp backend/create-sale-groups-table.js ubuntu@YOUR-IP:~/Item_Tracker/backend/
   scp backend/migrate-existing-sales.js ubuntu@YOUR-IP:~/Item_Tracker/backend/
   ```

2. SSH into EC2 and run:
   ```bash
   cd ~/Item_Tracker/backend
   node create-sale-groups-table.js
   node migrate-existing-sales.js
   ```

3. Deploy updated code:
   ```bash
   cd ~/Item_Tracker
   git pull origin development
   cd backend && npm install && npm run build
   pm2 restart item-tracker-api
   cd ../frontend && npm install && npm run build
   sudo cp -r dist/* /var/www/html/
   ```
