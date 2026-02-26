/**
 * Unit tests for Sale statistics calculation logic
 *
 * Tests the pure calculation logic extracted from saleController.ts
 * (the getSalesByDateRange statistics aggregation).
 * Does not require a database connection.
 */

// ─── Types (mirrored from controller) ────────────────────────────────────────

interface StatRow {
  total_sales: string;
  total_items_sold: string;
  total_revenue: string;
  total_cost: string;
  currency: string;
}

interface Statistics {
  totalItemsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  byCurrency: {
    currency: string;
    itemsSold: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];
}

// ─── Logic extracted from saleController.ts ─────────────────────────────────

function buildStatistics(stats: StatRow[]): Statistics {
  let totalItemsSold = 0;
  let totalRevenue = 0;
  let totalCost = 0;

  for (const stat of stats) {
    totalItemsSold += parseInt(stat.total_items_sold) || 0;
    totalRevenue += parseFloat(stat.total_revenue) || 0;
    totalCost += parseFloat(stat.total_cost) || 0;
  }

  const totalProfit = totalRevenue - totalCost;

  return {
    totalItemsSold,
    totalRevenue,
    totalCost,
    totalProfit,
    byCurrency: stats.map((stat) => ({
      currency: stat.currency,
      itemsSold: parseInt(stat.total_items_sold) || 0,
      revenue: parseFloat(stat.total_revenue) || 0,
      cost: parseFloat(stat.total_cost) || 0,
      profit:
        (parseFloat(stat.total_revenue) || 0) -
        (parseFloat(stat.total_cost) || 0),
    })),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildStatistics (saleController logic)', () => {
  it('returns zero totals when stats array is empty', () => {
    const result = buildStatistics([]);
    expect(result.totalItemsSold).toBe(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.totalProfit).toBe(0);
    expect(result.byCurrency).toHaveLength(0);
  });

  it('calculates totals correctly for a single currency', () => {
    const stats: StatRow[] = [
      {
        total_sales: '5',
        total_items_sold: '10',
        total_revenue: '500.00',
        total_cost: '300.00',
        currency: 'USD',
      },
    ];

    const result = buildStatistics(stats);
    expect(result.totalItemsSold).toBe(10);
    expect(result.totalRevenue).toBe(500);
    expect(result.totalCost).toBe(300);
    expect(result.totalProfit).toBe(200);
    expect(result.byCurrency).toHaveLength(1);
    expect(result.byCurrency[0].currency).toBe('USD');
    expect(result.byCurrency[0].profit).toBe(200);
  });

  it('aggregates totals across multiple currencies', () => {
    const stats: StatRow[] = [
      {
        total_sales: '3',
        total_items_sold: '6',
        total_revenue: '600.00',
        total_cost: '400.00',
        currency: 'GEL',
      },
      {
        total_sales: '2',
        total_items_sold: '4',
        total_revenue: '200.00',
        total_cost: '100.00',
        currency: 'USD',
      },
    ];

    const result = buildStatistics(stats);
    expect(result.totalItemsSold).toBe(10);
    expect(result.totalRevenue).toBe(800);
    expect(result.totalCost).toBe(500);
    expect(result.totalProfit).toBe(300);
    expect(result.byCurrency).toHaveLength(2);
  });

  it('handles null/missing purchase_price (cost = 0)', () => {
    const stats: StatRow[] = [
      {
        total_sales: '1',
        total_items_sold: '2',
        total_revenue: '100.00',
        total_cost: '0.00', // purchase_price was NULL → COALESCE returns 0
        currency: 'USD',
      },
    ];

    const result = buildStatistics(stats);
    expect(result.totalCost).toBe(0);
    expect(result.totalProfit).toBe(100);
  });

  it('handles string numbers from MySQL (DECIMAL → string in JSON)', () => {
    const stats: StatRow[] = [
      {
        total_sales: '1',
        total_items_sold: '3',
        total_revenue: '150.50',
        total_cost: '75.25',
        currency: 'USD',
      },
    ];

    const result = buildStatistics(stats);
    expect(result.totalRevenue).toBeCloseTo(150.5);
    expect(result.totalCost).toBeCloseTo(75.25);
    expect(result.totalProfit).toBeCloseTo(75.25);
  });
});
