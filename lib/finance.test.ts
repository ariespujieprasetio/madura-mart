import { describe, expect, it } from 'vitest';
import {
  calculateBalanceStatus,
  calculateCartTotals,
  calculateChange,
  reconcileShift,
  summarizeCashFlow,
  summarizeReceivables,
} from './finance';

describe('calculateCartTotals', () => {
  it('counts subtotal, discount, and total correctly', () => {
    const items = [
      { quantity: 2, unitPrice: 7000, discount: 0 },
      { quantity: 1, unitPrice: 4000, discount: 1000 },
    ];

    expect(calculateCartTotals(items)).toEqual({
      subtotal: 18000,
      discount: 1000,
      total: 17000,
    });
  });
});

describe('calculateChange', () => {
  it('returns the proper cash back when customers pay more than total', () => {
    expect(calculateChange(47500, 50000)).toBe(2500);
  });

  it('does not allow negative change for underpayment', () => {
    expect(calculateChange(47500, 40000)).toBe(0);
  });
});

describe('calculateBalanceStatus', () => {
  it('computes receivable and payable remaining balance correctly', () => {
    expect(calculateBalanceStatus(235000, 75000)).toEqual({
      total: 235000,
      paid: 75000,
      remaining: 160000,
      status: 'BELUM LUNAS',
    });

    expect(calculateBalanceStatus(50000, 50000)).toEqual({
      total: 50000,
      paid: 50000,
      remaining: 0,
      status: 'LUNAS',
    });
  });
});

describe('summarizeCashFlow', () => {
  it('calculates net cash, ending cash, and margin percent correctly', () => {
    expect(
      summarizeCashFlow({
        sales: 2000000,
        purchases: 1100000,
        expenses: 280000,
        initialCash: 500000,
      }),
    ).toEqual({
      sales: 2000000,
      purchases: 1100000,
      expenses: 280000,
      netCash: 620000,
      endingCash: 1120000,
      marginPercent: 31,
    });
  });
});

describe('reconcileShift', () => {
  it('calculates expected cash, difference and status accurately', () => {
    const result = reconcileShift({
      cashStart: 500000,
      cashSales: 125000,
      cashIn: 15000,
      cashOut: 20000,
      actualCash: 580000,
    });

    expect(result).toEqual({
      expectedCash: 620000,
      difference: -40000,
      status: 'shortage',
    });
  });
});

describe('summarizeReceivables', () => {
  it('aggregates total receivables, paid amount, remaining balance, and open count correctly', () => {
    expect(
      summarizeReceivables([
        { total: 235000, paid: 75000 },
        { total: 180000, paid: 180000 },
        { total: 65000, paid: 18000 },
      ]),
    ).toEqual({
      total: 480000,
      paid: 273000,
      remaining: 207000,
      openCount: 2,
      paidCount: 1,
    });
  });
});
