export type CartItemInput = {
  quantity: number;
  unitPrice: number;
  discount?: number;
};

export function calculateCartTotals(items: CartItemInput[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const discount = items.reduce(
    (sum, item) => sum + (item.discount ?? 0),
    0,
  );

  const total = Math.max(subtotal - discount, 0);

  return { subtotal, discount, total };
}

export function calculateChange(total: number, paid: number) {
  if (paid < total) {
    return 0;
  }

  return paid - total;
}

export function calculateBalanceStatus(total: number, paid: number) {
  const remaining = Math.max(total - paid, 0);
  const status = remaining === 0 ? 'LUNAS' : 'BELUM LUNAS';

  return {
    total,
    paid,
    remaining,
    status,
  };
}

export function summarizeReceivables(items: Array<{ total: number; paid: number }>) {
  const total = items.reduce((sum, item) => sum + Number(item.total ?? 0), 0);
  const paid = items.reduce((sum, item) => sum + Number(item.paid ?? 0), 0);
  const remaining = Math.max(total - paid, 0);
  const openCount = items.filter((item) => Number(item.total ?? 0) > Number(item.paid ?? 0)).length;
  const paidCount = items.length - openCount;

  return {
    total,
    paid,
    remaining,
    openCount,
    paidCount,
  };
}

export function summarizeCashFlow({
  sales,
  purchases,
  expenses,
  initialCash,
}: {
  sales: number;
  purchases: number;
  expenses: number;
  initialCash: number;
}) {
  const netCash = sales - purchases - expenses;
  const endingCash = initialCash + netCash;
  const marginPercent = sales > 0 ? (netCash / sales) * 100 : 0;

  return {
    sales,
    purchases,
    expenses,
    netCash,
    endingCash,
    marginPercent,
  };
}

export function reconcileShift({
  cashStart,
  cashSales,
  cashIn,
  cashOut,
  actualCash,
}: {
  cashStart: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  actualCash: number;
}) {
  const expectedCash = cashStart + cashSales + cashIn - cashOut;
  const difference = actualCash - expectedCash;
  const status = difference > 0 ? 'surplus' : difference < 0 ? 'shortage' : 'balanced';

  return {
    expectedCash,
    difference,
    status,
  };
}
