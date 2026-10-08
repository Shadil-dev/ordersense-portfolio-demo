import { useState } from 'react';

export default function FollowupDatePicker({ value, onChange, label = 'Manual next followup date' }: { value: string; onChange: (date: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const initial = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const iso = (day: number) => `${String(month.getFullYear()).padStart(4, '0')}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return <div className="followup-picker">
    <label>{label}<input required type="text" placeholder="YYYY-MM-DD" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" title="Enter a date as YYYY-MM-DD" value={value} onChange={e => onChange(e.target.value)} /></label>
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close calendar' : 'Choose from calendar'}</button>
    {open && <div className="followup-calendar" role="group" aria-label={`Choose ${label.toLowerCase()}`}>
      <div className="calendar-heading"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><strong aria-live="polite">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div>
      <div className="calendar-days">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <small key={d}>{d}</small>)}
        {Array.from({ length: month.getDay() }, (_, i) => <span key={`blank${i}`} />)}
        {Array.from({ length: days }, (_, i) => <button type="button" key={i} aria-label={`Select ${iso(i + 1)}`} aria-pressed={value === iso(i + 1)} onClick={() => { onChange(iso(i + 1)); setOpen(false); }}>{i + 1}</button>)}
      </div>
    </div>}
  </div>;
}
