import type {ReactNode} from 'react';
export type CeoMetric={key:string;label:string;value:number|null;previous:number|null;unit:string;available:boolean;definition:string;target:number|null};
const groups=[
 {id:'revenue',title:'Revenue & customers',description:'Orders, buying customers and repeat business.',keys:['newCustomers','orderValue','orders','buyers','repeatRate']},
 {id:'crm',title:'Sales CRM',description:'Acquisition, expansion, pipeline and sales efficiency.',keys:[]},
 {id:'recurring',title:'Recurring sales',description:'Reorder follow-ups, contact discipline and repeat-order outcomes.',keys:['salesCoverage','salesOnTime']},
 {id:'finance',title:'Finance',description:'Receipts, invoice exposure, collections and follow-up efficiency.',keys:['receipts','invoicedValue','outstanding','overdue','creditExcess','financeCoverage','financeOnTime','grossMargin']},
 {id:'delivery',title:'Delivery',description:'Delivery execution and operational collection records.',keys:['deliveryOnTime','deliveryCollections']},
 {id:'planning',title:'Forecasting & planning',description:'Reorder signals, forecast quality and planned demand.',keys:['lateReorders']},
];
export default function CeoMetricGroups({metrics,renderMetric,extras}:{metrics:CeoMetric[];renderMetric:(metric:CeoMetric)=>ReactNode;extras:Record<string,ReactNode>}){
 return <div className="ceo-metric-groups"><nav className="ceo-group-links" aria-label="Metric groups">{groups.map(g=><a key={g.id} href={'#ceo-group-'+g.id}>{g.title}</a>)}</nav>{groups.map(g=><section key={g.id} id={'ceo-group-'+g.id} className="ceo-metric-group" aria-labelledby={'ceo-group-heading-'+g.id}><header className="ceo-group-heading"><div><h2 id={'ceo-group-heading-'+g.id}>{g.title}</h2><p>{g.description}</p></div></header>{g.keys.length>0&&<div className="ceo-metrics">{g.keys.map(key=>metrics.find(m=>m.key===key)).filter((m):m is CeoMetric=>!!m).map(m=>renderMetric({...m,label:m.key==='salesCoverage'?'Recurring follow-up coverage':m.key==='salesOnTime'?'Recurring follow-ups on time':m.label}))}</div>}{extras[g.id]}</section>)}</div>;
}
