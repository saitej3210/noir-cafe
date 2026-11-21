import { useSyncExternalStore } from 'react'
// Swap this file's read/save for fetch() calls to your backend to share bookings between devices.
const KEY = 'noir-reservations'
const pad = (n) => String(n).padStart(2, '0')
export const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
    const t = todayStr(), mk = (ref, name, tableId, area, guests, time, order) => ({ ref, name, phone: '9000000000', tableId, area, guests, time, date: t, note: '', order, status: 'reserved', at: Date.now() })
    const demo = [ // sample data so the 3D tags are visible on first run — owner can free them
      mk('NC-DEMO1', 'Arjun R.', 'T2', 'Main Dining Hall', 4, '20:00', [{ n: 'Wood-fired Sea Bass', q: 2, p: 1450 }, { n: 'Burrata & Heirloom', q: 2, p: 680 }]),
      mk('NC-DEMO2', 'Meera S.', 'T7', 'Private Dining Room', 10, '21:00', [{ n: 'Dark Chocolate Sphere', q: 10, p: 4500 }]),
      mk('NC-DEMO3', 'Kiran & family', 'G3', 'Garden Lounge', 5, '19:30', [{ n: 'Masala Chai Pot', q: 3, p: 260 }, { n: 'Tiramisu', q: 2, p: 420 }]),
    ]
    localStorage.setItem(KEY, JSON.stringify(demo)); return demo
  } catch { return [] }
}
let cache = read()
const subs = new Set(), emit = () => subs.forEach((f) => f())
window.addEventListener('storage', (e) => { if (e.key === KEY) { cache = read(); emit() } }) // other tabs/windows update live
export function save(list) { cache = list; try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {} emit() }
export const addBooking = (b) => save([...cache, b])
export const setStatus = (ref, status) => save(cache.map((b) => (b.ref === ref ? { ...b, status } : b)))
export const removeBooking = (ref) => save(cache.filter((b) => b.ref !== ref))
export const useBookings = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => cache)
export const activeFor = (list, tableId, date) => list.find((b) => b.tableId === tableId && b.status !== 'done' && b.date === date)

// ---- sample history so the owner analytics have something to show (flagged demo:true, removable) ----
export function seedDemoHistory(tables, items, days = 30) {
  if (cache.some((b) => b.demo)) return 0
  const names = ['Arjun', 'Meera', 'Kiran', 'Sana', 'Rahul', 'Priya', 'Imran', 'Divya', 'Vikram', 'Anu', 'Neha', 'Sai'], times = ['13:00', '13:30', '14:00', '19:00', '19:30', '20:00', '20:00', '20:30', '21:00', '21:30', '22:00'], out = []
  const pick = (a) => a[Math.floor(Math.random() * a.length)]
  for (let k = 1; k <= days; k++) {
    const d = new Date(); d.setDate(d.getDate() - k)
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, n = 2 + Math.floor(Math.random() * 4) + ([0, 5, 6].includes(d.getDay()) ? 2 : 0)
    for (let i = 0; i < n; i++) {
      const t = pick(tables), guests = 1 + Math.floor(Math.random() * t.seats), order = Math.random() < 0.6 && items.length ? [...Array(1 + Math.floor(Math.random() * 3))].map(() => { const m = pick(items); return { n: m.n, q: 1 + Math.floor(Math.random() * guests), p: m.p } }) : []
      out.push({ ref: `NC-D${k}-${i}`, name: pick(names), phone: '9000000000', tableId: t.id, area: t.area, guests, time: pick(times), date, note: '', order, status: 'done', at: d.getTime(), demo: true })
    }
  }
  save([...cache, ...out]); return out.length
}
export const clearDemoHistory = () => save(cache.filter((b) => !b.demo))
