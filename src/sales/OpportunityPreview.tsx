import { useEffect, useState } from 'react';
import type { Detail, salesApi } from './api';

type Request = ReturnType<typeof salesApi>;
const cache = new WeakMap<Request, Map<string, Promise<Detail>>>();
const words = (value: string) => value.replaceAll('_', ' ').toLowerCase();

/** Share one scoped request when a task, demo and notification reference the same record. */
export default function OpportunityPreview({ id, request, revision, people }: {
  id: number; request: Request; revision: number; people: { id: number; email: string }[];
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let live = true;
    let entries = cache.get(request);
    if (!entries) { entries = new Map(); cache.set(request, entries); }
    const key = `${revision}:${id}`;
    let pending = entries.get(key);
    if (!pending) {
      pending = request<Detail>(`/opportunities/${id}`);
      entries.set(key, pending);
      void pending.catch(() => entries?.delete(key));
    }
    void pending.then(d => { if (live) { setDetail(d); setUnavailable(false); } })
      .catch(() => { if (live) setUnavailable(true); });
    return () => { live = false; };
  }, [id, request, revision]);
  if (unavailable) return <small>Opportunity preview unavailable. Open the record to retry.</small>;
  if (!detail) return <small aria-live="polite">Loading opportunity preview…</small>;
  const o = detail.opportunity;
  const next = detail.tasks.filter(t => t.status === 'OPEN')
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  return <div className="crm-card-preview">
    <strong>{detail.account.name}</strong>
    <div className="crm-card-tags"><span>{words(o.stage)}</span><span data-state={o.state.toLowerCase()}>{words(o.state)}</span>
      <span>{o.origin === 'NEW_CUSTOMER' ? 'Acquisition' : 'Expansion'}</span><span>{o.leadDirection === 'INBOUND' ? 'Inbound' : o.leadDirection === 'OUTBOUND' ? 'Outbound' : 'Direction unknown'}</span>
      {o.priority !== 'NORMAL' && <span>{words(o.priority)}</span>}</div>
    <p className="crm-card-products">{detail.products.length ? detail.products.map(p =>
      `${p.description} · ${words(p.outcome)}${p.expectedMonthlyValue == null ? '' : ` · ₹${p.expectedMonthlyValue.toLocaleString('en-IN')}/month`}`
    ).join(' | ') : 'Products of interest not recorded yet'}</p>
    <small>Owner: {people.find(p => p.id === o.ownerId)?.email || o.ownerEmail || (o.ownerId ? `User ${o.ownerId}` : 'Unassigned intake')}</small>
    {next && <small>Next: {next.description.replaceAll('_', ' ').toLowerCase()} · {new Date(next.dueAt).toLocaleString()}</small>}
    {o.expectedResponseDate && <small>Customer reply expected: {new Date(`${o.expectedResponseDate}T00:00:00`).toLocaleDateString()}</small>}
  </div>;
}
