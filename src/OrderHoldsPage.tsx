import { useEffect, useState } from 'react';
import { AlertTriangle, Ban, MapPin, ReceiptText, Search } from 'lucide-react';
import './order-holds.css';

type Invoice = { invoiceReference: string; invoiceDate: string; invoiceAmount: number };
type Alert = { customerId: string; customerName: string; priority: 'CRITICAL' | 'HIGH'; alertReason?: string; outstandingTotal: number; pendingInvoiceCount: number; lastInvoiceDate?: string | null; unpaidInvoices: Invoice[]; billingAddress?: string };
type Hold = Alert;
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
const date = (value?: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No pending invoices';

export default function OrderHoldsPage({ api, token, onExpired }: { api: string; token: string; onExpired: () => void }) {
  const [holds, setHolds] = useState<Hold[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    fetch(`${api}/accounts/order-holds`, { headers: { Authorization: `Bearer ${token}` }, signal: abort.signal })
      .then(async response => { if (response.status === 401) onExpired(); if (!response.ok) throw new Error(response.status === 403 ? 'Sales or Finance access is required.' : 'Unable to load order holds.'); return response.json(); })
      .then((rows: Alert[]) => {
        const unique = new Map<string, Hold>();
        rows.forEach(row => { const existing = unique.get(row.customerId); if (!existing || row.priority === 'CRITICAL') unique.set(row.customerId, row); });
        setHolds([...unique.values()].sort((a, b) => a.priority === b.priority ? b.outstandingTotal - a.outstandingTotal : a.priority === 'CRITICAL' ? -1 : 1));
      }).catch(e => { if (!abort.signal.aborted) setError(e.message); });
    return () => abort.abort();
  }, [api, token]);
  const visible = holds.filter(hold => `${hold.customerName} ${hold.unpaidInvoices.map(i => i.invoiceReference).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const critical = holds.filter(h => h.priority === 'CRITICAL').length;
  return <section className="holds-page">
    <header><div><span className="ar-eyebrow">SALES CREDIT CONTROL</span><h2>Customer Orders on Hold</h2><p>Review customers whose pending payments require clearance before confirming another order.</p></div><div className="holds-summary"><strong>{holds.length}</strong><span>customers on hold</span></div></header>
    <aside><Ban size={20} /><div><strong>{critical} firm {critical === 1 ? 'hold' : 'holds'}</strong><p>CRITICAL means the customer has exceeded their credit limit. HIGH means bill-to-bill review or manual High Risk - Advance Payment.</p></div></aside>
    <label className="ar-search"><Search size={18} /><input aria-label="Search order holds" placeholder="Search customer or invoice number…" value={query} onChange={e => setQuery(e.target.value)} /></label>
    {error && <p className="holds-error" role="alert">{error}</p>}
    <div className="holds-list">{visible.map(hold => <article className={hold.priority.toLowerCase()} key={hold.customerId}>
      <div className="holds-card-head"><span className="holds-icon">{hold.priority === 'CRITICAL' ? <Ban size={19} /> : <AlertTriangle size={19} />}</span><div><h3>{hold.customerName}</h3><p>{hold.priority === 'CRITICAL' ? 'CUSTOMER ORDERS ON HOLD' : hold.alertReason === 'ADVANCE_PAYMENT_REQUIRED' ? 'HIGH RISK - ADVANCE PAYMENT' : 'PAYMENT REVIEW REQUIRED BEFORE NEW ORDER'}</p></div><span className="holds-priority">{hold.priority}</span></div>
      <div className="holds-facts"><div><small>Total outstanding</small><strong>{money(Number(hold.outstandingTotal))}</strong></div><div><small>Pending invoices</small><strong>{hold.pendingInvoiceCount}</strong></div><div><small>Last invoiced</small><strong>{date(hold.lastInvoiceDate)}</strong></div></div>
      <div className="holds-invoices"><h4><ReceiptText size={15} /> Unpaid invoices</h4>{hold.unpaidInvoices.length ? hold.unpaidInvoices.map(invoice => <div key={invoice.invoiceReference}><strong>{invoice.invoiceReference}</strong><span>{date(invoice.invoiceDate)}</span><b>{money(Number(invoice.invoiceAmount))}</b></div>) : <div><strong>Advance payment required</strong><span>Manual high-risk flag</span><b>{money(0)}</b></div>}</div>
      <footer><MapPin size={14} />{hold.billingAddress || 'Billing address unavailable'}</footer>
    </article>)}</div>
    {!visible.length && !error && <div className="holds-empty">No customers match this search.</div>}
  </section>;
}
