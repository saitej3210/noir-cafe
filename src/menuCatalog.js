import { useSyncExternalStore } from 'react'
import { MENUS } from './scene/layout.js'
const KEY = 'noir-menu-catalog-v1'
const clone = (v) => JSON.parse(JSON.stringify(v))
function read() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length === MENUS.length) return parsed } } catch {}
  return clone(MENUS)
}
let catalog = read()
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())
export const useMenuCatalog = () => useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn) }, () => catalog)
export function saveMenuCatalog(next) { catalog = clone(next); try { localStorage.setItem(KEY, JSON.stringify(catalog)) } catch {} emit() }
export function resetMenuCatalog() { saveMenuCatalog(clone(MENUS)) }
window.addEventListener('storage', (e) => { if (e.key === KEY) { catalog = read(); emit() } })
