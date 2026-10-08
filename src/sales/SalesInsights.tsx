const labels: Record<string,string> = {
  prospectsAdded: 'New prospects', expansionsAdded: 'Expansion opportunities', approaches: 'Contact attempts',
  winRate: 'Opportunity win rate', partialWins: 'Partial wins', disqualified: 'Disqualified',
  productLineConversion: 'Product conversion', firstApproach: 'Time to first approach', assignmentToFirstApproach: 'Assignment response time',
  stageConversion: 'Stage conversion', salesCycle: 'Sales cycle', followupCompliance: 'On-time follow-ups', cancelledTasks: 'Cancelled tasks',
  demosBooked: 'Demos booked', demosCompleted: 'Demos completed', demoBooking: 'Demo booking rate', demoCompletion: 'Demo completion rate', demoNoShow: 'Demo no-show rate',
  activeMonthlyPipelineINR: 'Active monthly pipeline', weightedMonthlyPipelineINR: 'Weighted monthly pipeline',
  wonMonthlyValueINR: 'Monthly value won', wonToFirstOrder: 'Won products with a first order', orderMatchReviewRequired: 'Orders awaiting review',
  pipelineUnknownOrZeroValueCount: 'Pipeline with unconfirmed value', averageWonDealMonthlyValueINR: 'Average won deal', salesVelocityINRMonthlyValuePerDay: 'Sales velocity',
};
const number = (v: number) => v.toLocaleString('en-IN',{maximumFractionDigits:1});
export function Metric({name,value}:{name:string;value:unknown}) {
  if (value == null) return <><strong>—</strong><small>Insufficient data for this period</small></>;
  if (typeof value === 'number') return <><strong>{name.includes('INR') ? `₹${number(value)}` : number(value)}</strong>{name.includes('Monthly') && <small>{name.includes('PerDay') ? 'Monthly value/day · INR' : 'Monthly value · INR'}</small>}</>;
  if (typeof value === 'object') {
    const v=value as Record<string,unknown>;
    if ('percent' in v) return <><strong>{v.percent == null ? '—' : `${number(Number(v.percent))}%`}</strong><small>{String(v.numerator)} of {String(v.denominator)} eligible records</small></>;
    if ('meanDays' in v) return <><strong>{v.meanDays == null ? '—' : `${number(Number(v.meanDays))} days`}</strong><small>Median {v.medianDays == null ? '—' : number(Number(v.medianDays))} days · {String(v.count)} records</small></>;
    if ('cohort' in v) return <><Metric name={name} value={v.cohort}/><small>{String(v.starting).toLowerCase()} → {String(v.milestone).toLowerCase()}</small></>;
  }
  return <small>{String(value)}</small>;
}
export default function SalesInsights({data}:{data:Record<string,unknown>}) {
  return <><p>Reporting period: {String(data.from)} to {String(data.to)}</p><div className="crm-grid crm-insights">{Object.entries(labels).filter(([key])=>key in data).map(([key,title])=><article key={key}><small>{title}</small><Metric name={key} value={data[key]}/></article>)}</div><section className="crm-panel"><h3>Inbound and outbound over time</h3><p>{String(data.leadDirectionConvention || '')}</p><div className="crm-grid">{Object.entries((data.leadDirectionByMonth || {}) as Record<string,{inbound:unknown;outbound:unknown;unknown:number}>).map(([month,v])=><article key={month}><h4>{month}</h4><p>Inbound</p><Metric name="inbound" value={v.inbound}/><p>Outbound</p><Metric name="outbound" value={v.outbound}/><small>Unknown: {v.unknown}</small></article>)}</div></section><section className="crm-panel"><details><summary>How these figures are calculated</summary><p>{String(data.convention || '')}</p>{['stageWeights','firstOrderByAge'].map(key=><details key={key}><summary>{key==='stageWeights'?'Pipeline weights and evidence':'First order realization by age'}</summary><pre>{JSON.stringify(data[key],null,2)}</pre></details>)}</details></section></>;
}
