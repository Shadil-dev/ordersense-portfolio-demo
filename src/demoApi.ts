const today = new Date()
const iso = (offset = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset).toLocaleDateString('en-CA')
const stamp = (offset = 0) => `${iso(offset)}T10:30:00`

const customerNames = ['Harbor House', 'The Green Table', 'Meridian Grand Hotel', 'Copper Kitchen', 'Northside Café', 'Palm Grove Resorts']
const productNames = ['Premium Basmati Rice · 25 kg', 'Sunflower Cooking Oil · 15 L', 'Takeaway Containers · 500 pcs', 'Arabica Coffee Beans · 1 kg']

const predictions = Array.from({ length: 18 }, (_, index) => ({
  id: 9000 + index,
  customerId: `DEMO-C${(index % 6) + 1}`,
  customerName: customerNames[index % customerNames.length],
  customerStatus: index === 17 ? 'inactive' : 'active',
  productId: `DEMO-P${(index % 4) + 1}`,
  productName: productNames[index % productNames.length],
  manufacturer: ['Harvest Foods', 'Suncrest Oils', 'Packworks India', 'Malabar Coffee Works'][index % 4],
  preferredVendor: ['Harvest Supply Co.', 'Kitchen Essentials', 'Packworks India', 'Malabar Coffee Works'][index % 4],
  costPrice: [1800, 2100, 950, 680][index % 4],
  avgDaysBetweenOrders: [7, 14, 21, 10][index % 4],
  lastOrderDate: iso(-10 - index),
  predictedOrderDate: iso([-3, 0, 1, 2, 4, 7, 9, 12][index % 8]),
  daysUntilPredicted: [-3, 0, 1, 2, 4, 7, 9, 12][index % 8],
  lastQtyOrdered: 10 + index * 2,
  avgQty: 12 + index * 2,
  predictedQty: 14 + index * 2,
  qtyTrend: ['up', 'flat', 'down'][index % 3],
  cycleConfidence: .72 + (index % 4) * .06,
  qtyConfidence: .78 + (index % 3) * .05,
  totalOrders: 7 + index,
  alertSent: index % 3 === 0,
  alertSentAt: index % 3 === 0 ? stamp(-1) : null,
  updatedAt: stamp(),
}))

const alerts = [
  { customerId:'DEMO-C1', customerName:'Harbor House', invoiceReference:'INV-1042', invoiceDate:iso(-48), invoiceAmount:68400, salesperson:'Ananya Rao', outstandingTotal:118400, pendingInvoiceCount:2, lastInvoiceDate:iso(-22), unpaidInvoices:[{invoiceReference:'INV-1042',invoiceDate:iso(-48),invoiceAmount:68400,paymentStatus:'overdue',salesperson:'Ananya Rao'},{invoiceReference:'INV-1098',invoiceDate:iso(-22),invoiceAmount:50000,paymentStatus:'unpaid',salesperson:'Ananya Rao'}], daysOverdue:18, billingAddress:'Fort Kochi, Kerala', priority:'CRITICAL', alertReason:'CREDIT_LIMIT_EXCEEDED', lastFollowup:{channel:'CALL',response:'Accounts team promised payment this week.',nextFollowupDate:iso(),followupBy:'finance@demo.local'} },
  { customerId:'DEMO-C2', customerName:'The Green Table', invoiceReference:'INV-1114', invoiceDate:iso(-31), invoiceAmount:42750, salesperson:'Vikram Sen', outstandingTotal:42750, pendingInvoiceCount:1, lastInvoiceDate:iso(-31), unpaidInvoices:[{invoiceReference:'INV-1114',invoiceDate:iso(-31),invoiceAmount:42750,paymentStatus:'overdue',salesperson:'Vikram Sen'}], daysOverdue:10, billingAddress:'Marine Drive, Kochi', priority:'HIGH', alertReason:'PAYMENT_REVIEW', lastFollowup:{channel:'WHATSAPP',response:'Requested invoice copy.',nextFollowupDate:iso(1),followupBy:'finance@demo.local'} },
  { customerId:'DEMO-C3', customerName:'Meridian Grand Hotel', invoiceReference:'INV-1130', invoiceDate:iso(-18), invoiceAmount:96300, salesperson:'Ananya Rao', outstandingTotal:96300, pendingInvoiceCount:1, lastInvoiceDate:iso(-18), unpaidInvoices:[{invoiceReference:'INV-1130',invoiceDate:iso(-18),invoiceAmount:96300,paymentStatus:'unpaid',salesperson:'Ananya Rao'}], daysOverdue:3, billingAddress:'MG Road, Bengaluru', priority:'MEDIUM', alertReason:'FOLLOWUP_DUE' },
]

const opportunities = [
  {id:301,accountId:101,accountName:'Palm Grove Resorts',ownerEmail:'sales@demo.local',viewerRelationships:['OWNER'],origin:'NEW_CUSTOMER',pipelineMonthlyValue:145000,outletCount:3,expectedValue:145000,leadDirection:'INBOUND',leadSource:'Website',stage:'PROPOSAL',state:'ACTIVE',ownerId:1,priority:'KEY_STRATEGIC',version:2,createdAt:stamp(-18),expectedResponseDate:iso(2),reactivationDate:null},
  {id:302,accountId:102,accountName:'Northside Café',ownerEmail:'sales@demo.local',viewerRelationships:['OWNER'],origin:'NEW_CUSTOMER',pipelineMonthlyValue:68000,outletCount:2,expectedValue:68000,leadDirection:'OUTBOUND',leadSource:'Referral',stage:'QUALIFIED',state:'ACTIVE',ownerId:1,priority:'HIGH',version:1,createdAt:stamp(-9),expectedResponseDate:iso(4),reactivationDate:null},
  {id:303,accountId:103,accountName:'Riverside Banquets',ownerEmail:'manager@demo.local',viewerRelationships:['COLLABORATOR'],origin:'EXISTING_CUSTOMER_EXPANSION',pipelineMonthlyValue:212000,outletCount:4,expectedValue:212000,leadDirection:'OUTBOUND',leadSource:'Account review',stage:'NEGOTIATION',state:'ACTIVE',ownerId:2,priority:'HIGH',version:4,createdAt:stamp(-28),expectedResponseDate:iso(1),reactivationDate:null},
  {id:304,accountId:104,accountName:'Blue Plate Kitchens',ownerEmail:null,viewerRelationships:['WATCHER'],origin:'NEW_CUSTOMER',pipelineMonthlyValue:92000,outletCount:2,expectedValue:92000,leadDirection:'INBOUND',leadSource:'Trade show',stage:'DISCOVERY',state:'ACTIVE',ownerId:null,priority:'NORMAL',version:1,createdAt:stamp(-5),expectedResponseDate:iso(7),reactivationDate:null},
]

const accounts = opportunities.map(o => ({ id:o.accountId, name:o.accountName, location:['Kochi','Bengaluru','Chennai','Hyderabad'][o.id % 4], zohoCustomerId:o.origin === 'EXISTING_CUSTOMER_EXPANSION' ? `ZC-${o.accountId}` : null }))
const page = <T,>(content:T[]) => ({ content, totalPages:1, totalElements:content.length, number:0 })

const metric = (key:string,label:string,value:number,previous:number,unit='number') => ({key,label,value,previous,unit,available:true,definition:`Demo definition for ${label.toLowerCase()}.`,target:null})
const taskStats = {due:12,completed:10,onTime:9,missed:2,coverage:83,onTimeRate:90}
const ceoDashboard = {
  preview:true, asOf:stamp(), period:{from:iso(-6),to:iso()}, previous:{from:iso(-13),to:iso(-7)},
  metrics:[metric('newCustomers','New customers',4,3),metric('orderValue','Order value',842000,761000,'money'),metric('orders','Orders',86,74),metric('buyers','Buying customers',31,28),metric('repeatRate','Repeat rate',74,69,'percent'),metric('salesCoverage','Sales coverage',88,81,'percent'),metric('salesOnTime','Sales on time',92,86,'percent'),metric('receipts','Receipts',618000,552000,'money'),metric('invoicedValue','Invoiced value',784000,712000,'money'),metric('outstanding','Outstanding',318000,346000,'money'),metric('overdue','Overdue',111150,128000,'money'),metric('creditExcess','Credit excess',68400,79000,'money'),metric('financeCoverage','Finance coverage',91,84,'percent'),metric('financeOnTime','Finance on time',87,80,'percent'),metric('grossMargin','Gross margin',31,29,'percent'),metric('deliveryOnTime','Delivery on time',94,89,'percent'),metric('deliveryCollections','Delivery collections',128000,94000,'money'),metric('lateReorders','Late reorders',5,8)],
  trends:Array.from({length:7},(_,i)=>({from:iso(-6+i),to:iso(-6+i),partial:false,orderValue:76000+i*9100,receipts:52000+i*7200,sales:taskStats,finance:taskStats})),
  attention:[{department:'Sales',customerId:'DEMO-C1',customerName:'Harbor House',title:'Reorder overdue',detail:'Basmati rice is 3 days past predicted date.',amount:34200,daysLate:3,owner:'Ananya Rao'},{department:'Finance',customerId:'DEMO-C1',customerName:'Harbor House',title:'Credit limit exceeded',detail:'Review before accepting the next order.',amount:68400,daysLate:18,owner:'Finance team'},{department:'Sales',customerId:'DEMO-C2',customerName:'The Green Table',title:'Follow-up due',detail:'Customer requested a call today.',amount:22800,daysLate:0,owner:'Vikram Sen'}],
  customers:customerNames.slice(0,5).map((name,i)=>({customerId:`DEMO-C${i+1}`,customerName:name,daysSinceOrder:5+i*4,onboardedAt:iso(-240+i*20),orderValue:184200-i*17800,orderCount:18-i,lastOrderDate:iso(-5-i*4),outstanding:[118400,42750,96300,35500,25000][i],overdue:[68400,42750,0,0,0][i],lateReorders:i%3,creditLimit:100000,creditUtilization:[118,43,96,36,25][i]})),
  lostCustomers:[], team:[{owner:'Ananya Rao',department:'Sales',...taskStats,logged:18,backlog:2},{owner:'Vikram Sen',department:'Sales',...taskStats,logged:15,backlog:3},{owner:'Finance team',department:'Finance',...taskStats,logged:22,backlog:4}],
  tasks:[{key:'T1',department:'Sales',customerId:'DEMO-C1',customerName:'Harbor House',subjectName:'Basmati reorder call',owner:'Ananya Rao',dueDate:iso(),completedAt:'',resolvedAt:'',createdAt:stamp(-2)},{key:'T2',department:'Finance',customerId:'DEMO-C2',customerName:'The Green Table',subjectName:'Payment confirmation',owner:'Finance team',dueDate:iso(1),completedAt:'',resolvedAt:'',createdAt:stamp(-1)}],
  ageing:{current:142000,'1-30':88000,'31-60':54000,'61-90':21000,'90+':13000},concentration:42,
  demand:productNames.map((name,i)=>({productId:`DEMO-P${i+1}`,productName:name,vendor:['Harvest Supply Co.','Kitchen Essentials','Packworks India','Malabar Coffee Works'][i],manufacturer:['Harvest Foods','Suncrest','Packworks','Malabar Coffee'][i],qty7:24+i*8,qty14:48+i*12,qty30:96+i*18,estimatedCost:[172800,142800,39900,57120][i],missingCost:false})),
  promises:[{customerId:'DEMO-C1',customerName:'Harbor House',invoiceReference:'INV-1042',promiseDate:iso(2),promiseAmount:68400,receivedByPromise:0,shortfall:68400,broken:false,verified:false}],reconciliation:[],
  data:{tracking:{startedAt:stamp(-120)},invoiceSync:{lastSuccess:stamp()},paymentSync:{lastSuccess:stamp()},customerSync:{lastSuccess:stamp()},receivablesAvailable:true,accountingAvailable:true,arRefreshedAt:stamp(),missingOrderPrices:0,suppressedPairs:2},
  forecastAccuracy:{evaluated:126,matched:112,matchRate:88.9,meanDateErrorDays:2.3,meanQuantityErrorPercent:8.4},outcomes:{salesMature:32,salesConverted:24,salesRate:75,financeMature:28,financeRecovered:23,financeRate:82},
  products:productNames.map((name,i)=>({productId:`DEMO-P${i+1}`,productName:name,value:184000-i*21000,quantity:96-i*12,previousValue:165000-i*18000})),balanceHistory:Array.from({length:8},(_,i)=>({date:iso(-7+i),outstanding:380000-i*9000})),collectionRecovery:{openingOverdue:148000,recovered:36850,recoveryRate:24.9},deliverySummary:{scheduled:18,delivered:15,partial:1,failed:0,proofCoverage:87},contactStats:{classified:31,reached:27,reachRate:87,unclassified:4},customerChanges:[]
}

const crmAnalytics = {from:iso(-30),to:iso(),prospectsAdded:12,expansionsAdded:7,activeMonthlyPipelineINR:517000,weightedMonthlyPipelineINR:308000,winRate:38,partialWins:2,productLineConversion:46,wonMonthlyValueINR:184000,salesVelocityINRMonthlyValuePerDay:8400,pipelineUnknownOrZeroValueCount:1,approaches:42,firstApproach:1.4,assignmentToFirstApproach:2.1,followupCompliance:89,cancelledTasks:2,demosBooked:8,demosCompleted:6,demoBooking:44,demoCompletion:75,demoNoShow:8,stageConversion:62,salesCycle:18,wonToFirstOrder:7,orderMatchReviewRequired:1,disqualified:3,averageWonDealMonthlyValueINR:61300,leadDirectionByMonth:{[iso().slice(0,7)]:{inbound:7,outbound:5,unknown:1}},convention:'Fictional portfolio data.',leadDirectionConvention:'Direction reflects who initiated the opportunity.'}

const followupAlerts = predictions.slice(0,6).map((p,i)=>({customerId:p.customerId,customerName:p.customerName,productId:p.productId,productName:p.productName,predictedOrderDate:p.predictedOrderDate,daysUntilPredicted:p.daysUntilPredicted,lastOrderDate:p.lastOrderDate,followupDueDate:iso(i-2),daysLate:Math.max(0,2-i),priority:i<2?'OVERDUE':i===2?'DUE_TODAY':'UPCOMING',lastFollowupSummary:i===1?'Asked for updated price list.':undefined,lastFollowup:i===1?{followupBy:'sales@demo.local'}:undefined}))

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}})}

export function installDemoApi(){
  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (input:RequestInfo|URL, init?:RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const url = new URL(raw, window.location.origin)
    if (!url.pathname.startsWith('/api')) return nativeFetch(input,init)
    const path = url.pathname.replace(/^\/api/,'')
    const method = (init?.method || 'GET').toUpperCase()
    if (path === '/predictions') return json(predictions)
    if (path === '/orders') return json(248)
    if (path === '/accounts/alerts') return json(alerts)
    if (path === '/ceo/dashboard') return json(ceoDashboard)
    if (path === '/ceo/owners') return json(['Ananya Rao','Vikram Sen','Finance team'])
    if (/^\/ceo\/customers\//.test(path)) return json([{type:'ORDER',at:stamp(-5),title:'Order SO-10482',owner:'Ananya Rao',amount:34200,detail:{status:'confirmed'},contact:null},{type:'FOLLOWUP',at:stamp(-2),title:'Reorder call',owner:'Ananya Rao',amount:null,detail:{nextFollowupDate:iso()},contact:{outcome:'REACHED'}}])
    if (path === '/sales/analytics') return json(crmAnalytics)
    if (path === '/sales/capabilities') return json({userId:1,permissions:['MANAGE_PIPELINE','ASSIGN_OPPORTUNITY','MERGE_ACCOUNTS','CONFIRM_ORDER_MATCH']})
    if (path === '/sales/eligible-owners') return json([{id:1,email:'sales@demo.local'},{id:2,email:'manager@demo.local'}])
    if (path === '/sales/opportunities' || path === '/sales/focus') return json(page(opportunities))
    if (path === '/sales/tasks') return json(page([{id:501,opportunityId:301,assigneeId:1,description:'Review pricing with Palm Grove',dueAt:stamp(),status:'OPEN'},{id:502,opportunityId:302,assigneeId:1,description:'Prepare product tasting',dueAt:stamp(1),status:'OPEN'}]))
    if (path === '/sales/operations') return json(page([{id:601,opportunityId:301,kind:'DEMO',status:'SCHEDULED',scheduledAt:stamp(2),details:'Chef tasting session'}]))
    if (path === '/sales/notifications') return json(page([{id:701,opportunityId:303,message:'Riverside Banquets moved to negotiation',readAt:null}]))
    if (path === '/sales/accounts') return json(page(accounts))
    const opportunityMatch = path.match(/^\/sales\/opportunities\/(\d+)$/)
    if (opportunityMatch) { const opportunity=opportunities.find(o=>o.id===Number(opportunityMatch[1]))||opportunities[0]; const account=accounts.find(a=>a.id===opportunity.accountId)||accounts[0]; return json({opportunity,account,products:[{id:801,description:'Premium Basmati Rice',outcome:'ACTIVE',fulfillment:'PENDING',expectedMonthlyValue:72000,stage:'PROPOSAL',version:1,zohoProductId:'DEMO-P1',expectedQuantity:40,outletCount:opportunity.outletCount}],tasks:[],memberships:[{userId:1,kind:'OWNER'}]}) }
    if (/^\/sales\/opportunities\/\d+\/timeline$/.test(path)) return json(page([]))
    if (/^\/sales\/opportunities\/\d+\/health$/.test(path)) return json({score:82,stale:false,reasons:['Next action is scheduled']})
    if (path === '/sales/catalog/search') return json({items:productNames.map((name,i)=>({productId:`DEMO-P${i+1}`,name,sku:`SKU-${i+1}`,unit:'case',salesRate:[2100,2350,950,680][i]})),hasMore:false,notice:null})
    if (path === '/sales-followups/alerts') return json(followupAlerts)
    if (path === '/sales-followups/history') return json([{log:{id:1,customerId:'DEMO-C2',customerName:'The Green Table',productId:'DEMO-P2',productName:productNames[1],channel:'CALL',response:'Confirmed likely order for next week.',followupBy:'sales@demo.local',followupDate:stamp(-1),nextFollowupMode:'AUTO',nextFollowupDate:iso(2),status:'FOLLOWED_UP'},editable:true}])
    if (path === '/sales-followups/team-activity') return json({asOf:stamp(),staff:[{followupBy:'sales@demo.local',customersHandled:14,followupsLogged:18,onTimeRate:92,lateFollowups:1,overdueCustomers:2,performanceScore:91},{followupBy:'manager@demo.local',customersHandled:11,followupsLogged:15,onTimeRate:87,lateFollowups:2,overdueCustomers:1,performanceScore:86}],lateEvents:[]})
    if (path === '/accounts/payment-promises') return json([])
    if (path === '/accounts/team-activity') return json({staff:[],recent:[]})
    if (path === '/accounts/followups') return json([])
    if (path === '/accounts/order-holds') return json([])
    if (path === '/predictions/suppressions') return json([])
    if (path === '/predictions/suppressions/audit') return json(page([]))
    if (path.startsWith('/admin/users')) return json([{id:1,email:'owner@demo.local',globalAccessLevel:'SUPER_ADMIN',departments:['SALES','FINANCE','OPERATIONS'],active:true}])
    if (path === '/admin/department-access') return json([])
    if (method !== 'GET') return json({ok:true,message:'Saved in this demo session.'})
    return json([])
  }
}
