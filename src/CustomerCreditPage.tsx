import ResponsiveTable from './ResponsiveTable';
import { useEffect, useState } from 'react';
import { Search, RefreshCw, Save } from 'lucide-react';
import './credit.css';

type Config = { creditDays: number; creditLimit: number; followupInterval: number; billToBill: boolean; advancePaymentRequired: boolean };
type Customer = { customerId: string; customerName: string; config: Config | null };
const fields = (config: Config | null) => ({ creditDays: config ? String(config.creditDays) : '', creditLimit: config ? String(config.creditLimit) : '', followupInterval: config ? String(config.followupInterval) : '', billToBill: config?.billToBill ?? false, advancePaymentRequired: config?.advancePaymentRequired ?? false });

function CreditRow({ customer, api, token, onExpired, hidden }: { customer: Customer; api: string; token: string; onExpired: () => void; hidden: boolean }) {
  const [draft, setDraft] = useState(() => fields(customer.config));
  const [saved, setSaved] = useState(() => fields(customer.config));
  const [configured, setConfigured] = useState(!!customer.config);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const dirty = !configured || JSON.stringify(draft) !== JSON.stringify(saved);
  async function save() {
    const days = Number(draft.creditDays), limit = Number(draft.creditLimit), interval = Number(draft.followupInterval);
    setMessage(''); setError(false);
    if (!draft.creditDays.trim() || !draft.creditLimit.trim() || !draft.followupInterval.trim() || !Number.isInteger(days) || days < 0 || !Number.isFinite(limit) || limit < 0 || !/^\d+(\.\d{1,2})?$/.test(draft.creditLimit) || !Number.isInteger(interval) || interval < 1) {
      setError(true); setMessage('Enter credit days ≥ 0, limit ≥ 0 (max. 2 decimals), and interval ≥ 1.'); return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${api}/accounts/config`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: customer.customerId, creditDays: days, creditLimit: limit, followupInterval: interval, billToBill: draft.billToBill, advancePaymentRequired: draft.advancePaymentRequired }) });
      if (response.status === 401) { onExpired(); return; }
      if (!response.ok) throw new Error(response.status === 403 ? 'Finance Senior Executive or above access required.' : 'Could not save this customer. Check the values and try again.');
      const next = fields(await response.json()); setDraft(next); setSaved(next); setConfigured(true); setMessage('Saved');
    } catch (e) { setError(true); setMessage(e instanceof Error ? e.message : 'Save failed'); }
    finally { setBusy(false); }
  }
  const labels = ['Credit days', 'Credit limit (₹)', 'Follow-up interval'];
  return <tr hidden={hidden}><td data-label="Customer"><strong>{customer.customerName}</strong><small>{customer.customerId}</small><span className={`credit-state ${configured ? '' : 'new'}`}>{configured ? 'Configured' : 'Not configured'}</span></td>
    {(['creditDays', 'creditLimit', 'followupInterval'] as const).map((key, i) => <td key={key} data-label={labels[i]}><input aria-label={`${labels[i]} for ${customer.customerName}`} type="number" min={key === 'followupInterval' ? 1 : 0} step={key === 'creditLimit' ? '0.01' : '1'} placeholder="Not set" value={draft[key]} disabled={busy} onChange={e => { setDraft({ ...draft, [key]: e.target.value }); setMessage(''); }} /></td>)}
    <td data-label="Bill to bill"><label className="credit-toggle"><input type="checkbox" role="switch" aria-label={`Bill to bill for ${customer.customerName}`} checked={draft.billToBill} disabled={busy} onChange={e => { setDraft({ ...draft, billToBill: e.target.checked }); setMessage(''); }} /><span>{draft.billToBill ? 'On' : 'Off'}</span></label></td>
    <td data-label="High risk"><label className="credit-toggle credit-risk-toggle"><input type="checkbox" role="switch" aria-label={`High risk advance payment for ${customer.customerName}`} checked={draft.advancePaymentRequired} disabled={busy} onChange={e => { setDraft({ ...draft, advancePaymentRequired: e.target.checked }); setMessage(''); }} /><span>{draft.advancePaymentRequired ? 'Advance payment' : 'Off'}</span></label></td>
    <td data-label="Save settings"><button className="btn-primary" disabled={busy || !dirty} onClick={save}><Save size={14} />{busy ? 'Saving…' : 'Save'}</button><p className={error ? 'credit-error' : 'credit-saved'} role={error ? 'alert' : 'status'}>{message || (dirty && configured ? 'Unsaved changes' : '')}</p></td></tr>;
}

export default function CustomerCreditPage(props: { api: string; token: string; onExpired: () => void; preview: boolean }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError('');
    fetch(`${props.api}/accounts/customers?refresh=${revision > 0}`, { headers: { Authorization: `Bearer ${props.token}` }, signal: abort.signal })
      .then(async r => { if (r.status === 401) props.onExpired(); if (!r.ok) throw new Error(r.status === 403 ? 'Finance Senior Executive or above access required.' : 'Unable to load Zoho customers. Check the connection and retry.'); return r.json(); })
      .then(setCustomers).catch(e => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [props.api, props.token, revision]);
  return <section className="credit-page"><header><div><span className="ar-eyebrow">CUSTOMER SETTINGS</span><h2>Customer Credit Configuration</h2><p>Set payment terms for each customer. Save a row to apply only that customer's settings.</p></div><button className="btn-modal-cancel" disabled={loading} onClick={() => setRevision(revision + 1)}><RefreshCw size={15} /> Refresh customers</button></header>
    {props.preview && <p className="credit-preview">Local preview · Sample customer directory, including an unconfigured customer. Production loads the Zoho customer list.</p>}
    <label className="ar-search"><Search size={18} /><input aria-label="Search credit customers" placeholder="Search customer name or Zoho ID…" value={query} onChange={e => setQuery(e.target.value)} /></label>
    <p className="credit-help">Credit days count from the invoice date. Credit limit applies to the customer's total unpaid balance. High Risk - Advance Payment is a manual flag for customers who must pay before new orders.</p>
    {loading && <p role="status">Loading customers…</p>}
    {error && <p role="alert" className="credit-error">{error}</p>}
    <div className="table-responsive"><ResponsiveTable className="credit-table"><thead><tr><th>Customer</th><th>Credit days</th><th>Credit limit (₹)</th><th>Follow-up interval</th><th>Bill to bill</th><th>High Risk - Advance Payment</th><th>Save settings</th></tr></thead><tbody>
      {customers.map(c => <CreditRow key={c.customerId} customer={c} {...props} hidden={!`${c.customerName} ${c.customerId}`.toLowerCase().includes(query.toLowerCase())} />)}
      {!loading && !error && !customers.some(c => `${c.customerName} ${c.customerId}`.toLowerCase().includes(query.toLowerCase())) && <tr><td colSpan={7}>No customers found.</td></tr>}
    </tbody></ResponsiveTable></div>
  </section>;
}
