/**
 * Unit tests for date validation logic used in saleController.ts
 * Tests the pure validation functions without DB dependencies.
 */

// ─── Logic extracted from saleController.ts ─────────────────────────────────

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateFormat(date: string): boolean {
  return DATE_REGEX.test(date);
}

function isValidDateRange(startDate: string, endDate: string): boolean {
  return new Date(startDate) <= new Date(endDate);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Date format validation', () => {
  it('accepts valid YYYY-MM-DD format', () => {
    expect(isValidDateFormat('2026-01-15')).toBe(true);
    expect(isValidDateFormat('2000-12-31')).toBe(true);
    expect(isValidDateFormat('2099-01-01')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidDateFormat('01-15-2026')).toBe(false); // MM-DD-YYYY
    expect(isValidDateFormat('2026/01/15')).toBe(false); // slashes
    expect(isValidDateFormat('20260115')).toBe(false);   // no separators
    expect(isValidDateFormat('2026-1-5')).toBe(false);   // no leading zeros
    expect(isValidDateFormat('')).toBe(false);
    expect(isValidDateFormat('not-a-date')).toBe(false);
  });
});

describe('Date range validation', () => {
  it('accepts valid range (start before end)', () => {
    expect(isValidDateRange('2026-01-01', '2026-01-31')).toBe(true);
  });

  it('accepts same start and end date', () => {
    expect(isValidDateRange('2026-01-15', '2026-01-15')).toBe(true);
  });

  it('rejects range where start is after end', () => {
    expect(isValidDateRange('2026-02-01', '2026-01-01')).toBe(false);
  });

  it('handles month boundary correctly', () => {
    expect(isValidDateRange('2026-01-31', '2026-02-01')).toBe(true);
    expect(isValidDateRange('2026-02-01', '2026-01-31')).toBe(false);
  });

  it('handles year boundary correctly', () => {
    expect(isValidDateRange('2025-12-31', '2026-01-01')).toBe(true);
    expect(isValidDateRange('2026-01-01', '2025-12-31')).toBe(false);
  });
});

describe('All-sales date preset', () => {
  // The "all" preset uses '2000-01-01' to '2099-12-31' as a wide range
  const ALL_START = '2000-01-01';
  const ALL_END = '2099-12-31';

  it('all-sales date range is valid', () => {
    expect(isValidDateFormat(ALL_START)).toBe(true);
    expect(isValidDateFormat(ALL_END)).toBe(true);
    expect(isValidDateRange(ALL_START, ALL_END)).toBe(true);
  });
});
