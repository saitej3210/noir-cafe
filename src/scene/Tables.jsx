import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { TABLES } from './layout.js'
import { useBookings, activeFor, todayStr } from '../bookings.js'

// Floating status tag above every table: far = nothing, mid = "T3 · Reserved", close = guest, seats and the pre-ordered menu.
function Tag({ t }) {
  const list = useBookings(), b = activeFor(list, t.id, todayStr())
  const [near, setNear] = useState(0), r = useRef(0)
  const v = useMemo(() => new THREE.Vector3(t.p[0], 1.6, t.p[1]), [t])
  useFrame(({ camera }) => { const d = camera.position.distanceTo(v), n = d < 5.4 ? 2 : d < 10 ? 1 : 0; if (n !== r.current) { r.current = n; setNear(n) } })
  if (!near) return null
  const total = b?.order?.reduce((s, o) => s + o.q * o.p, 0) || 0
  return (
    <Html position={[t.p[0], 1.75, t.p[1]]} center distanceFactor={7} zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`ttag ${b ? 'res' : 'free'} n${near}`}>
        <b>{t.id}</b><span className="st">{b ? (b.status === 'seated' ? 'Seated' : 'Reserved') : 'Free'}</span>
        {near === 2 && (b ? (
          <>
            <em>{b.name} · {b.guests}/{t.seats} seats · {b.time}</em>
            {b.order?.length > 0 && <ul>{b.order.slice(0, 4).map((o) => <li key={o.n}>{o.q}× {o.n}</li>)}{total > 0 && <li><b>₹{total.toLocaleString('en-IN')}</b></li>}</ul>}
          </>
        ) : <em>{t.seats} seats available</em>)}
      </div>
    </Html>
  )
}
export default function Tables() { return TABLES.map((t) => <Tag key={t.id} t={t} />) }
