import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesCrm from './SalesCrm';
import { salesApi } from './api';
afterEach(() => vi.unstubAllGlobals());
describe('CRM salesperson workflow', () => {
  it('creates from only a name, opens NEW detail and logs first approach', async () => {
    const user = userEvent.setup(); let stage = 'NEW'; const o = { id: 1, accountId: 1, stage, state: 'ACTIVE', origin: 'NEW_CUSTOMER', priority: 'NORMAL', ownerId: 1, version: 0 };
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      if (path.endsWith('/capabilities')) return Response.json({ userId: 1, permissions: ['CREATE', 'VIEW', 'EDIT'] });
      if (path.endsWith('/eligible-owners')) return Response.json([{ id: 1, email: 'sales@test.invalid' }]);
      if (path.endsWith('/prospects')) { expect(JSON.parse(String(init?.body)).name).toBe('Name only prospect'); return Response.json(o); }
      if (path.endsWith('/activities')) { expect(JSON.parse(String(init?.body)).type).toBe('CALL'); stage = 'OUTREACH'; return Response.json({ id: 1 }); }
      if (path.endsWith('/opportunities/1')) return Response.json({ opportunity: { ...o, stage }, account: { id: 1, name: 'Name only prospect' }, products: [], tasks: [], memberships: [] });
      if (path.endsWith('/health')) return Response.json({ daysInStage: 0, daysSinceInteraction: null, stale: false, noNextAction: true, waitingOverdue: false });
      return Response.json({ content: [], totalPages: 0, totalElements: 0 });
    });
    vi.stubGlobal('fetch', fetcher); render(<SalesCrm api="http://test.invalid/api" token="test" onExpired={() => {}} />);
    await user.click(await screen.findByRole('button', { name: '+ Add prospect' }));
    await user.type(screen.getByLabelText('Company / Prospect name'), 'Name only prospect'); await user.click(screen.getByRole('button', { name: 'Create prospect' }));
    await screen.findByRole('heading', { name: /Name only prospect/ });
    const form = screen.getByRole('heading', { name: 'Log contact attempt' }).closest('form')!;
    await user.click(form.querySelector('button')!); await waitFor(() => expect(stage).toBe('OUTREACH'));
    await waitFor(() => expect(screen.getByText(/New customer · Outreach/)).toBeTruthy());
  });
  it('retains the create idempotency key after a transport failure', async () => {
    const headers: HeadersInit[] = []; const fetcher = vi.fn(async (_url: string, init?: RequestInit) => { headers.push(init!.headers!); if (headers.length === 1) throw new Error('Connection dropped'); return Response.json({ id: 1 }); });
    vi.stubGlobal('fetch', fetcher); const request = salesApi('http://test.invalid/api', 'token', () => {}); const body = { name: 'Retry' };
    await expect(request('/prospects', 'POST', body)).rejects.toThrow('Connection dropped'); await request('/prospects', 'POST', body);
    expect(new Headers(headers[0]).get('Idempotency-Key')).toBe(new Headers(headers[1]).get('Idempotency-Key'));
  });
});
