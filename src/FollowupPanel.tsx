import ResponsiveTable from './ResponsiveTable';
import { useEffect, useRef, useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import './followup.css';
import FollowupDatePicker from './FollowupDatePicker';
import FinancePaymentPromises from './FinancePaymentPromises';
import './finance-promises.css';

type Invoice = { customerId: string; customerName: string; invoiceReference: string };
type Log = Invoice & { paymentPromised?: boolean; promisedPaymentAmount?: number; promisedPaymentDate?: string; id: number; channel: string; response: string; nextFollowupDate: string; nextFollowupMode: string; status: string; followupDate: string; followupBy: string };
type Entry = { log: Log; editable: boolean };
type Props = { api: string; token: string; target: Invoice | null; onClose: () => void; onSaved: () => void; onExpired: () => void; showHistory?: boolean; promisesOnly?: boolean; onFindInvoices?: () => void };

function FollowupModal({ api, token, target, existing, onClose, onSaved, onExpired }: Omit<Props, 'target'> & { target: Invoice; existing?: Log }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [channel, setChannel] = useState(existing?.channel ?? 'CALL');
  const [response, setResponse] = useState(existing?.response ?? '');
  const [mode, setMode] = useState(existing?.nextFollowupMode ?? 'AUTO');
  const [date, setDate] = useState(existing?.nextFollowupDate ?? '');
  const [completed, setCompleted] = useState(existing?.status === 'FOLLOWED_UP');
  const [paymentPromised, setPaymentPromised] = useState(existing?.paymentPromised ?? false);
  const [promiseAmount, setPromiseAmount] = useState(String(existing?.promisedPaymentAmount ?? ''));
  const [promiseDate, setPromiseDate] = useState(existing?.promisedPaymentDate ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const result = await fetch(`${api}/accounts/followup${existing ? `/${existing.id}` : ''}`, {
        method: existing ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: target.customerId, invoice_reference: target.invoiceReference, channel, response,
          next_followup_mode: mode, next_followup_date: mode === 'MANUAL' ? date : null, status: completed ? 'FOLLOWED_UP' : 'PENDING', payment_promised: paymentPromised, promised_payment_amount: paymentPromised ? Number(promiseAmount) : null, promised_payment_date: paymentPromised ? promiseDate : null })
      });
      if (result.status === 401) { onExpired(); return; }
      if (!result.ok) throw new Error(result.status === 403 ? 'Finance access is required, and edits must be within 24 hours of creation.' : result.status === 400 ? 'Check the response and date. Automatic scheduling needs a configured customer interval; the invoice must still be unpaid.' : 'Could not save the followup. Please try again.');
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save followup'); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="followup-dialog" aria-labelledby="followup-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={save}><header><div><span className="ar-eyebrow">CUSTOMER CONVERSATION</span><h2 id="followup-title">{existing ? 'Edit followup' : 'Log followup'}</h2></div><button type="button" aria-label="Close followup" disabled={busy} onClick={onClose}><X size={20} /></button></header>
      <div className="followup-customer"><strong>{target.customerName}</strong><span>{target.invoiceReference}</span></div>
      <fieldset disabled={busy}>
        <label>Channel<select value={channel} onChange={e => setChannel(e.target.value)}>{['CALL', 'WHATSAPP', 'EMAIL', 'IN_PERSON'].map(c => <option key={c} value={c}>{c.replaceAll('_', ' ')}</option>)}</select></label>
        <label>Customer response<textarea required rows={4} value={response} onChange={e => setResponse(e.target.value)} placeholder="What did the customer say? For example, promised payment in 5 days." /></label>
        <fieldset className="fp-promise-fields"><legend>Payment commitment</legend><label className="followup-completed"><input type="checkbox" checked={paymentPromised} onChange={e => { setPaymentPromised(e.target.checked); if (e.target.checked) setCompleted(true); }} /> Customer promised payment</label>{paymentPromised && <><label>Promised amount (INR)<input type="number" required min="0.01" step="0.01" value={promiseAmount} onChange={e => setPromiseAmount(e.target.value)} /></label><FollowupDatePicker label="Payment deadline" value={promiseDate} onChange={setPromiseDate} /><p className="followup-hint">This is the customer's payment commitment. The next follow-up date below schedules your next contact and can be different.</p></>}</fieldset>
        <fieldset className="followup-date-mode"><legend>Next followup date</legend>
          <label><input type="radio" name="next-date-mode" value="AUTO" checked={mode === 'AUTO'} onChange={() => setMode('AUTO')} /> Automatic</label>
          <label><input type="radio" name="next-date-mode" value="MANUAL" checked={mode === 'MANUAL'} onChange={() => setMode('MANUAL')} /> Choose a date</label>
        </fieldset>
        {mode === 'AUTO' ? <p className="followup-hint">Calculated on save: today + this customer's followup interval.{existing && ` Previously scheduled: ${existing.nextFollowupDate}.`}</p> : <FollowupDatePicker value={date} onChange={setDate} />}
        <label className="followup-completed"><input type="checkbox" checked={completed} disabled={paymentPromised} onChange={e => setCompleted(e.target.checked)} /> Mark as completed</label>
        <p className="followup-hint">{completed ? 'Saved as Followed up.' : 'Saved as Pending.'} If the invoice remains unpaid, it is flagged again on the next followup date. This does not mark the invoice as paid.</p>
      </fieldset>
      {error && <p className="followup-error" role="alert">{error}</p>}
      <footer><span>Editable for 24 hours after creation</span><button type="button" className="btn-modal-cancel" disabled={busy} onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy || !response.trim() || paymentPromised && (!promiseDate || Number(promiseAmount) <= 0)}>{busy ? 'Saving…' : 'Save followup'}</button></footer>
    </form>
  </dialog>;
}

export default function FollowupPanel(props: Props) {
  const { api, token, onExpired } = props;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editing, setEditing] = useState<Log | null>(null);
  const [promiseTarget, setPromiseTarget] = useState<Invoice | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    const load = () => fetch(`${api}/accounts/followups`, { headers: { Authorization: `Bearer ${token}` }, signal: abort.signal })
      .then(async r => { if (r.status === 401) onExpired(); if (!r.ok) throw new Error('Unable to load followup history.'); return r.json(); })
      .then(data => { setEntries(data); setError(''); }).catch(e => { if (!abort.signal.aborted) setError(e.message); });
    void load(); const timer = window.setInterval(load, 60000);
    return () => { abort.abort(); window.clearInterval(timer); };
  }, [api, token, revision, onExpired]);
  const close = () => { setEditing(null); setPromiseTarget(null); props.onClose(); };
  const saved = () => { close(); setRevision(v => v + 1); setMessage('Followup saved'); props.onSaved(); };
  const deleteLog = async (log: Log) => { if (!window.confirm('Delete this followup log?')) return; setError(''); try { const r = await fetch(`${props.api}/accounts/followup/${log.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (r.status === 401) { props.onExpired(); return; } if (!r.ok) throw new Error('Followups can only be deleted within 24 hours.'); setMessage('Followup deleted'); setRevision(v => v + 1); props.onSaved(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete followup'); } };
  const target = editing ?? promiseTarget ?? props.target;
  if (props.showHistory === false) return target ? <FollowupModal key={editing?.id ?? `${target.customerId}:${target.invoiceReference}`} {...props} target={target} existing={editing ?? undefined} onClose={close} onSaved={saved} /> : null;
  if (props.promisesOnly) return <section className="followup-history">{message && <p role="status">{message}</p>}<FinancePaymentPromises onFindInvoices={props.onFindInvoices} api={props.api} token={props.token} revision={revision} onExpired={props.onExpired} onFollowup={invoice => { setPromiseTarget(invoice); setEditing(null); }} />{target && <FollowupModal key={`${target.customerId}:${target.invoiceReference}`} {...props} target={target} onClose={close} onSaved={saved} />}</section>;
  return <section className="followup-history"><header><div><span className="ar-eyebrow">COLLECTIONS ACTIVITY</span><h3><MessageSquare size={18} /> Followup history</h3><p>Find and edit recent conversations, including invoices outside the active alert queue.</p></div><input aria-label="Search followup history" placeholder="Search customer or invoice…" value={query} onChange={e => setQuery(e.target.value)} /></header>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="followup-error">{error} <button onClick={() => setRevision(v => v + 1)}>Retry</button></p>}
    <FinancePaymentPromises onFindInvoices={props.onFindInvoices} api={props.api} token={props.token} revision={revision} onExpired={props.onExpired} onFollowup={invoice => { setPromiseTarget(invoice); setEditing(null); }} /><div className="table-responsive"><ResponsiveTable><thead><tr><th>Customer / invoice</th><th>Conversation</th><th>Next followup</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {entries.filter(({ log }) => `${log.customerName} ${log.invoiceReference}`.toLowerCase().includes(query.toLowerCase())).map(({ log, editable }) => <tr key={log.id}><td data-label="Customer / invoice"><strong>{log.customerName}</strong><small>{log.invoiceReference}</small></td><td data-label="Conversation"><strong>{log.channel.replaceAll('_', ' ')}</strong><p>{log.response}</p>{log.paymentPromised && <p className="fp-history-promise">Promised ₹{Number(log.promisedPaymentAmount).toLocaleString('en-IN')} by {log.promisedPaymentDate}</p>}<small>{log.followupBy} · {log.followupDate.replace('T', ' ').slice(0, 16)}</small></td><td data-label="Next follow-up">{log.nextFollowupDate}<small>{log.nextFollowupMode === 'AUTO' ? 'Automatic' : 'Manual'}</small></td><td data-label="Status">{log.status === 'FOLLOWED_UP' ? 'Followed up' : log.status === 'PAID' ? 'Paid' : 'Pending'}</td><td data-label="Action"><button disabled={!editable} onClick={() => { setEditing(log); setMessage(''); }} aria-label={`Edit followup for ${log.customerName} ${log.invoiceReference}`}>Edit</button><button disabled={!editable} onClick={() => void deleteLog(log)} aria-label={`Delete followup for ${log.customerName} ${log.invoiceReference}`}>Delete</button>{!editable && <small>24-hour window closed</small>}</td></tr>)}
    </tbody></ResponsiveTable></div>{!entries.length && !error && <p>No followups logged yet.</p>}
    {target && <FollowupModal key={editing?.id ?? `${target.customerId}:${target.invoiceReference}`} {...props} target={target} existing={editing ?? undefined} onClose={close} onSaved={saved} />}
  </section>;
}
