import { useEffect, useState } from 'react'
import { TABLES } from './scene/layout.js'
import { useMenuCatalog } from './menuCatalog.js'
import { addBooking, useBookings, todayStr } from './bookings.js'

const TIMES = Array.from({ length: 24 }, (_, i) => `${String(12 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)
const AREAS = [...new Set(TABLES.map((t) => t.area))]
const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

export default function Reserve({ open, onClose, initialArea }) {
  const all = useBookings()
  const menus = useMenuCatalog()
  const ITEMS = menus.flatMap((m) => m.items.filter((i) => /\d/.test(i[2])).map(([n, d, p]) => ({ n, d, p: +p.replace(/[^\d]/g, '') })))
  const blank = { name: '', phone: '', date: todayStr(), time: '20:00', guests: 2, area: initialArea || AREAS[0], tableId: '', note: '' }
  const [f, setF] = useState(blank)
  const [order, setOrder] = useState({})
  const [err, setErr] = useState({})
  const [done, setDone] = useState(null)
  useEffect(() => { if (open && initialArea) setF((x) => ({ ...x, area: initialArea })) }, [open, initialArea])
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  const taken = (id) => all.some((b) => b.tableId === id && b.status !== 'done' && b.date === f.date && b.time === f.time)
  const opts = TABLES.filter((t) => t.area === f.area)
  const table = opts.find((t) => t.id === f.tableId && !taken(t.id)) || opts.find((t) => !taken(t.id))
  const lines = ITEMS.filter((i) => order[i.n] > 0).map((i) => ({ ...i, q: order[i.n] }))
  const total = lines.reduce((s, o) => s + o.q * o.p, 0)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const step = (n, d) => setOrder((o) => ({ ...o, [n]: Math.max(0, (o[n] || 0) + d) }))
  const submit = (e) => {
    e.preventDefault()
    const er = {}
    if (f.name.trim().length < 2) er.name = 'Please enter your name'
    if (f.phone.replace(/\D/g, '').length < 8) er.phone = 'Enter a valid phone number'
    if (!f.date || f.date < todayStr()) er.date = 'Pick today or a future date'
    if (!table) er.table = 'All tables here are booked at this time — try another time or area'
    else if (+f.guests > table.seats) er.table = `${table.id} seats ${table.seats} — pick fewer guests or another area`
    setErr(er)
    if (Object.keys(er).length) return
    const booking = { ...f, tableId: table.id, order: lines, status: 'reserved', ref: 'NC-' + Math.random().toString(36).slice(2, 7).toUpperCase(), at: Date.now() }
    addBooking(booking); setDone(booking)
  }
  const ics = () => {
    const s = new Date(`${done.date}T${done.time}`), e = new Date(s.getTime() + 2 * 3600e3)
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${done.ref}@noircafe`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(s)}`, `DTEND:${fmt(e)}`,
      `SUMMARY:Noir Café — ${done.area} (${done.tableId})`, `DESCRIPTION:Reservation ${done.ref} for ${done.guests} guest(s)`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = `noir-cafe-${done.ref}.ics`; a.click()
  }
  const close = () => { onClose(); setTimeout(() => { setDone(null); setF(blank); setOrder({}) }, 400) }
  const doneTotal = done?.order?.reduce((s, o) => s + o.q * o.p, 0) || 0
  return (
    <div className="modal-bg" onClick={close}>
      <div className="modal" data-lenis-prevent="" role="dialog" aria-modal="true" aria-label="Reserve a table" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close} aria-label="Close">×</button>
        {done ? (
          <div className="done">
            <div className="mono">✓</div>
            <h3>You're on the list.</h3>
            <p>Table <b>{done.tableId}</b> · {done.guests} guest{done.guests > 1 ? 's' : ''} · {done.area}<br />{new Date(`${done.date}T${done.time}`).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</p>
            {done.order.length > 0 && <p>{done.order.map((o) => `${o.q}× ${o.n}`).join(', ')} — ₹{doneTotal.toLocaleString('en-IN')}</p>}
            <p className="ref">Reference <b>{done.ref}</b></p>
            <div className="row"><button className="cta" onClick={ics}>Add to calendar</button>
              <a className="cta ghost" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Noir Café reservation ${done.ref}: table ${done.tableId}, ${done.guests} guest(s), ${done.date} ${done.time}`)}`}>WhatsApp</a>
              <button className="cta ghost" onClick={close}>Done</button></div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <small>Noir Café</small><h3>Reserve a table</h3>
            <div className="grid">
              <label>Name<input value={f.name} onChange={set('name')} autoComplete="name" />{err.name && <i>{err.name}</i>}</label>
              <label>Phone<input value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" />{err.phone && <i>{err.phone}</i>}</label>
              <label>Date<input type="date" min={todayStr()} value={f.date} onChange={set('date')} />{err.date && <i>{err.date}</i>}</label>
              <label>Time<select value={f.time} onChange={set('time')}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label>Guests<select value={f.guests} onChange={set('guests')}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
              <label>Where<select value={f.area} onChange={set('area')}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></label>
            </div>
            <label>Table<select value={table?.id || ''} onChange={set('tableId')}>{opts.map((t) => <option key={t.id} value={t.id} disabled={taken(t.id)}>{t.id} · {t.seats} seats{taken(t.id) ? ' · booked' : ''}</option>)}</select>{err.table && <i>{err.table}</i>}</label>
            <details className="pre"><summary>Pre-order from the menu (optional){total > 0 && ` · ₹${total.toLocaleString('en-IN')}`}</summary>
              {ITEMS.map((i) => (
                <div key={i.n} className="it"><span>{i.n} <em>₹{i.p.toLocaleString('en-IN')}</em></span>
                  <span className="q"><button type="button" onClick={() => step(i.n, -1)}>−</button>{order[i.n] || 0}<button type="button" onClick={() => step(i.n, 1)}>+</button></span></div>
              ))}
            </details>
            <label>Special requests<textarea rows="2" value={f.note} onChange={set('note')} placeholder="Occasion, allergies, seating…" /></label>
            <button className="cta" type="submit">Confirm reservation</button>
          </form>
        )}
      </div>
    </div>
  )
}
