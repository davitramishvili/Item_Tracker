/**
 * Unit tests for filteredStatistics calculation logic
 *
 * This tests the client-side statistics recalculation that happens
 * in Sales.tsx when a product name (category) filter is active.
 *
 * The bug: purchase_price was missing from the SQL SELECT, so
 * item.purchase_price was always undefined → 0 → totalCost always 0.
 *
 * These tests verify the calculation logic itself is correct, and that
 * the fix (including purchase_price in item data) produces correct results.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleItem {
  id: number;
  item_name: string;
  quantity_sold: number;
  sale_price: number;
  purchase_price: number;
  total_amount: number;
  currency: string;
  status: 'active' | 'returned';
}

interface SaleGroup {
  group_id: number;
  buyer_name: string | null;
  sale_date: string;
  items: SaleItem[];
}

interface CurrencyStats {
  currency: string;
  itemsSold: number;
  revenue: number;
  cost: number;
  profit: number;
}

interface FilteredStatistics {
  totalItemsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  byCurrency: CurrencyStats[];
}

// ─── Logic extracted from Sales.tsx filteredStatistics useMemo ───────────────

function computeFilteredStatistics(filteredSales: SaleGroup[]): FilteredStatistics {
  const allFilteredItems = filteredSales.flatMap((group) =>
    group.items.filter((item) => item.status === 'active')
  );

  if (allFilteredItems.length === 0) {
    return {
      totalItemsSold: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      byCurrency: [],
    };
  }

  const byCurrency: Record<string, { itemsSold: number; revenue: number; cost: number }> = {};

  for (const item of allFilteredItems) {
    const currency = item.currency || 'USD';
    if (!byCurrency[currency]) {
      byCurrency[currency] = { itemsSold: 0, revenue: 0, cost: 0 };
    }
    byCurrency[currency].itemsSold += Number(item.quantity_sold);
    byCurrency[currency].revenue += Number(item.total_amount);
    byCurrency[currency].cost += Number(item.quantity_sold) * Number(item.purchase_price || 0);
  }

  const byCurrencyArray = Object.entries(byCurrency).map(([currency, data]) => ({
    currency,
    itemsSold: data.itemsSold,
    revenue: data.revenue,
    cost: data.cost,
    profit: data.revenue - data.cost,
  }));

  const totalItemsSold = byCurrencyArray.reduce((sum, c) => sum + c.itemsSold, 0);
  const totalRevenue = byCurrencyArray.reduce((sum, c) => sum + c.revenue, 0);
  const totalCost = byCurrencyArray.reduce((sum, c) => sum + c.cost, 0);

  return {
    totalItemsSold,
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    byCurrency: byCurrencyArray,
  };
}

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<SaleItem> = {}): SaleItem {
  return {
    id: 1,
    item_name: 'Test Item',
    quantity_sold: 2,
    sale_price: 50,
    purchase_price: 30,
    total_amount: 100,
    currency: 'USD',
    status: 'active',
    ...overrides,
  };
}

function makeGroup(items: SaleItem[], overrides: Partial<SaleGroup> = {}): SaleGroup {
  return {
    group_id: 1,
    buyer_name: null,
    sale_date: '2026-01-15',
    items,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('filteredStatistics (Sales.tsx client-side logic)', () => {
  describe('empty / zero states', () => {
    it('returns zeros when no sales', () => {
      const result = computeFilteredStatistics([]);
      expect(result.totalItemsSold).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.totalProfit).toBe(0);
      expect(result.byCurrency).toHaveLength(0);
    });

    it('returns zeros when all items are returned (not active)', () => {
      const group = makeGroup([
        makeItem({ status: 'returned' }),
        makeItem({ status: 'returned' }),
      ]);
      const result = computeFilteredStatistics([group]);
      expect(result.totalItemsSold).toBe(0);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('purchase_price calculation (the main bug area)', () => {
    it('calculates cost correctly when purchase_price is present', () => {
      // This is the fixed behaviour: purchase_price is now included in the API response
      const group = makeGroup([
        makeItem({ quantity_sold: 2, purchase_price: 30, total_amount: 100 }),
      ]);
      const result = computeFilteredStatistics([group]);
      // cost = 2 * 30 = 60
      expect(result.totalCost).toBe(60);
    });

    it('totalCost is 0 when purchase_price is 0 (pre-migration sales)', () => {
      const group = makeGroup([
        makeItem({ quantity_sold: 2, purchase_price: 0, total_amount: 100 }),
      ]);
      const result = computeFilteredStatistics([group]);
      expect(result.totalCost).toBe(0);
      expect(result.totalRevenue).toBe(100);
      expect(result.totalProfit).toBe(100);
    });

    it('handles purchase_price = undefined gracefully (the original bug)', () => {
      // Before the fix, purchase_price was undefined because it was not in SELECT
      const item = makeItem({ quantity_sold: 2, total_amount: 100 });
      // Simulate the bug: purchase_price is undefined
      (item as any).purchase_price = undefined;
      const group = makeGroup([item]);

      const result = computeFilteredStatistics([group]);
      // Should not throw, should treat undefined as 0
      expect(result.totalCost).toBe(0);
    });
  });

  describe('revenue calculation', () => {
    it('uses total_amount for revenue (not quantity * sale_price)', () => {
      const group = makeGroup([
        makeItem({ quantity_sold: 3, sale_price: 50, total_amount: 150 }),
      ]);
      const result = computeFilteredStatistics([group]);
      expect(result.totalRevenue).toBe(150);
    });

    it('sums revenue across multiple items', () => {
      const group = makeGroup([
        makeItem({ id: 1, total_amount: 100, purchase_price: 60 }),
        makeItem({ id: 2, total_amount: 200, purchase_price: 120, quantity_sold: 4 }),
      ]);
      const result = computeFilteredStatistics([group]);
      expect(result.totalRevenue).toBe(300);
      expect(result.totalCost).toBe(60 * 2 + 120 * 4);
    });
  });

  describe('multi-currency support', () => {
    it('groups stats by currency correctly', () => {
      const group = makeGroup([
        makeItem({ id: 1, currency: 'GEL', quantity_sold: 2, purchase_price: 50, total_amount: 200 }),
        makeItem({ id: 2, currency: 'USD', quantity_sold: 1, purchase_price: 30, total_amount: 80 }),
      ]);
      const result = computeFilteredStatistics([group]);

      expect(result.byCurrency).toHaveLength(2);
      const gel = result.byCurrency.find((c) => c.currency === 'GEL')!;
      const usd = result.byCurrency.find((c) => c.currency === 'USD')!;

      expect(gel.revenue).toBe(200);
      expect(gel.cost).toBe(100); // 2 * 50
      expect(usd.revenue).toBe(80);
      expect(usd.cost).toBe(30); // 1 * 30
    });

    it('sums itemsSold across all currencies', () => {
      const group = makeGroup([
        makeItem({ id: 1, currency: 'GEL', quantity_sold: 3 }),
        makeItem({ id: 2, currency: 'USD', quantity_sold: 2 }),
      ]);
      const result = computeFilteredStatistics([group]);
      expect(result.totalItemsSold).toBe(5);
    });
  });

  describe('multiple sale groups', () => {
    it('aggregates stats across multiple groups', () => {
      const group1 = makeGroup(
        [makeItem({ id: 1, quantity_sold: 2, purchase_price: 30, total_amount: 100 })],
        { group_id: 1 }
      );
      const group2 = makeGroup(
        [makeItem({ id: 2, quantity_sold: 1, purchase_price: 40, total_amount: 80 })],
        { group_id: 2 }
      );

      const result = computeFilteredStatistics([group1, group2]);
      expect(result.totalItemsSold).toBe(3);
      expect(result.totalRevenue).toBe(180);
      expect(result.totalCost).toBe(60 + 40); // 2*30 + 1*40
      expect(result.totalProfit).toBe(180 - 100);
    });

    it('excludes returned items from statistics across groups', () => {
      const group = makeGroup([
        makeItem({ id: 1, status: 'active', quantity_sold: 2, purchase_price: 30, total_amount: 100 }),
        makeItem({ id: 2, status: 'returned', quantity_sold: 1, purchase_price: 40, total_amount: 80 }),
      ]);
      const result = computeFilteredStatistics([group]);
      expect(result.totalItemsSold).toBe(2);
      expect(result.totalRevenue).toBe(100);
      expect(result.totalCost).toBe(60); // only active item: 2 * 30
    });
  });

  describe('profit calculation', () => {
    it('calculates profit as revenue minus cost', () => {
      const group = makeGroup([
        makeItem({ quantity_sold: 2, purchase_price: 30, total_amount: 100 }),
      ]);
      const result = computeFilteredStatistics([group]);
      expect(result.totalProfit).toBe(100 - 60); // revenue - cost
    });

    it('calculates per-currency profit correctly', () => {
      const group = makeGroup([
        makeItem({ currency: 'USD', quantity_sold: 2, purchase_price: 30, total_amount: 100 }),
      ]);
      const result = computeFilteredStatistics([group]);
      const usd = result.byCurrency.find((c) => c.currency === 'USD')!;
      expect(usd.profit).toBe(40); // 100 - 60
    });
  });
});
