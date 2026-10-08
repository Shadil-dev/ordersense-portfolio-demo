export interface ForecastInput {
  productId: string;
  productName: string;
  customerStatus: string;
  preferredVendor: string | null;
  manufacturer: string | null;
  costPrice: number | null;
  avgQty: number | null;
  avgDaysBetweenOrders: number | null;
}

export interface PurchaseForecastRow {
  productId: string;
  productName: string;
  preferredVendor: string | null;
  manufacturer: string | null;
  costPrice: number;
  totalQty: number;
  totalCost: number;
}

// Input is the shared, already-eligible predictions array, never a separate snapshot.
export function buildPurchaseForecastRows(predictions: readonly ForecastInput[], days: number, includeInactive: boolean): PurchaseForecastRow[] {
  const products = new Map<string, PurchaseForecastRow>();
  for (const prediction of predictions) {
    if (!includeInactive && prediction.customerStatus?.toLowerCase() !== 'active') continue;
    const cycle = prediction.avgDaysBetweenOrders;
    if (prediction.avgQty === null || cycle === null || cycle <= 0) continue;
    // Match the API: daily rate to 8 places, final product totals to 2 places.
    const volume = Number((prediction.avgQty / cycle).toFixed(8)) * days;
    const cost = prediction.costPrice ?? 0;
    const row = products.get(prediction.productId) ?? {
      productId: prediction.productId, productName: prediction.productName,
      preferredVendor: prediction.preferredVendor ?? prediction.manufacturer,
      manufacturer: prediction.manufacturer, costPrice: cost, totalQty: 0, totalCost: 0,
    };
    row.totalQty += volume;
    row.totalCost += volume * cost;
    products.set(prediction.productId, row);
  }
  return [...products.values()].map(row => ({ ...row, totalQty: Number(row.totalQty.toFixed(2)), totalCost: Number(row.totalCost.toFixed(2)) }));
}
