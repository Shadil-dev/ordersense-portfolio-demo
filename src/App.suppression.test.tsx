import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const pair = {
  id: 1, customerId: 'c1', customerName: 'Alpha customer', customerStatus: 'active',
  productId: 'p1', productName: 'Shared product', manufacturer: 'Maker', preferredVendor: 'Vendor One',
  costPrice: 5, avgDaysBetweenOrders: 10, avgQty: 10, lastQtyOrdered: 10, predictedQty: 10,
  daysUntilPredicted: 2, lastOrderDate: '2026-09-20', predictedOrderDate: '2026-09-30',
  totalOrders: 3, cycleConfidence: 1, qtyConfidence: 1, qtyTrend: 'flat', alertSent: false,
  alertSentAt: null, updatedAt: '2026-09-20T12:00:00',
};
const other = { ...pair, id: 2, customerId: 'c2', customerName: 'Beta customer', avgQty: 20 };

describe('shared prediction lifecycle across actual application tabs', () => {
  let suppressed: boolean;
  let restored: boolean;
  let aggregateRequests: number;
  let modules: string[];
  let aggregateQuantity: number;
  beforeEach(() => {
    suppressed = false; restored = true; aggregateRequests = 0;
    modules = ['Reorder Forecasting', 'Monthly Product Consumption', 'Purchase Order Forecast', 'Sync & Predict'];
    aggregateQuantity = 60;
    localStorage.setItem('zestora_token', 'test-token');
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      let body: unknown;
      switch (url.pathname) {
        case '/api/me': body = { email: 'sales@example.test', globalAccessLevel: 'USER', permissions: [], visibleModules: modules }; break;
        case '/api/predictions': body = suppressed || !restored ? [other] : [pair, other]; break;
        case '/api/orders': body = 6; break;
        case '/api/predictions/suppress': suppressed = true; restored = false; body = {}; break;
        case '/api/predictions/reactivate': suppressed = false; body = {}; break;
        case '/api/predictions/suppressions': body = suppressed ? [{ ...pair, reason: 'Switched', createdByEmail: 'sales@example.test', createdAt: '2026-09-27T12:00:00' }] : []; break;
        case '/api/sync': restored = !suppressed; aggregateQuantity = 30; return new Response('Sync complete');
        case '/api/purchase-forecast': aggregateRequests++; body = [{ productId: 'p1', productName: 'Shared product', preferredVendor: 'Vendor One', manufacturer: 'Maker', costPrice: 5, totalQty: aggregateQuantity, totalCost: aggregateQuantity * 5 }]; break;
        default: throw new Error(`Unexpected request: ${url.pathname}`);
      }
      return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
    }));
  });

  it('updates customer consumption and product/vendor estimates on suppress and next-run reactivation without reload', async () => {
    const user = userEvent.setup(); render(<App />);
    const navigate = async (group: string, name: string) => {
      expect(['Sales', 'Planning']).toContain(group);
      await user.click(screen.getByRole('button', { name }));
    };
    await screen.findByRole('button', { name: 'Discontinue Shared product for Alpha customer' });
    const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const checkViews = async (alphaPresent: boolean) => {
      await navigate('Sales', 'Product Consumption');
      await waitFor(() => expect(Boolean(screen.queryByText('Alpha customer'))).toBe(alphaPresent));
      if (alphaPresent) {
        const card = screen.getByText('Alpha customer').closest('.customer-card')!;
        expect(within(card as HTMLElement).getByText(`${days} u`, { selector: "strong" })).toBeInTheDocument();
      }
      expect(screen.getByText('Beta customer')).toBeInTheDocument();
      await navigate('Planning', 'Purchase Forecast');
      await user.click(screen.getByRole('button', { name: 'PO Estimate by Product' }));
      const row = screen.getByText('ID: p1').closest('tr')!;
      expect(within(row).getByText(`${days * (alphaPresent ? 3 : 2)} units`)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'PO Estimate by Vendor' }));
      // Vendor item quantities and aggregate spend must change along with product totals.
      expect(screen.getByText(`Total Qty: ${days * (alphaPresent ? 3 : 2)} units`)).toBeInTheDocument();
      expect(screen.getByText(`${days * (alphaPresent ? 3 : 2)} u @ ₹5.00`)).toBeInTheDocument();
      expect(aggregateRequests).toBe(0);
    };
    await checkViews(true);
    await navigate('Sales', 'Reorder Forecasting');
    await user.click(screen.getByRole('button', { name: 'Discontinue Shared product for Alpha customer' }));
    await user.type(screen.getByLabelText('Reason (required)'), 'Switched product');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Discontinue' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await checkViews(false);
    await navigate('Sales', 'Reorder Forecasting');
    await user.click(screen.getByRole('button', { name: /Discontinued Items/ }));
    await user.click(await screen.findByRole('button', { name: 'Reactivate' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reactivate' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await checkViews(false); // Lifting suppression does not fabricate a forecast before calculation.
    await user.click(screen.getByRole('button', { name: 'Sync Zoho Inventory' }));
    await waitFor(() => expect(restored).toBe(true));
    await checkViews(true);
  });

  it('keeps aggregate-only access restricted and refreshes it after Sync & Predict', async () => {
    modules = ['Purchase Order Forecast', 'Sync & Predict'];
    const user = userEvent.setup(); render(<App />);
    await screen.findByText('60 units');
    const before = aggregateRequests;
    await user.click(screen.getByRole('button', { name: 'Sync Zoho Inventory' }));
    await screen.findByText('30 units');
    expect(aggregateRequests).toBeGreaterThan(before);
    const paths = vi.mocked(fetch).mock.calls.map(([input]) => new URL(String(input)).pathname);
    expect(paths).not.toContain('/api/predictions');
    expect(paths).not.toContain('/api/orders');
  });
});
