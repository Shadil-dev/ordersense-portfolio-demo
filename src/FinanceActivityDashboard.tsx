import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CalendarClock, CheckCircle2, Clock3, Users } from 'lucide-react';
import './finance-activity.css';

type Staff = { followupBy: string; followupsLogged: number; lateFollowups: number; lateDaysTotal: number; overdueCustomers: number; customersHandled: number; onTimeRate: number; performanceScore: number };
type LateEvent = { followupBy: string; customerName: string; customerId: string; invoiceReference: string; scheduledDate: string; actualDate: string; lateDays: number; open?: boolean; neverFollowedUp?: boolean };
type ActivityData = { staff: Staff[]; lateEvents: LateEvent[]; asOf: string };

export default function FinanceActivityDashboard({ api, token }: { api: string; token: string }) {
  const [data, setData] = useState<ActivityData>({ staff: [], lateEvents: [], asOf: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState('ALL');
  useEffect(() => {
    const abort = new AbortController();
    fetch(`${api}/accounts/team-activity`, { headers: { Authorization: `Bearer ${token}` }, signal: abort.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error(response.status === 403 ? 'This report is restricted to Super Admin.' : 'Could not load finance activity.'); return response.json(); })
      .then(setData).catch(e => { if (e.name !== 'AbortError') setError(e.message); }).finally(() => setLoading(false));
    return () => abort.abort();
  }, [api, token]);
  const events = useMemo(() => data.lateEvents.filter(item => selectedStaff === 'ALL' || item.followupBy === selectedStaff), [data.lateEvents, selectedStaff]);
  const overdue = data.staff.reduce((total, person) => total + person.overdueCustomers, 0);
  const logged = data.staff.reduce((total, person) => total + person.followupsLogged, 0);
  const late = data.staff.reduce((total, person) => total + person.lateFollowups, 0);
  const punctuality = logged ? Math.round((logged - late) * 100 / logged) : 100;
  return <main className="finance-activity">
    <header className="fa-heading"><div><span className="fa-eyebrow">PRIVATE MANAGEMENT REPORT</span><h1>Finance follow-up activity</h1><p>Follow-up timing and open commitments from the Accounts Receivable log.</p></div><span className="fa-asof">As of {data.asOf || '—'}</span></header>
    <aside className="fa-note"><Activity size={17}/><p>Metrics use the team’s existing customer follow-up records. “Late” means the next logged contact happened after its promised date; open items remain late until a follow-up is logged.</p></aside>
    {error && <div className="fa-error"><AlertCircle size={18}/>{error}</div>}
    {loading ? <p className="fa-loading">Loading activity…</p> : <>
      <section className="fa-metrics">
        <article><span><Users size={19}/></span><small>Team members with activity</small><strong>{data.staff.filter(s => s.followupsLogged > 0).length}</strong></article>
        <article><span><CheckCircle2 size={19}/></span><small>Follow-ups logged</small><strong>{logged}</strong></article>
        <article className={late ? 'fa-alert-metric' : ''}><span><Clock3 size={19}/></span><small>Late completed follow-ups</small><strong>{late}</strong></article>
        <article className={overdue ? 'fa-alert-metric' : ''}><span><CalendarClock size={19}/></span><small>Open overdue commitments</small><strong>{overdue}</strong></article>
      </section>
      <section className="fa-panel"><div className="fa-panel-head"><div><h2>Team scorecard</h2><p>{punctuality}% of logged follow-ups happened by the prior promised date</p></div></div><p className="fa-scoring-note">Score: 70% on-time rate + 30% open-commitment score. Open overdue items reduce the latter by 20 points each. Review the score with account complexity, workload, and follow-up history.</p>
        {data.staff.length ? <div className="fa-staff-grid">{data.staff.map(person => <button className={`fa-staff-card ${selectedStaff === person.followupBy ? 'selected' : ''}`} key={person.followupBy} onClick={() => setSelectedStaff(selectedStaff === person.followupBy ? 'ALL' : person.followupBy)}>
          <div className="fa-score-head"><strong>{person.followupBy}</strong><b aria-label={`Performance score ${person.performanceScore} out of 100`}>{person.performanceScore}<small>/100</small></b></div><span>{person.customersHandled} customers · {person.followupsLogged} logged</span><div className="fa-bar"><i style={{ width: `${person.performanceScore}%` }}/></div><small>{person.onTimeRate}% on time · {person.lateFollowups} late · {person.overdueCustomers} open overdue</small>
        </button>)}</div> : <div className="fa-empty">No follow-up activity recorded yet.</div>}
      </section>
      <section className="fa-panel"><div className="fa-panel-head fa-issues-head"><div><h2>Late and overdue follow-ups</h2><p>Prioritized by days past the promised date.</p></div><select aria-label="Filter by finance team member" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}><option value="ALL">All team members</option>{data.staff.map(person => <option key={person.followupBy}>{person.followupBy}</option>)}</select></div>
        {events.length ? <div className="fa-issue-list">{events.map((event, index) => <article key={`${event.customerId}-${event.invoiceReference}-${index}`}><span className={event.open ? 'fa-open-tag' : 'fa-late-tag'}>{event.open ? 'OPEN' : `${event.lateDays} DAYS LATE`}</span><div className="fa-issue-main"><strong>{event.customerName}</strong><small>{event.invoiceReference} · owner: {event.followupBy}</small></div><div className="fa-issue-dates"><span>Due {event.scheduledDate}</span><span>{event.neverFollowedUp ? 'No follow-up logged' : event.open ? `${event.lateDays} days overdue` : `Contact logged ${event.actualDate}`}</span></div></article>)}</div> : <div className="fa-empty">No late or overdue follow-ups for this selection.</div>}
      </section>
    </>}
  </main>;
}
