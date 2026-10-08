import { useMemo, useState, type ReactNode } from 'react'
import {
  Activity, ArrowRight, BarChart3, Boxes, Building2, CalendarDays, Check, ChevronDown,
  CircleDollarSign, Code2, Command, LayoutDashboard, Menu, PackageCheck,
  Route, Search, Sparkles, Target, TrendingUp, Truck, Users, X, Zap,
} from 'lucide-react'
import { activity, customers, deliveries, forecasts, opportunities, purchaseItems } from './data'

type Page = 'overview' | 'forecast' | 'purchase' | 'sales' | 'delivery'

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`

const nav: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Command center', icon: LayoutDashboard },
  { id: 'forecast', label: 'Reorder forecast', icon: Sparkles },
  { id: 'purchase', label: 'Purchase planning', icon: Boxes },
  { id: 'sales', label: 'Sales CRM', icon: Target },
  { id: 'delivery', label: 'Delivery routes', icon: Route },
]

function Brand() {
  return <div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>OrderSense</strong><small>Reorder intelligence</small></div></div>
}

function Badge({ children, tone = 'blue' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

function Metric({ icon: Icon, label, value, note, tone = 'blue' }: { icon: typeof Activity; label: string; value: string; note: string; tone?: string }) {
  return <article className="metric"><div className={`metric-icon ${tone}`}><Icon size={20} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>
}

function Bars() {
  const values = [36, 48, 43, 61, 56, 72, 67, 84, 76, 91, 88, 96]
  return <div className="bar-chart" aria-label="Revenue trend chart">{values.map((value, i) => <div key={i} className="bar-wrap"><div className={`bar ${i === values.length - 1 ? 'active' : ''}`} style={{ height: `${value}%` }} /><span>{['N','D','J','F','M','A','M','J','J','A','S','O'][i]}</span></div>)}</div>
}

function Overview({ navigate }: { navigate: (page: Page) => void }) {
  return <>
    <section className="hero">
      <div><Badge tone="mint"><Zap size={12} /> Live decision engine</Badge><h1>Good morning, Shadi.</h1><p>Your business is on track. OrderSense found <strong>5 reorder opportunities</strong> worth ₹1.12L this week.</p></div>
      <button className="primary" onClick={() => navigate('forecast')}>Review forecast <ArrowRight size={17} /></button>
    </section>
    <section className="metrics-grid">
      <Metric icon={TrendingUp} label="Forecast revenue" value="₹8.42L" note="↑ 12.4% vs last month" tone="blue" />
      <Metric icon={Sparkles} label="Predictions due" value="24" note="5 need attention today" tone="violet" />
      <Metric icon={CircleDollarSign} label="Receivables" value="₹3.18L" note="₹42K overdue" tone="amber" />
      <Metric icon={Truck} label="Deliveries today" value="8" note="3 of 8 completed" tone="green" />
    </section>
    <section className="dashboard-grid">
      <article className="panel revenue-panel"><PanelHead title="Revenue intelligence" subtitle="12-month predicted order value" action="₹8.42L forecast" /><div className="chart-summary"><div><small>Portfolio growth</small><strong>+24.8%</strong></div><div className="legend"><i /> Predicted revenue</div></div><Bars /></article>
      <article className="panel"><PanelHead title="Customer pulse" subtitle="Top accounts by predicted value" action="4 active" />
        <div className="customer-list">{customers.map((c, i) => <div className="customer-row" key={c.name}><div className={`avatar av-${i}`}>{c.initials}</div><div className="grow"><strong>{c.name}</strong><span>{c.city} · Health {c.health}%</span></div><div className="align-right"><strong>{money(c.value)}</strong><span className="positive">{c.trend}</span></div></div>)}</div>
      </article>
      <article className="panel attention"><PanelHead title="Needs attention" subtitle="Prioritized by business impact" action="3 items" />
        <button onClick={() => navigate('forecast')}><span className="attention-icon red"><Sparkles size={18}/></span><span><strong>2 forecasts are overdue</strong><small>Potential value ₹48,600</small></span><ArrowRight size={17}/></button>
        <button onClick={() => navigate('sales')}><span className="attention-icon amber"><Target size={18}/></span><span><strong>3 follow-ups due today</strong><small>Pipeline value ₹3.25L</small></span><ArrowRight size={17}/></button>
        <button onClick={() => navigate('delivery')}><span className="attention-icon blue"><Truck size={18}/></span><span><strong>Next route leaves at 11:15</strong><small>4 remaining stops</small></span><ArrowRight size={17}/></button>
      </article>
      <article className="panel"><PanelHead title="Recent activity" subtitle="Across your operation" action="Today" /><div className="timeline">{activity.map(([title, desc, time], i) => <div key={title}><i className={`dot d-${i}`}/><span><strong>{title}</strong><small>{desc}</small></span><time>{time}</time></div>)}</div></article>
    </section>
  </>
}

function PanelHead({ title, subtitle, action }: { title: string; subtitle: string; action: string }) {
  return <header className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div><Badge>{action}</Badge></header>
}

function Forecast() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const rows = useMemo(() => forecasts.filter(f => `${f.customer} ${f.product}`.toLowerCase().includes(query.toLowerCase())), [query])
  return <PageShell eyebrow="Predictive intelligence" title="Reorder forecast" description="Know what each customer is likely to order—and when—before the request arrives.">
    <section className="metrics-grid compact"><Metric icon={Sparkles} label="Due this month" value="86" note="Across 31 customers"/><Metric icon={CircleDollarSign} label="Predicted value" value="₹8.42L" note="94% confidence band" tone="violet"/><Metric icon={PackageCheck} label="Units forecast" value="1,284" note="18 product categories" tone="green"/><Metric icon={CalendarDays} label="Avg. lead time" value="6.4 days" note="Order to delivery" tone="amber"/></section>
    <article className="panel table-panel"><div className="table-toolbar"><div><h2>Upcoming orders</h2><p>Ranked by predicted order date and confidence</p></div><label className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customer or product" /></label></div>
      <div className="table-scroll"><table><thead><tr><th>Customer & product</th><th>Predicted date</th><th>Quantity</th><th>Confidence</th><th>Order value</th><th>Status</th></tr></thead><tbody>{rows.map((f, i) => <tr key={`${f.customer}-${f.product}`} onClick={() => setSelected(i)} className={selected === i ? 'selected' : ''}><td><strong>{f.customer}</strong><small>{f.product}</small></td><td>{f.due}</td><td>{f.qty} units</td><td><div className="confidence"><span style={{width:`${f.confidence}%`}}/><em>{f.confidence}%</em></div></td><td><strong>{money(f.value)}</strong></td><td><Badge tone={f.status === 'Due now' ? 'red' : f.status === 'Watch' ? 'amber' : 'mint'}>{f.status}</Badge></td></tr>)}</tbody></table></div>
    </article>
  </PageShell>
}

function Purchase() {
  const [view, setView] = useState<'product'|'vendor'>('product')
  return <PageShell eyebrow="Inventory planning" title="Purchase forecast" description="Translate predicted demand into an actionable, vendor-ready purchase plan.">
    <section className="purchase-hero"><div><small>ESTIMATED OCTOBER PURCHASE</small><strong>₹4,29,020</strong><span>Including 5% GST · 290 units across 4 categories</span></div><div className="ring"><span>73%</span><small>covered</small></div></section>
    <div className="segmented"><button className={view==='product'?'active':''} onClick={()=>setView('product')}>By product</button><button className={view==='vendor'?'active':''} onClick={()=>setView('vendor')}>By vendor</button></div>
    <section className="purchase-grid">{purchaseItems.map((p, i) => <article className="panel product-card" key={p.product}><div className={`product-icon p-${i}`}><Boxes size={22}/></div><Badge tone={p.cover < 10 ? 'red':'mint'}>{p.cover} days cover</Badge><h3>{view === 'product' ? p.product : p.vendor}</h3><p>{view === 'product' ? p.vendor : p.product}</p><div className="product-stat"><span><small>ORDER</small><strong>{p.qty} {p.unit}</strong></span><span><small>EST. COST</small><strong>{money(p.cost)}</strong></span></div><div className="stock"><span style={{width:`${Math.min(p.cover*5, 95)}%`}}/></div></article>)}</section>
  </PageShell>
}

function Sales() {
  const stages = ['Discovery','Qualified','Proposal','Negotiation']
  return <PageShell eyebrow="Revenue operations" title="Sales CRM" description="Keep opportunities, products, order history, and next actions together.">
    <section className="metrics-grid compact"><Metric icon={Target} label="Open pipeline" value="₹5.17L" note="4 active opportunities"/><Metric icon={TrendingUp} label="Weighted value" value="₹3.08L" note="↑ 18% this quarter" tone="green"/><Metric icon={Users} label="New accounts" value="12" note="Last 30 days" tone="violet"/><Metric icon={Activity} label="Tasks due" value="7" note="3 due today" tone="amber"/></section>
    <section className="kanban">{stages.map(stage => <div className="kanban-col" key={stage}><header><strong>{stage}</strong><span>{opportunities.filter(o=>o.stage===stage).length}</span></header>{opportunities.filter(o=>o.stage===stage).map(o=><article key={o.company}><div className="company-icon"><Building2 size={18}/></div><Badge tone={stage==='Negotiation'?'amber':'blue'}>{stage}</Badge><h3>{o.company}</h3><p>{o.contact}</p><strong className="deal-value">{money(o.value)}</strong><footer><span>{o.next}</span><time>{o.date}</time></footer></article>)}</div>)}</section>
  </PageShell>
}

function Delivery() {
  const [completed, setCompleted] = useState<string[]>(['SO-10482'])
  return <PageShell eyebrow="Last-mile operations" title="Delivery route" description="Plan stops, keep drivers aligned, and capture completion in one mobile-ready workflow.">
    <section className="route-summary"><div><Badge tone="mint">Route in progress</Badge><h2>Kochi central · Morning run</h2><p><CalendarDays size={15}/> October 8, 2026 <span/> <Truck size={15}/> KL-07-AB-4281</p></div><div className="route-progress"><strong>{completed.length}<span>/4</span></strong><small>stops complete</small><div><span style={{width:`${completed.length*25}%`}}/></div></div></section>
    <section className="route-layout"><article className="panel route-list"><PanelHead title="Today's stops" subtitle="Optimized sequence · 18.4 km" action="4 stops" />{deliveries.map((d,i)=>{const done=completed.includes(d.order);return <div className={`stop ${done?'done':''}`} key={d.order}><div className="stop-seq">{done?<Check size={16}/>:i+1}</div><div className="stop-time"><strong>{d.time}</strong><span>{d.place}</span></div><div className="grow"><strong>{d.customer}</strong><span>{d.order} · {money(d.amount)}</span></div><Badge tone={done?'mint':i===1?'blue':'gray'}>{done?'Delivered':d.state}</Badge>{!done&&<button className="icon-btn" aria-label={`Complete ${d.order}`} onClick={()=>setCompleted([...completed,d.order])}><Check size={16}/></button>}</div>})}</article>
      <article className="map-card"><div className="map-grid"/><div className="road r1"/><div className="road r2"/><div className="road r3"/>{deliveries.map((d,i)=><div className={`pin pin-${i} ${completed.includes(d.order)?'pin-done':''}`} key={d.order}><span>{completed.includes(d.order)?<Check size={13}/>:i+1}</span><label>{d.customer}</label></div>)}<div className="map-caption"><Route size={18}/><div><strong>18.4 km · 42 min</strong><small>Estimated route time</small></div></div></article>
    </section>
  </PageShell>
}

function PageShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <><header className="page-title"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><Badge tone="mint"><span className="pulse"/> Sample data</Badge></header>{children}</>
}

export default function App() {
  const [page, setPage] = useState<Page>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = (id: Page) => { setPage(id); setMobileOpen(false); window.scrollTo({top:0,behavior:'smooth'}) }
  const content = page === 'overview' ? <Overview navigate={navigate}/> : page === 'forecast' ? <Forecast/> : page === 'purchase' ? <Purchase/> : page === 'sales' ? <Sales/> : <Delivery/>
  return <div className="app-shell">
    <aside className={mobileOpen?'open':''}><div className="aside-top"><Brand/><button className="mobile-close" onClick={()=>setMobileOpen(false)}><X/></button></div><nav>{nav.map(item=><button key={item.id} className={page===item.id?'active':''} onClick={()=>navigate(item.id)}><item.icon size={19}/><span>{item.label}</span>{page===item.id&&<i/>}</button>)}</nav><div className="demo-note"><Command size={18}/><div><strong>Portfolio demo</strong><span>Fictional data · Frontend only</span></div></div><a className="github" href="https://github.com/Shadil-dev" target="_blank" rel="noreferrer"><Code2 size={18}/> View on GitHub <ArrowRight size={15}/></a><div className="profile"><div>SD</div><span><strong>Shadi</strong><small>Product builder</small></span><ChevronDown size={16}/></div></aside>
    {mobileOpen&&<div className="scrim" onClick={()=>setMobileOpen(false)}/>}<main><header className="topbar"><button className="menu" onClick={()=>setMobileOpen(true)}><Menu/></button><div className="mobile-brand"><Brand/></div><label className="global-search"><Search size={17}/><input placeholder="Search OrderSense"/><kbd>⌘ K</kbd></label><Badge tone="mint"><span className="pulse"/> Demo mode</Badge></header><div className="content">{content}<footer className="site-footer"><span>OrderSense interactive portfolio demo</span><span>Designed & built by Shadi · All data is fictional</span></footer></div></main>
  </div>
}
