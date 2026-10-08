import ResponsiveTable from './ResponsiveTable';
import { useEffect, useRef, useState } from 'react';
import { Ban, RotateCcw, X } from 'lucide-react';
import type { PredictionSuppression, AuditLogPage } from './App';

export interface PredictionPair {
  customerId: string;
  productId: string;
  customerName: string;
  productName: string;
}

interface Connection {
  api: string;
  token: string;
  onExpired: () => void;
}

async function request(connection: Connection, path: string, init?: RequestInit) {
  const response = await fetch(`${connection.api}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${connection.token}`, 'Content-Type': 'application/json' },
  });
  if (response.status === 401) connection.onExpired();
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail && !detail.startsWith('{') && !detail.startsWith('<')
      ? detail : `Unable to complete the request (${response.status}). Please try again.`);
  }
  return response;
}

export function SuppressionDialog(props: Connection & {
  pair: PredictionPair;
  action: 'suppress' | 'reactivate';
  onClose: () => void;
  onSaved: (pair: PredictionPair, action: 'suppress' | 'reactivate') => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const discontinue = props.action === 'suppress';
  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    element.showModal();
    return () => { element.close(); previousFocus?.focus(); };
  }, []);

  return <dialog ref={dialog} className="suppression-dialog" aria-labelledby="suppression-title"
    onCancel={event => { event.preventDefault(); if (!busy) props.onClose(); }}>
    <form onSubmit={async event => {
      event.preventDefault();
      if (busy || (discontinue && !reason.trim())) return;
      setBusy(true); setError('');
      try {
        await request(props, `/predictions/${props.action}`, {
          method: 'POST', body: JSON.stringify({ ...props.pair, reason: reason.trim() }),
        });
        props.onSaved(props.pair, props.action);
        props.onClose();
      } catch (caught) { setError(caught instanceof Error ? caught.message : 'Request failed.'); }
      finally { setBusy(false); }
    }}>
      <div className="modal-header">
        <h3 id="suppression-title">{discontinue ? 'Discontinue prediction' : 'Reactivate prediction'}</h3>
        <button type="button" className="modal-close-btn" aria-label="Close dialog" disabled={busy} onClick={props.onClose}><X size={20} /></button>
      </div>
      <div className="suppression-dialog-body">
        <strong>{props.pair.customerName}</strong><p>{props.pair.productName}</p>
        <p>{discontinue
          ? 'Stop forecasting this product for this customer. It will be excluded from consumption and purchase forecasts too.'
          : 'Allow forecasting for this customer and product again. Its forecast will return after the next Sync & Predict run.'}</p>
        <label htmlFor="suppression-reason">Reason {discontinue ? '(required)' : '(optional)'}</label>
        <textarea id="suppression-reason" className="form-input" autoFocus rows={4} required={discontinue}
          value={reason} disabled={busy} onChange={event => setReason(event.target.value)}
          placeholder={discontinue ? 'For example: Customer switched to a different product.' : 'Why is this product being reactivated?'} />
        {error && <p role="alert" className="admin-alert error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-modal-cancel" disabled={busy} onClick={props.onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy || (discontinue && !reason.trim())}>
            {busy ? 'Saving…' : discontinue ? 'Discontinue' : 'Reactivate'}
          </button>
        </div>
      </div>
    </form>
  </dialog>;
}

export function DiscontinuedItems(props: Connection & { revision: number; onReactivate: (pair: PredictionPair) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PredictionSuppression[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    request(props, '/predictions/suppressions', { signal: controller.signal })
      .then(response => response.json()).then(data => { if (!controller.signal.aborted) setItems(data); })
      .catch(caught => { if (!controller.signal.aborted) setError(caught.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [props.api, props.token, props.revision, retry]);
  const visible = items.filter(item => `${item.customerName} ${item.productName} ${item.reason}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="suppression-panel glass-panel">
    <button className="suppression-toggle" aria-expanded={open} aria-controls="discontinued-items" onClick={() => setOpen(!open)}>
      <Ban size={18} /> Discontinued Items {loading ? '(Loading…)' : error ? '(Unavailable)' : `(${items.length})`} <span>{open ? 'Hide' : 'Show'}</span>
    </button>
    {open && <div id="discontinued-items" className="suppression-panel-body">
      <p>These customer–product pairs are excluded from forecasts until reactivated. New orders may automatically reactivate them, depending on your settings.</p>
      <input className="form-input" aria-label="Search discontinued items" placeholder="Search customer, product, or reason" value={search} onChange={e => setSearch(e.target.value)} />
      {error ? <p role="alert">{error} <button className="btn-modal-cancel" onClick={() => setRetry(retry + 1)}>Retry</button></p>
        : loading ? <p role="status">Loading discontinued items…</p>
        : visible.length === 0 ? <p>{items.length ? 'No discontinued items match your search.' : 'No discontinued items. Use Discontinue beside a forecast to mark one.'}</p>
        : <div className="table-responsive"><ResponsiveTable className="data-table"><thead><tr>
          <th>Customer / Product</th><th>Reason</th><th>Discontinued by</th><th>Date</th><th>Action</th>
        </tr></thead><tbody>{visible.map(item => <tr key={`${item.customerId}:${item.productId}`}>
          <td><strong>{item.customerName}</strong><div>{item.productName}</div></td>
          <td className="suppression-reason">{item.reason}</td><td>{item.createdByEmail}</td><td>{new Date(item.createdAt).toLocaleString()}</td>
          <td><button className="suppression-action" onClick={() => props.onReactivate(item)}><RotateCcw size={14} /> Reactivate</button></td>
        </tr>)}</tbody></ResponsiveTable></div>}
    </div>}
  </section>;
}

const emptyFilters = { customerId: '', productId: '', performedByEmail: '', action: '', dateFrom: '', dateTo: '' };
export function SuppressionAudit(props: Connection & { revision: number }) {
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AuditLogPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page), size: '25' });
    Object.entries(filters).forEach(([key, value]) => { if (value.trim()) query.set(key, value.trim()); });
    setLoading(true); setError(''); setData(null);
    request(props, `/admin/suppression-logs?${query}`, { signal: controller.signal })
      .then(response => response.json()).then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(caught => { if (!controller.signal.aborted) setError(caught.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [props.api, props.token, props.revision, filters, page, retry]);
  return <section className="suppression-panel glass-panel suppression-panel-body">
    <h3>Suppression Audit Log</h3><p>History of discontinued and reactivated customer–product pairs.</p>
    <form className="suppression-filters" onSubmit={e => { e.preventDefault(); setPage(0); setFilters({ ...draft }); }}>
      {(['customerId', 'productId', 'performedByEmail', 'dateFrom', 'dateTo'] as const).map(key => <label key={key}>
        {{ customerId: 'Customer ID', productId: 'Product ID', performedByEmail: 'Performed by email', dateFrom: 'From date', dateTo: 'To date' }[key]}
        <input className="form-input" type={key.startsWith('date') ? 'date' : 'text'} value={draft[key]}
          min={key === 'dateTo' ? draft.dateFrom : undefined} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />
      </label>)}
      <label>Action<select className="select-custom" value={draft.action} onChange={e => setDraft({ ...draft, action: e.target.value })}>
        <option value="">All actions</option><option value="SUPPRESS">Discontinued</option><option value="REACTIVATE">Reactivated</option><option value="AUTO_REACTIVATED">Auto-reactivated</option>
      </select></label>
      <button className="btn-primary" type="submit">Apply filters</button>
      <button className="btn-modal-cancel" type="button" onClick={() => { setDraft(emptyFilters); setFilters(emptyFilters); setPage(0); }}>Clear</button>
    </form>
    {error ? <p role="alert">{error} <button className="btn-modal-cancel" onClick={() => setRetry(retry + 1)}>Retry</button></p>
      : loading ? <p role="status">Loading audit log…</p>
      : !data?.content.length ? <p>No audit entries match these filters.</p>
      : <div className="table-responsive"><ResponsiveTable className="data-table"><thead><tr><th>Timestamp</th><th>Customer / Product</th><th>Action</th><th>Reason</th><th>Performed by</th></tr></thead>
        <tbody>{data.content.map(entry => <tr key={entry.id}>
          <td>{new Date(entry.performedAt).toLocaleString()}</td><td><strong>{entry.customerName}</strong><div>{entry.productName}</div></td>
          <td><span className={`suppression-badge ${entry.action === 'SUPPRESS' ? 'discontinued' : 'reactivated'}`}>
            {entry.action === 'SUPPRESS' ? 'Discontinued' : entry.action === 'REACTIVATE' ? 'Reactivated' : 'Auto-reactivated'}</span></td>
          <td className="suppression-reason">{entry.reason || '—'}</td><td>{entry.performedByEmail || 'System'}</td>
        </tr>)}</tbody></ResponsiveTable></div>}
    <div className="suppression-pagination"><button className="btn-modal-cancel" disabled={loading || page === 0} onClick={() => setPage(page - 1)}>Previous</button>
      <span>{data ? `${data.totalElements} entries · Page ${page + 1} of ${Math.max(1, data.totalPages)}` : `Page ${page + 1}`}</span>
      <button className="btn-modal-cancel" disabled={loading || !data || page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</button>
    </div>
  </section>;
}
