import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeliveryOperationsPage from './DeliveryOperationsPage';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it('pulls latest Inventory orders without discarding manual route draft fields',async()=>{
 const user=userEvent.setup();
 const fetchMock=vi.fn(async()=>({ok:true,status:200,json:async()=>[]} as Response));
 vi.stubGlobal('fetch',fetchMock);
 render(<DeliveryOperationsPage api="/api" token="test" onExpired={()=>{}} canSchedule canReview isSuperAdmin/>);
 await user.click(screen.getByRole('button',{name:'Plan deliveries'}));
 await user.click(await screen.findByRole('button',{name:'+ Add stop'}));
 await user.type(screen.getByRole('textbox',{name:'Stop / customer / place (required)'}),'Cafe');
 await user.type(screen.getByRole('textbox',{name:/Product \/ sample name/}),'Sample');
 await user.type(screen.getByRole('textbox',{name:'Route name'}),'Travel route');
 await user.click(screen.getByRole('button',{name:'Add to route'}));
 await user.click(screen.getByRole('button',{name:'Pull latest orders from Zoho'}));
 await screen.findByText(/Latest Zoho orders pulled/);
 expect(fetchMock).toHaveBeenCalledWith('/api/delivery/orders-to-pack/pull',expect.objectContaining({method:'POST'}));
 expect(screen.getByRole('textbox',{name:'Route name'})).toHaveValue('Travel route');
 expect(screen.getByRole('textbox',{name:/Product \/ sample name/})).toHaveValue('Sample');
 expect(screen.getByRole('status')).toHaveTextContent('Added to route');
});

it('provides labelled manual fields and saves product, place and details in the existing route',async()=>{
 const user=userEvent.setup();
 const fetchMock=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
  void init; // Retain the request signature so assertions can inspect POST bodies.
  const url=String(input);
  const data=url.endsWith('/executives')?[{email:'manager@example.test',label:'Manager (You)',self:'true'}]:[];
  return {ok:true,status:200,json:async()=>data} as Response;
 });
 vi.stubGlobal('fetch',fetchMock);
 render(<DeliveryOperationsPage api="/api" token="test" onExpired={()=>{}} canSchedule canReview isSuperAdmin/>);
 await user.click(screen.getByRole('button',{name:'Plan deliveries'}));
 await user.click(await screen.findByRole('button',{name:'+ Add stop'}));
 const product=screen.getByRole('textbox',{name:/Product \/ sample name/});
 expect(product).toBeRequired();
 expect(screen.getByRole('button',{name:'Submit route'})).toBeDisabled();
 expect(screen.getByRole('textbox',{name:'Stop / customer / place (required)'})).toBeRequired();
 await user.type(screen.getByRole('textbox',{name:'Stop / customer / place (required)'}),'Sample destination');
 await user.type(product,'Marinade sample');
 await user.type(screen.getByRole('textbox',{name:/Google Maps pin/}),'https://evil.example.test');
 expect(screen.getByRole('button',{name:'Add to route'})).toBeDisabled();
 await user.clear(screen.getByRole('textbox',{name:/Google Maps pin/}));
 await user.type(screen.getByRole('textbox',{name:/Google Maps pin/}),'https://maps.app.goo.gl/example');
 await user.type(screen.getByRole('textbox',{name:'Delivery details / address'}),'Two bottles; reception desk');
 await user.type(screen.getByRole('textbox',{name:'Route name'}),'Sample route');
 await user.click(screen.getByRole('button',{name:'Assign to me'}));
 expect(screen.getByRole('button',{name:'Submit route'})).toBeDisabled();
 await user.click(screen.getByRole('button',{name:'Add to route'}));
 expect(screen.getByRole('status')).toHaveTextContent('Added to route');
 await user.type(product,' updated');
 expect(screen.getByRole('button',{name:'Submit route'})).toBeDisabled();
 await user.clear(product);
 await user.type(product,'Marinade sample');
 await user.click(screen.getByRole('button',{name:'Add to route'}));
 await user.click(screen.getByRole('button',{name:'Submit route'}));
 await waitFor(()=>expect(fetchMock.mock.calls.some(([,init])=>init?.method==='POST')).toBe(true));
 const post=fetchMock.mock.calls.find(([,init])=>init?.method==='POST')!;
 expect(JSON.parse(String(post[1]?.body))).toMatchObject({orderIds:[],stopSequence:['sample:0'],samples:[{sampleName:'Marinade sample',recipient:'Sample destination',address:'Two bottles; reception desk',googleMapsUrl:'https://maps.app.goo.gl/example'}]});
});

it('keeps separate confirmations per stop and removes the selected draft',async()=>{
 const user=userEvent.setup();
 render(<DeliveryOperationsPage api="/api" token="test" onExpired={()=>{}} canSchedule canReview isSuperAdmin preview/>);
 await user.click(screen.getByRole('button',{name:'Plan deliveries'}));
 await user.click(screen.getByRole('button',{name:'+ Add stop'}));
 await user.click(screen.getByRole('button',{name:'+ Add stop'}));
 const products=screen.getAllByRole('textbox',{name:/Product \/ sample name/});
 const first=products[0].closest('article')!;
 const second=products[1].closest('article')!;
 expect(within(first).getByRole('button',{name:'Add to route'})).toBeDisabled();
 await user.type(products[0],'First sample');
 expect(within(first).getByRole('button',{name:'Add to route'})).toBeDisabled();
 await user.type(within(first).getByRole('textbox',{name:'Stop / customer / place (required)'}),'Cafe');
 await user.click(within(first).getByRole('button',{name:'Add to route'}));
 expect(within(first).getByRole('status')).toHaveTextContent('Added to route');
 expect(within(second).getByRole('status')).toHaveTextContent('Draft');
 await user.click(within(second).getByRole('button',{name:/Remove manual stop/}));
 expect(screen.getAllByRole('textbox',{name:/Product \/ sample name/})).toHaveLength(1);
 expect(screen.getByText('0 orders · 1 manual stops · 0 drafts')).toBeInTheDocument();
});
