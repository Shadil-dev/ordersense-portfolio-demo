export const customers = [
  { name: 'Harbor House', city: 'Kochi', value: 184200, health: 92, trend: '+18%', initials: 'HH' },
  { name: 'Meridian Grand', city: 'Bengaluru', value: 156480, health: 87, trend: '+11%', initials: 'MG' },
  { name: 'Copper Kitchen', city: 'Chennai', value: 119800, health: 76, trend: '+6%', initials: 'CK' },
  { name: 'The Green Table', city: 'Hyderabad', value: 98400, health: 83, trend: '+9%', initials: 'GT' },
]

export const forecasts = [
  { customer: 'Harbor House', product: 'Premium Basmati Rice · 25 kg', due: 'Today', qty: 18, confidence: 94, value: 34200, status: 'Due now' },
  { customer: 'Meridian Grand', product: 'Sunflower Cooking Oil · 15 L', due: 'Tomorrow', qty: 12, confidence: 89, value: 26400, status: 'Upcoming' },
  { customer: 'Copper Kitchen', product: 'Takeaway Containers · 500 pcs', due: 'Oct 11', qty: 24, confidence: 86, value: 22800, status: 'Upcoming' },
  { customer: 'The Green Table', product: 'Arabica Coffee Beans · 1 kg', due: 'Oct 13', qty: 30, confidence: 81, value: 20400, status: 'Upcoming' },
  { customer: 'Harbor House', product: 'Coconut Milk · 1 L', due: 'Oct 15', qty: 48, confidence: 78, value: 8640, status: 'Watch' },
]

export const purchaseItems = [
  { product: 'Premium Basmati Rice', vendor: 'Harvest Supply Co.', qty: 96, unit: 'bags', cost: 182400, cover: 12 },
  { product: 'Sunflower Cooking Oil', vendor: 'Kitchen Essentials', qty: 68, unit: 'tins', cost: 149600, cover: 9 },
  { product: 'Takeaway Containers', vendor: 'Packworks India', qty: 42, unit: 'cases', cost: 39900, cover: 18 },
  { product: 'Arabica Coffee Beans', vendor: 'Malabar Coffee Works', qty: 84, unit: 'packs', cost: 57120, cover: 14 },
]

export const opportunities = [
  { company: 'Palm Grove Resorts', contact: 'Aarav Menon', stage: 'Proposal', value: 145000, next: 'Review pricing', date: 'Today' },
  { company: 'Northside Café', contact: 'Diya Nair', stage: 'Qualified', value: 68000, next: 'Product tasting', date: 'Oct 10' },
  { company: 'Riverside Banquets', contact: 'Kabir Shah', stage: 'Negotiation', value: 212000, next: 'Terms approval', date: 'Oct 11' },
  { company: 'Blue Plate Kitchens', contact: 'Meera Rao', stage: 'Discovery', value: 92000, next: 'Requirements call', date: 'Oct 14' },
]

export const deliveries = [
  { time: '09:00', customer: 'Harbor House', place: 'Fort Kochi', order: 'SO-10482', amount: 42600, state: 'Delivered' },
  { time: '11:15', customer: 'The Green Table', place: 'Marine Drive', order: 'SO-10491', amount: 18400, state: 'In transit' },
  { time: '13:30', customer: 'Meridian Grand', place: 'MG Road', order: 'SO-10495', amount: 38750, state: 'Next stop' },
  { time: '15:45', customer: 'Copper Kitchen', place: 'Panampilly Nagar', order: 'SO-10503', amount: 22100, state: 'Planned' },
]

export const activity = [
  ['Order predicted', 'Harbor House · Basmati Rice', '8 min ago'],
  ['Payment received', 'Meridian Grand · ₹38,750', '34 min ago'],
  ['Deal advanced', 'Palm Grove Resorts · Proposal', '1 hr ago'],
  ['Delivery completed', 'Harbor House · SO-10482', '2 hrs ago'],
]
