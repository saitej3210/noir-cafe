import { useEffect, useMemo, useState } from 'react'
import { TABLES } from './scene/layout.js'
import { useBookings, setStatus, removeBooking, activeFor, todayStr, seedDemoHistory, clearDemoHistory } from './bookings.js'
import { useMenuCatalog, saveMenuCatalog, resetMenuCatalog } from './menuCatalog.js'

const PIN = '1234' // Demo gate only. Production owner access requires server-side authentication.
const money = (n) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`
const pad = (n) => String(n).padStart(2, '0')
const dstr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const lastDays = (n, back = 0) => [...Array(n)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - back - (n - 1 - i)); return dstr(d) })
const total = (b) => (b.order || []).reduce((s, o) => s + o.q * o.p, 0)
const pctd = (a, b) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0)
const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TABS = [['analytics', '📊 Analytics'], ['floor', '🪑 Floor'], ['bookings', '📖 Reservations'], ['menu', '🍽 Menu manager'], ['reports', '📁 Reports']]
const HELP = {
  analytics: ['Analytics', 'Shows how your café is performing: pre-order revenue, bookings, guests, busiest hours, best dishes and areas.', 'Pick 7 or 30 days. Arrows compare with the previous period. Read "Smart insights" for actions. No data yet? Open Reports and add sample history to preview.'],
  floor: ['Floor', 'Live view of every table today, its seats, area and who is sitting there.', 'Green is available, red is taken. Press "Free table" when guests leave so it shows Free again in the 3D café.'],
  bookings: ['Reservations', 'All customer bookings with contact, table, time and pre-order.', 'Search by name, phone, table or reference. Mark seated when guests arrive, Free table when they leave, Delete to cancel. Switch filter to Today or All.'],
  menu: ['Menu manager', 'Controls the dishes and prices shown on the 3D menu cards and in the booking pre-order list.', 'Choose a room menu, add or edit an item, or remove it. Changes appear instantly on this device. Restore original brings back the default menus.'],
  reports: ['Reports', 'Download your data as CSV for Excel or your accountant, and manage sample data.', 'Download bookings or dish sales. Add sample history to test analytics, then remove it before real use.'],
}
const csv = (name, rows) => { const t = rows.map((r) => r.map((c) => JSON.stringify(c ?? '')).join(',')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv' })); a.download = name; a.click() }

function crunch(all, range) {
  const days = lastDays(range), prev = lastDays(range, range)
  const cur = all.filter((b) => days.includes(b.date)), old = all.filter((b) => prev.includes(b.date))
  const sum = (l) => ({ rev: l.reduce((s, b) => s + total(b), 0), n: l.length, guests: l.reduce((s, b) => s + Number(b.guests || 0), 0) })
  const daily = days.map((d) => { const l = cur.filter((b) => b.date === d); return { d, rev: l.reduce((s, b) => s + total(b), 0), n: l.length } })
  const hours = Array(12).fill(0), dish = {}, area = {}, tbl = {}, wd = Array(7).fill(0)
  cur.forEach((b) => {
    const h = parseInt(b.time, 10) - 12; if (h >= 0 && h < 12) hours[h]++
    ;(b.order || []).forEach((o) => { dish[o.n] = dish[o.n] || { q: 0, rev: 0 }; dish[o.n].q += o.q; dish[o.n].rev += o.q * o.p })
    area[b.area] = area[b.area] || { n: 0, rev: 0 }; area[b.area].n++; area[b.area].rev += total(b)
    tbl[b.tableId] = (tbl[b.tableId] || 0) + 1; wd[new Date(b.date + 'T00:00').getDay()]++
  })
  return { cur, c: sum(cur), p: sum(old), daily, hours, wd, pre: cur.filter((b) => b.order?.length).length, dishes: Object.entries(dish).sort((a, b) => b[1].rev - a[1].rev).slice(0, 6), areas: Object.entries(area).sort((a, b) => b[1].n - a[1].n), tables: Object.entries(tbl).sort((a, b) => b[1] - a[1]).slice(0, 5) }
}
function insights(r) {
  if (!r.cur.length) return []
  const hm = Math.max(...r.hours), h = r.hours.indexOf(hm), dm = Math.max(...r.wd), pr = Math.round((r.pre / r.cur.length) * 100), I = []
  I.push(`⏰ Busiest slot is ${12 + h}:00 to ${13 + h}:00 (${hm} bookings). Keep full staff on the floor then.`)
  I.push(`📅 ${WD[r.wd.indexOf(dm)]} is your busiest day (${dm} bookings).`)
  if (r.dishes[0]) I.push(`🔥 "${r.dishes[0][0]}" earns the most pre-order revenue (${money(r.dishes[0][1].rev)}). Feature it first.`)
  if (r.areas[0]) I.push(`🪑 ${r.areas[0][0]} gets the most bookings (${Math.round((r.areas[0][1].n / r.cur.length) * 100)}%).${r.areas.length > 1 ? ` ${r.areas[r.areas.length - 1][0]} is the quietest, so try an offer there.` : ''}`)
  I.push(`🧾 ${pr}% of bookings include a pre-order. ${pr < 40 ? 'Promote pre-order on the booking form to raise spend.' : 'Good, pre-orders help the kitchen plan.'}`)
  return I
}
const Delta = ({ a, b }) => { const d = pctd(a, b); return <small className={d >= 0 ? 'up' : 'dn'}>{d >= 0 ? '▲' : '▼'} {Math.abs(d)}% vs previous</small> }
const Kpi = ({ l, v, a, b }) => <div className="ow-kpi"><span>{l}</span><b>{v}</b>{a !== undefined && <Delta a={a} b={b} />}</div>
const HBars = ({ rows, fmt = String }) => { const mx = Math.max(...rows.map((r) => r[1]), 1); return rows.length ? <div className="ow-bars">{rows.map(([l, v, s]) => <div key={l}><div className="t"><span>{l}</span><b>{fmt(v)}</b></div><div className="tr"><i style={{ width: `${Math.max(4, (v / mx) * 100)}%` }} /></div>{s && <small>{s}</small>}</div>)}</div> : <p className="muted">No data in this period.</p> }
function Trend({ daily }) {
  const mx = Math.max(...daily.map((d) => d.rev), 1), step = 360 / Math.max(daily.length - 1, 1), pts = daily.map((d, i) => [20 + i * step, 120 - (d.rev / mx) * 100]), line = pts.map((p) => p.join(',')).join(' ')
  return <svg viewBox="0 0 400 150" className="ow-svg" role="img" aria-label="Pre-order revenue by day"><defs><linearGradient id="owg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: 'var(--ow-ac)', stopOpacity: 0.45 }} /><stop offset="1" style={{ stopColor: 'var(--ow-ac)', stopOpacity: 0 }} /></linearGradient></defs>
    <polygon points={`20,120 ${line} ${pts[pts.length - 1][0]},120`} fill="url(#owg)" /><polyline points={line} fill="none" strokeWidth="2.5" strokeLinejoin="round" style={{ stroke: 'var(--ow-ac)' }} />
    {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={daily.length <= 14 ? 3.5 : 5} style={{ fill: 'var(--ow-ac)', opacity: daily.length <= 14 ? 1 : 0 }}><title>{daily[i].d}: {money(daily[i].rev)} · {daily[i].n} bookings</title></circle>)}
    {[0, Math.floor((daily.length - 1) / 2), daily.length - 1].map((i) => <text key={i} x={pts[i][0]} y="144" textAnchor="middle" fontSize="10" style={{ fill: 'var(--ow-mu)' }}>{daily[i].d.slice(5)}</text>)}</svg>
}

export default function Owner({ open, onClose }) {
  const all = useBookings(), menus = useMenuCatalog()
  const [ok, setOk] = useState(false), [pin, setPin] = useState(''), [tab, setTab] = useState('analytics'), [range, setRange] = useState(7), [guide, setGuide] = useState(false)
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('noir-owner-theme') || 'dark' } catch { return 'dark' } })
  const [room, setRoom] = useState(0), [draft, setDraft] = useState({ name: '', desc: '', price: '' }), [editing, setEditing] = useState(-1), [notice, setNotice] = useState(''), [q, setQ] = useState(''), [flt, setFlt] = useState('active')
  useEffect(() => { try { localStorage.setItem('noir-owner-theme', theme) } catch {} }, [theme])
  useEffect(() => { if (!open) return; const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [open, onClose])
  useEffect(() => { if (!open) { setOk(false); setPin(''); setTab('analytics'); setGuide(false) } }, [open])
  const today = todayStr(), live = all.filter((b) => b.status !== 'done')
  const r = useMemo(() => crunch(all, range), [all, range])
  const occupied = TABLES.filter((t) => activeFor(all, t.id, today)).length
  const items = menus.flatMap((m) => m.items.filter((i) => /\d/.test(i[2])).map(([n, , p]) => ({ n, p: +p.replace(/[^\d]/g, '') })))
  const list = all.filter((b) => (flt === 'all' ? true : flt === 'today' ? b.date === today : b.status !== 'done')).filter((b) => !q || `${b.name} ${b.phone} ${b.ref} ${b.tableId}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => ((a.date + a.time).localeCompare(b.date + b.time)) * (flt === 'all' ? -1 : 1))
  const updateItems = (it) => { saveMenuCatalog(menus.map((m, i) => (i === room ? { ...m, items: it } : m))); setNotice('Menu saved on this device.') }
  const reset = () => { setDraft({ name: '', desc: '', price: '' }); setEditing(-1) }
  const submitItem = (e) => { e.preventDefault(); const name = draft.name.trim(); if (!name || !draft.price || Number(draft.price) < 0) return; const it = [...menus[room].items], row = [name, draft.desc.trim(), money(draft.price)]; if (editing >= 0) it[editing] = row; else it.push(row); updateItems(it); reset() }
  const startEdit = (it, i) => { setEditing(i); setDraft({ name: it[0], desc: it[1], price: String(it[2]).replace(/[^\d]/g, '') }) }
  const Help = ({ k }) => <details className="ow-help" open><summary>ℹ️ What is “{HELP[k][0]}”?</summary><p><b>Purpose:</b> {HELP[k][1]}</p><p><b>How to use:</b> {HELP[k][2]}</p></details>
  if (!open) return null
  return <div className="modal-bg owner-bg" onClick={onClose}><div className="modal wide owner-modal ow" data-ow={theme} data-lenis-prevent="" role="dialog" aria-modal="true" aria-label="NOIR CAFÉ owner studio" onClick={(e) => e.stopPropagation()}>
    <button className="x" onClick={onClose} aria-label="Close">×</button>
    {!ok ? <form onSubmit={(e) => { e.preventDefault(); if (pin === PIN) { setOk(true); setGuide(true); setNotice('') } else { setPin(''); setNotice('Incorrect PIN.') } }}><small>NOIR CAFÉ · OWNER STUDIO</small><h3>Management access</h3><p className="muted">Demo PIN: 1234. Replace this client-side demo gate with secure server authentication before public launch.</p><label>Owner PIN<input type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} /></label><button className="cta" type="submit">Unlock studio</button>{notice && <p className="owner-notice bad">{notice}</p>}</form> : <>
      <div className="ow-top"><div><small>NOIR CAFÉ · OWNER STUDIO</small><h3>Operations dashboard</h3></div><div className="ow-tools"><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>◐ {theme === 'dark' ? 'Light' : 'Dark'}</button><button onClick={() => setGuide(true)}>? Guide</button></div></div>
      {guide && <div className="ow-guide"><h4>Welcome, owner</h4><p className="muted">Here is what each section does:</p>{TABS.map(([id, label]) => <div key={id}><b>{label}</b><span>{HELP[id][1]}</span></div>)}<button className="ow-btn" onClick={() => setGuide(false)}>Got it</button></div>}
      <div className="owner-tabs">{TABS.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setNotice('') }}>{label}</button>)}</div>
      {Help({ k: tab })}
      {tab === 'analytics' && <>
        <div className="ow-range">{[7, 30].map((n) => <button key={n} className={range === n ? 'active' : ''} onClick={() => setRange(n)}>Last {n} days</button>)}</div>
        <div className="ow-kpis"><Kpi l="Pre-order revenue" v={money(r.c.rev)} a={r.c.rev} b={r.p.rev} /><Kpi l="Bookings" v={r.c.n} a={r.c.n} b={r.p.n} /><Kpi l="Guests" v={r.c.guests} a={r.c.guests} b={r.p.guests} /><Kpi l="Avg party size" v={r.c.n ? (r.c.guests / r.c.n).toFixed(1) : '0'} /><Kpi l="Avg pre-order" v={money(r.pre ? r.c.rev / r.pre : 0)} /><Kpi l="Table use now" v={`${Math.round((occupied / TABLES.length) * 100)}%`} /></div>
        {!r.cur.length && <p className="ow-empty">No bookings in this period yet. Open <b>Reports</b> and add sample history to preview the charts.</p>}
        <div className="ow-card"><h4>Revenue trend</h4><Trend daily={r.daily} /></div>
        <div className="ow-grid">
          <div className="ow-card"><h4>Busy hours</h4><div className="ow-hours">{r.hours.map((n, i) => <div key={i} title={`${12 + i}:00 · ${n} bookings`}><i style={{ height: `${Math.max(4, (n / Math.max(...r.hours, 1)) * 100)}%` }} className={n && n === Math.max(...r.hours) ? 'pk' : ''} /><small>{12 + i}</small></div>)}</div></div>
          <div className="ow-card"><h4>Top dishes by revenue</h4><HBars rows={r.dishes.map(([n, v]) => [n, v.rev, `${v.q} sold`])} fmt={money} /></div>
          <div className="ow-card"><h4>Bookings by area</h4><HBars rows={r.areas.map(([n, v]) => [n, v.n, money(v.rev)])} /></div>
          <div className="ow-card"><h4>Most booked tables</h4><HBars rows={r.tables} /></div>
        </div>
        {insights(r).length > 0 && <div className="ow-card"><h4>Smart insights</h4>{insights(r).map((t, i) => <div className="ow-ins" key={i}>{t}</div>)}</div>}
      </>}
      {tab === 'floor' && <>
        <div className="ow-kpis"><Kpi l="Total tables" v={TABLES.length} /><Kpi l="Occupied today" v={occupied} /><Kpi l="Active bookings" v={live.length} /><Kpi l="Guests expected" v={live.reduce((s, b) => s + Number(b.guests || 0), 0)} /></div>
        <h4>Live floor · {today}</h4><div className="seat-grid">{TABLES.map((t) => { const b = activeFor(all, t.id, today); return <div className={`seat-tile ${b ? 'busy' : ''}`} key={t.id}><b>{t.id}</b><span>{b ? `${b.status} · ${b.time}` : 'Available'}</span><small>{t.seats} seats · {t.area}</small>{b && <small>{b.name} · {b.guests} guests</small>}{b && <button className="ow-mini" onClick={() => setStatus(b.ref, 'done')}>Free table</button>}</div> })}</div></>}
      {tab === 'bookings' && <>
        <div className="ow-filters"><input placeholder="Search name, phone, table, ref…" value={q} onChange={(e) => setQ(e.target.value)} /><div className="ow-range">{[['active', 'Active'], ['today', 'Today'], ['all', 'All']].map(([k, l]) => <button key={k} className={flt === k ? 'active' : ''} onClick={() => setFlt(k)}>{l}</button>)}</div></div>
        <h4>{list.length} reservation{list.length === 1 ? '' : 's'}</h4>{list.length === 0 && <p className="muted">Nothing matches. Try another filter.</p>}
        {list.slice(0, 60).map((b) => <div className="bk" key={b.ref}><div><b>{b.tableId}</b> · {b.name} · {b.guests} guests · {b.date} {b.time} <em>({b.status})</em><br /><span className="muted">{b.area} · {b.phone} · {b.ref}</span>{b.order?.length > 0 && <div className="muted">{b.order.map((o) => `${o.q}× ${o.n}`).join(', ')} — {money(total(b))}</div>}</div><div className="acts">{b.status === 'reserved' && <button onClick={() => setStatus(b.ref, 'seated')}>Mark seated</button>}{b.status !== 'done' && <button className="go" onClick={() => setStatus(b.ref, 'done')}>Free table</button>}<button onClick={() => { if (window.confirm(`Delete reservation ${b.ref}?`)) removeBooking(b.ref) }}>Delete</button></div></div>)}
        {list.length > 60 && <p className="muted">Showing the first 60. Use search to narrow down.</p>}</>}
      {tab === 'menu' && <><label className="owner-label">Room / menu<select value={room} onChange={(e) => { setRoom(Number(e.target.value)); reset() }}>{menus.map((m, i) => <option key={i} value={i}>{m.title}</option>)}</select></label><div className="menu-editor-list">{menus[room].items.map((it, i) => <div className="menu-editor-row" key={`${it[0]}-${i}`}><div><b>{it[0]}</b><span>{it[1] || 'No description'}</span><strong>{it[2] || 'Price on request'}</strong></div><div className="acts"><button onClick={() => startEdit(it, i)}>Edit</button><button onClick={() => { updateItems(menus[room].items.filter((_, j) => j !== i)); if (editing === i) reset() }}>Remove</button></div></div>)}</div>
        <form className="menu-item-form" onSubmit={submitItem}><h4>{editing >= 0 ? 'Edit menu item' : 'Add a menu item'}</h4><label>Item name<input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Vanilla Bean Latte" /></label><label>Description<input value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} placeholder="Short ingredients or tasting notes" /></label><label>Price (INR)<input required type="number" min="0" step="1" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="320" /></label><div className="acts"><button type="submit" className="go">{editing >= 0 ? 'Save changes' : 'Add item'}</button>{editing >= 0 && <button type="button" onClick={reset}>Cancel</button>}</div></form>
        <div className="owner-actions"><button onClick={() => { if (window.confirm('Restore the original five menus? Your menu edits will be replaced.')) { resetMenuCatalog(); setNotice('Original menus restored.') } }}>Restore original menus</button></div>{notice && <p className="owner-notice">{notice}</p>}</>}
      {tab === 'reports' && <><div className="ow-card"><h4>Download</h4><div className="ow-row"><button className="ow-btn" onClick={() => csv('bookings.csv', [['Ref', 'Date', 'Time', 'Table', 'Area', 'Name', 'Phone', 'Guests', 'Status', 'Pre-order value'], ...all.map((b) => [b.ref, b.date, b.time, b.tableId, b.area, b.name, b.phone, b.guests, b.status, total(b)])])}>bookings.csv</button><button className="ow-btn" onClick={() => csv('dish-sales.csv', [['Dish', 'Qty', 'Revenue'], ...crunch(all, 30).dishes.map(([n, v]) => [n, v.q, v.rev])])}>dish-sales.csv (30 days)</button><button className="ow-btn" onClick={() => window.print()}>Print</button></div></div>
        <div className="ow-card"><h4>Sample data</h4><p className="muted">Adds about 30 days of fake bookings so you can preview analytics. They are tagged as sample and never affect today's tables.</p><div className="ow-row"><button className="ow-btn" onClick={() => setNotice(seedDemoHistory(TABLES, items) ? 'Sample history added. Open Analytics.' : 'Sample history already added.')}>Add sample history</button><button className="ow-btn ghost" onClick={() => { clearDemoHistory(); setNotice('Sample history removed.') }}>Remove sample history</button></div>{notice && <p className="owner-notice">{notice}</p>}</div></>}
    </>}
  </div></div>
}
