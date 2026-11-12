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
