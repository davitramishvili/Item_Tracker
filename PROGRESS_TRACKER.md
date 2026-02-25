# Leri Item Tracker - Progress Tracker

This file tracks planned, in-progress, and completed work. If a session runs out of tokens, resume here.

---

## How to Resume

1. Read this file first to understand current state
2. Read `CLAUDE_PROJECT_GUIDE.md` for project overview
3. Continue from the "In Progress" or next "Planned" task

---

## Session Log

### Session: 2026-02-26

**Context:** User asked to:
1. Review project for issues
2. Write unit tests
3. Fix total cost bug in Sales dashboard (broken when filtering by category/product name)
4. Rewrite README to be more human-like and up to date
5. Create this tracking file

---

## Completed

### [DONE] Fix: purchase_price missing from grouped sale queries
- **Root Cause:** `findGroupedByDate` and `findGroupedByDateRange` SQL queries in `backend/src/models/Sale.ts` were missing `s.purchase_price` from the SELECT clause and the result mapping
- **Effect:** When user filtered sales by product name (category), client-side statistics recalculated cost from items but `item.purchase_price` was always `undefined → 0`, showing $0 cost
- **Fix applied:** Added `s.purchase_price` to SELECT and `purchase_price: row.purchase_price` to both query methods in Sale.ts (working tree had this fix already uncommitted)
- **Status:** Fix was already in working tree - cleaned up debug logs and committed

### [DONE] Clean up debug console.logs from production code
- Removed debug `console.log` statements from `saleController.ts`
- Removed newly added debug `console.log` statements from `Sales.tsx`
- Kept `console.error` statements for real error logging

### [DONE] Create PROGRESS_TRACKER.md (this file)

### [DONE] Create MEMORY.md

### [DONE] Rewrite README.md

### [DONE] Write unit tests (backend)

---

## In Progress

_(nothing currently)_

---

## Planned / Remaining

### Remaining Known Issues (from CLAUDE_PROJECT_GUIDE.md)

#### Low Priority
- [ ] **Field Naming Inconsistency:** `is_verified` vs `email_verified` in User model
- [ ] **Migration Files Scattered:** SQL files in backend root should move to `backend/src/config/migrations/`

### Potential Improvements Identified
- [ ] Add index on `sale_date` column in sales table (performance for large datasets)
- [ ] Add `purchase_currency` to sales table to properly track multi-currency costs
- [ ] The profit calculation assumes all purchase prices are USD - clarify design intent

---

## Bug Analysis: Total Cost Bug

**File:** `frontend/src/pages/Sales.tsx` + `backend/src/models/Sale.ts`

**When filtering by date only:**
- `filteredStatistics === statistics` (from server via `getStatsByDateRange`)
- Server uses: `SUM(s.quantity_sold * COALESCE(s.purchase_price, 0))` → CORRECT

**When filtering by product name (category):**
- `filteredStatistics` recalculates from `filteredSales` items
- Uses: `item.purchase_price` from each sale item
- BUG: `purchase_price` was NOT included in the SQL SELECT of `findGroupedByDateRange`
- Result: `item.purchase_price` was `undefined` → `Number(undefined || 0) = 0` → cost always 0

**Fix:** Add `s.purchase_price` to both SQL queries in `Sale.ts` and map it in result objects.

---

## Project Health Summary

| Area | Status | Notes |
|------|--------|-------|
| Authentication | ✅ Good | JWT + Google OAuth working |
| Item Management | ✅ Good | CRUD + categories working |
| Sales (date filter) | ✅ Good | Statistics work correctly |
| Sales (category filter) | ✅ Fixed | purchase_price bug fixed |
| History/Snapshots | ✅ Good | Daily snapshots working |
| Tests | ✅ Added | Unit tests for Sale model and controller |
| README | ✅ Rewritten | More human-friendly |
| Console.logs | ✅ Cleaned | Debug logs removed from controllers |

---

## File Map (Key Files)

| File | Purpose |
|------|---------|
| `backend/src/models/Sale.ts` | DB queries for sales - **was buggy here** |
| `backend/src/controllers/saleController.ts` | Request handlers - had debug logs |
| `frontend/src/pages/Sales.tsx` | Main sales UI with filter logic |
| `frontend/src/services/saleService.ts` | API service layer |
| `backend/src/config/schema.sql` | Database schema (up to date) |
| `CLAUDE_PROJECT_GUIDE.md` | Project guide for Claude |
| `README.md` | User-facing docs |

---

*Last updated: 2026-02-26*
