import { useEffect, useRef, useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import './header-sync.css';

export default function HeaderSyncControl({ inventory, invoice, busy, onInventory, onInvoice }: {
  inventory: boolean; invoice: boolean; busy: boolean; onInventory: () => void; onInvoice: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const both = inventory && invoice;
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  if (!inventory && !invoice) return null;
  const choose = (action: () => void) => { setOpen(false); trigger.current?.focus(); action(); };
  return <div className="header-sync-control" ref={root} key={`${inventory}-${invoice}`}>
    <button ref={trigger} className="btn-primary btn-sync-header" disabled={busy}
      aria-label={busy ? 'Syncing Zoho data' : both ? 'Choose Zoho sync' : invoice ? 'Sync Zoho Invoice' : 'Sync Zoho Inventory'}
      aria-haspopup={both ? 'menu' : undefined} aria-expanded={both ? open : undefined}
      onClick={() => both ? setOpen(!open) : choose(invoice ? onInvoice : onInventory)}>
      <RefreshCw size={17} className={busy ? 'animate-spin' : ''} />
      <span className="btn-sync-text">{busy ? 'Syncing…' : both ? 'Sync' : invoice ? 'Sync Invoice' : 'Sync Inventory'}</span>
      {both && <ChevronDown className="header-sync-chevron" size={13} />}
    </button>
    {open && both && <div className="header-sync-menu" role="menu" aria-label="Choose Zoho data source" onKeyDown={event => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=menuitem]'));
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    }}>
      <button role="menuitem" onClick={() => choose(onInventory)}><strong>Zoho Inventory</strong><small>Orders, products and reorder forecasts</small></button>
      <button role="menuitem" onClick={() => choose(onInvoice)}><strong>Zoho Invoice</strong><small>Receivables and accounting data</small></button>
    </div>}
  </div>;
}
