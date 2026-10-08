import { useState } from 'react';
import { AlertTriangle, ArrowUpRight, CalendarDays, Search, Wallet, MapPin, MessageSquare, X, ReceiptText } from 'lucide-react';
import './accounts.css';
import FollowupPanel from './FollowupPanel';

type Followup = { channel: string; response: string; nextFollowupDate?: string; followupBy?: string };
type UnpaidInvoice = { invoiceReference: string; invoiceDate: string; invoiceAmount: number; paymentStatus: string; salesperson?: string };
type Alert = { customerId: string; customerName: string; invoiceReference: string; invoiceDate: string; invoiceAmount: number; salesperson?: string; outstandingTotal: number; pendingInvoiceCount: number; lastInvoiceDate: string; unpaidInvoices: UnpaidInvoice[]; daysOverdue: number; billingAddress?: string; priority: string; alertReason?: string; lastFollowup?: Followup };
type CustomerGroup = { customerId: string; customerName: string; priority: string; outstandingTotal: number; pendingInvoiceCount: number; lastInvoiceDate: string; unpaidInvoices: UnpaidInvoice[]; daysOverdue: number; billingAddress?: string; alerts: Alert[]; lastFollowup?: Followup };
const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNCONFIGURED'];
const labels: Record<string, string> = { CRITICAL: 'Credit limit exceeded', HIGH: 'Payment review required', MEDIUM: 'Follow-up due', LOW: 'Upcoming follow-up', UNCONFIGURED: 'Needs credit configuration' };
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
const displayDate = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unavailable';
const daysSince = (value: string) => value ? Math.max(0, Math.floor((Date.now() - new Date(`${value}T00:00:00`).getTime()) / 86_400_000)) : 0;

export default function AccountsDashboard({ alerts, api, token, canFollowup, onSaved, onExpired }: { alerts: Alert[]; api: string; token: string; canFollowup: boolean; onSaved: () => void; onExpired: () => void }) {
  const [followupTarget, setFollowupTarget] = useState<{ customerId: string; customerName: string; invoiceReference: string } | null>(null);
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('ALL');
  const [sort, setSort] = useState('priority');
  const [selected, setSelected] = useState<string | null>(null);
  const grouped = new Map<string, CustomerGroup>();
  alerts.forEach(alert => {
    const current = grouped.get(alert.customerId);
    if (!current) grouped.set(alert.customerId, { customerId: alert.customerId, customerName: alert.customerName, priority: alert.priority,
      outstandingTotal: Number(alert.outstandingTotal), pendingInvoiceCount: alert.pendingInvoiceCount || alert.unpaidInvoices?.length || 1,
      lastInvoiceDate: alert.lastInvoiceDate || alert.invoiceDate, unpaidInvoices: alert.unpaidInvoices || [{ invoiceReference: alert.invoiceReference, invoiceDate: alert.invoiceDate, invoiceAmount: alert.invoiceAmount, paymentStatus: 'unpaid' }],
      daysOverdue: alert.daysOverdue, billingAddress: alert.billingAddress, alerts: [alert], lastFollowup: alert.lastFollowup });
    else {
      current.alerts.push(alert); current.daysOverdue = Math.max(current.daysOverdue, alert.daysOverdue);
      if (priorities.indexOf(alert.priority) < priorities.indexOf(current.priority)) current.priority = alert.priority;
      if (!current.lastFollowup && alert.lastFollowup) current.lastFollowup = alert.lastFollowup;
    }
  });
  const customers = [...grouped.values()];
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dueToday = customers.map(customer => ({
    ...customer,
    dueAlerts: customer.alerts.filter(alert => alert.lastFollowup?.nextFollowupDate === today)
  })).filter(customer => customer.dueAlerts.length > 0);
  const critical = customers.filter(c => c.priority === 'CRITICAL').length;
  const pendingInvoices = customers.reduce((sum, c) => sum + c.pendingInvoiceCount, 0);
  const visible = customers.filter(c => (priority === 'ALL' || c.priority === priority) && `${c.customerName} ${c.unpaidInvoices.map(i => `${i.invoiceReference} ${i.salesperson ?? ''}`).join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'amount' ? b.outstandingTotal - a.outstandingTotal : sort === 'overdue' ? b.daysOverdue - a.daysOverdue : priorities.indexOf(a.priority) - priorities.indexOf(b.priority));

  return <section className="ar-workspace">
    <header className="ar-heading"><div><span className="ar-eyebrow">COLLECTIONS WORKSPACE</span><h2>Accounts receivable<span>.</span></h2><p>Customer-level balances with every pending invoice in one place.</p></div><div className="ar-heading-actions"><span className="ar-count"><span />{customers.length} customers to follow up</span></div></header>
    <div className="ar-metrics">
      <article className="ar-metric ar-metric-primary"><span className="ar-metric-icon"><Wallet size={21} /></span><p>Total outstanding</p><strong>{money(customers.reduce((sum, c) => sum + c.outstandingTotal, 0))}</strong><small>Across customers with active alerts</small></article>
      <article className="ar-metric"><span className="ar-metric-icon ar-red"><AlertTriangle size={21} /></span><p>Critical customers</p><strong>{String(critical).padStart(2, '0')}</strong><small>Outstanding exceeds the credit limit</small></article>
      <article className="ar-metric"><span className="ar-metric-icon"><CalendarDays size={21} /></span><p>Follow-ups due</p><strong>{String(customers.filter(c => c.priority === 'MEDIUM').length).padStart(2, '0')}</strong><small>Customers currently due for follow-up</small></article>
      <article className="ar-metric"><span className="ar-metric-icon"><ReceiptText size={21} /></span><p>Pending invoices</p><strong>{String(pendingInvoices).padStart(2, '0')}</strong><small>All unpaid invoices for alerted customers</small></article>
    </div>
    {critical > 0 && <aside className="ar-warning"><AlertTriangle size={20} /><div><strong>{critical} {critical === 1 ? 'customer has' : 'customers have'} exceeded their credit limit</strong><p>Review critical accounts before accepting new orders.</p></div><button onClick={() => setPriority('CRITICAL')}>Review accounts <ArrowUpRight size={16} /></button></aside>}
    <section className="ar-today-board">
      <div className="ar-today-heading"><div><span><CalendarDays size={18} /></span><div><h3>Follow-ups due today</h3><p>{displayDate(today)} · Scheduled customer callbacks and payment checks</p></div></div><strong>{String(dueToday.length).padStart(2, '0')}</strong></div>
      {dueToday.length > 0 ? <div className="ar-today-list">{dueToday.map(customer => <article key={customer.customerId}>
        <span className="ar-today-avatar">{customer.customerName.split(' ').slice(0, 2).map(name => name[0]).join('')}</span>
        <div className="ar-today-customer"><strong>{customer.customerName}</strong><small>{customer.dueAlerts.length} {customer.dueAlerts.length === 1 ? 'invoice' : 'invoices'} due for follow-up</small></div>
        <div className="ar-today-invoices">{customer.dueAlerts.map(alert => <span key={alert.invoiceReference}>{alert.invoiceReference} · {money(Number(alert.invoiceAmount))}<small><i />{alert.salesperson || 'Unassigned salesperson'}</small></span>)}</div>
        <div className="ar-today-dates"><span><small>LAST INVOICED</small><strong>{displayDate(customer.lastInvoiceDate)}</strong></span><span><small>INVOICE AGE</small><strong>{Math.max(...customer.dueAlerts.map(alert => daysSince(alert.invoiceDate)))} days</strong></span></div>
        <div className="ar-today-last"><small>LAST RESPONSE</small><p>{customer.dueAlerts[0].lastFollowup?.response || 'No response recorded'}</p></div>
        {canFollowup && <button onClick={() => setFollowupTarget({ customerId: customer.customerId, customerName: customer.customerName, invoiceReference: customer.dueAlerts[0].invoiceReference })}>Log follow-up <ArrowUpRight size={15} /></button>}
      </article>)}</div> : <div className="ar-today-clear"><span><CalendarDays size={20} /></span><div><strong>No follow-ups scheduled for today</strong><p>New items will appear here when their next follow-up date is today.</p></div></div>}
    </section>
    <div className="ar-queue"><div className="ar-queue-heading"><div><h3>Collection queue</h3><p>One card per customer, sorted by the highest priority.</p></div><span>{visible.length} of {customers.length} customers · {pendingInvoices} pending invoices</span></div>
        <div className="ar-toolbar"><label className="ar-search"><Search size={18} /><input aria-label="Search accounts" placeholder="Search customer, invoice or salesperson…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button>}</label><select aria-label="Sort account alerts" value={sort} onChange={e => setSort(e.target.value)}><option value="priority">Highest priority first</option><option value="amount">Largest balance first</option><option value="overdue">Most overdue first</option></select></div>
      <div className="ar-filters" aria-label="Filter by priority">{['ALL', ...priorities].map(p => <button key={p} aria-pressed={priority === p} className={`${priority === p ? 'selected' : ''} ${p.toLowerCase()}`} onClick={() => setPriority(p)}>{p !== 'ALL' && <i />}{p === 'ALL' ? 'All customers' : p.charAt(0) + p.slice(1).toLowerCase()}<span>{p === 'ALL' ? customers.length : customers.filter(c => c.priority === p).length}</span></button>)}</div>
      <div className="ar-cards">{visible.map(customer => <article className={`ar-card ${customer.priority.toLowerCase()}`} key={customer.customerId}>
        <div className="ar-card-top"><span className="ar-avatar">{customer.customerName.split(' ').slice(0, 2).map(n => n[0]).join('')}</span><div><h4>{customer.customerName}</h4><span className="ar-invoice">{customer.pendingInvoiceCount} pending {customer.pendingInvoiceCount === 1 ? 'invoice' : 'invoices'} · Last invoiced {displayDate(customer.lastInvoiceDate)}</span></div><span className="ar-priority"><i />{customer.priority}</span></div>
        <div className="ar-card-amount"><div><small>Total customer outstanding</small><strong>{money(customer.outstandingTotal)}</strong></div><span className="ar-age"><CalendarDays size={14} />{customer.priority === 'UNCONFIGURED' ? 'Credit settings required' : `Up to ${customer.daysOverdue} days overdue`}</span></div>
        <div className="ar-status">{customer.priority === 'CRITICAL' ? <><AlertTriangle size={15} /> CUSTOMER ORDERS ON HOLD</> : <><span className="ar-dot" />{customer.alerts.some(alert => alert.alertReason === 'CREDIT_CONFIG_REQUIRED') ? 'NEEDS CREDIT CONFIGURATION' : customer.alerts.some(alert => alert.alertReason === 'ADVANCE_PAYMENT_REQUIRED') ? 'HIGH RISK - ADVANCE PAYMENT' : labels[customer.priority]}</>}</div>
        <div className="ar-invoice-list"><div className="ar-invoice-list-heading"><strong>Pending invoices</strong><span>{customer.pendingInvoiceCount}</span></div>{customer.unpaidInvoices.map(invoice => {
          const alert = customer.alerts.find(a => a.invoiceReference === invoice.invoiceReference);
          return <div className="ar-invoice-row" key={invoice.invoiceReference}><div><strong>{invoice.invoiceReference}</strong><small>{displayDate(invoice.invoiceDate)}</small><span className="ar-salesperson"><i />{invoice.salesperson || 'Unassigned salesperson'}</span></div><span>{money(Number(invoice.invoiceAmount))}</span>{canFollowup && <button onClick={() => setFollowupTarget({ customerId: customer.customerId, customerName: customer.customerName, invoiceReference: invoice.invoiceReference })}>{alert?.lastFollowup ? 'Follow up again' : 'Log followup'}</button>}</div>;
        })}</div>
        <div className="ar-followup"><MessageSquare size={16} /><div><small>LATEST FOLLOW-UP</small><p>{customer.lastFollowup ? `${customer.lastFollowup.channel.replaceAll('_', ' ')} · ${customer.lastFollowup.response}` : 'No follow-up logged yet'}</p></div></div>
        {selected === customer.customerId && <div className="ar-details"><p><MapPin size={15} />{customer.billingAddress || 'Billing address unavailable'}</p>{customer.lastFollowup?.nextFollowupDate && <p>Next follow-up: {displayDate(customer.lastFollowup.nextFollowupDate)}</p>}</div>}
        <footer><span>{labels[customer.priority] || customer.priority}</span><button aria-expanded={selected === customer.customerId} onClick={() => setSelected(selected === customer.customerId ? null : customer.customerId)}>{selected === customer.customerId ? 'Hide details' : 'View details'}<ArrowUpRight size={15} /></button></footer>
      </article>)}</div>
      {!visible.length && <div className="ar-empty"><Search size={28} /><h3>No accounts match this view</h3><p>Try another customer name or invoice number.</p><button onClick={() => { setQuery(''); setPriority('ALL'); }}>Clear filters</button></div>}
    </div>
    {canFollowup && <FollowupPanel api={api} token={token} target={followupTarget} showHistory={false} onClose={() => setFollowupTarget(null)} onSaved={onSaved} onExpired={onExpired} />}
  </section>;
}

