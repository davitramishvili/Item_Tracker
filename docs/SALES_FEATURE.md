# Sales Feature Implementation Progress

## ✅ Completed

### Backend
- ✅ Created `sales` database table (run `node backend/create-sales-table.js`)
- ✅ Created Sale model (`backend/src/models/Sale.ts`)
- ✅ Created Sale controller (`backend/src/controllers/saleController.ts`)
- ✅ Created Sale routes (`backend/src/routes/saleRoutes.ts`)
- ✅ Registered routes in server.ts

### Frontend
- ✅ Created sale service (`frontend/src/services/saleService.ts`)
- ✅ Added English translations
- ✅ Added Georgian translations

## 🚧 In Progress / To Do

### Dashboard Changes
- Add "Sell" button to item cards (only for items in_stock)
- Create Sell Modal with fields:
  - Quantity sold (with max validation)
  - Sale price (pre-filled from item price_per_unit)
  - Buyer name (optional)
  - Buyer phone (optional)
  - Notes (optional)
  - Sale date (default: today)

### History Page Changes
- Add tab switcher: "Snapshots" | "Sales"
- Create Sales view showing sales for selected date
- Add Edit/Return/Delete buttons for each sale
- Create Return Modal (Add to stock / Discard choice)
- Create Edit Sale Modal
- Add delete button to snapshot items

## API Endpoints

```
POST   /api/sales              - Create sale
GET    /api/sales?date=YYYY-MM-DD  - Get sales by date
PUT    /api/sales/:id          - Update sale
POST   /api/sales/:id/return   - Return sale
DELETE /api/sales/:id          - Delete sale
```

## Database Schema

```sql
sales table:
- id, user_id, item_id, item_name
- quantity_sold, sale_price, total_amount, currency
- buyer_name, buyer_phone, notes
- sale_date, status (active/returned)
- created_at, updated_at
```
