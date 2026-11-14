import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getMaterials } from './materials.js'
import { rugTexture } from './textures.js'
import { HALL_TABLES, PRIVATE_TABLE, GARDEN_GROUPS, ROOMS } from './layout.js'

// Real-world detailing that makes a space read as lived-in rather than modelled: laid tables, candles and flowers,
// rugs, an inlaid stone floor border, skirting boards and timber ceiling beams. All instanced / merged — a handful of draw calls.

const Inst = ({ geo, mat, items, y = 0, name }) => {
  const ref = useRef()
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    items.forEach((it, i) => { o.position.set(it.x, it.y ?? y, it.z); o.rotation.set(0, it.ry || 0, 0); o.scale.setScalar(it.s || 1); o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix) })
    ref.current.instanceMatrix.needsUpdate = true
  }, [items])
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} name={name} />
}

// a place setting = plate position + outward direction (from table centre towards the chair)
function seatsHall() {
  return HALL_TABLES.flatMap(([tx, tz], t) => [0, 1, 2, 3].map((k) => {
    const a = k * Math.PI / 2 + 0.4 + t * 0.15, d = [Math.sin(a), Math.cos(a)]
    return { p: [tx + d[0] * 0.36, tz + d[1] * 0.36], d, top: 0.76 }
  }))
}
function seatsPrivate() {
  const { c, len } = PRIVATE_TABLE
  const rows = [-2, -1, 0, 1, 2].flatMap((o) => [[-1, 0], [1, 0]].map(([dx]) => ({ p: [c[0] + dx * 0.44, c[1] + o], d: [dx, 0], top: 0.765 })))
  return [...rows, { p: [c[0], c[1] - (len / 2 - 0.34)], d: [0, -1], top: 0.765 }, { p: [c[0], c[1] + (len / 2 - 0.34)], d: [0, 1], top: 0.765 }]
}

function PlaceSettings({ seats }) {
  const M = getMaterials()
  const g = useMemo(() => ({
    plate: new THREE.CylinderGeometry(0.115, 0.085, 0.016, 32), well: new THREE.CylinderGeometry(0.07, 0.07, 0.004, 24),
    glass: new THREE.CylinderGeometry(0.032, 0.026, 0.1, 16), napkin: new THREE.BoxGeometry(0.09, 0.012, 0.09),
    fork: new THREE.BoxGeometry(0.013, 0.004, 0.17), knife: new THREE.BoxGeometry(0.015, 0.004, 0.185),
  }), [])
  const parts = useMemo(() => {
    const out = { plate: [], well: [], glass: [], napkin: [], fork: [], knife: [] }
    seats.forEach((s) => {
      const [dx, dz] = s.d, ry = Math.atan2(dx, dz), px = dz, pz = -dx // perpendicular
      const at = (k, f, side) => ({ x: s.p[0] - dx * k + px * side + dx * f, z: s.p[1] - dz * k + pz * side + dz * f, ry })
      out.plate.push({ ...at(0, 0, 0), y: s.top + 0.008 }); out.well.push({ ...at(0, 0, 0), y: s.top + 0.017 })
      out.napkin.push({ ...at(0, 0.02, -0.19), y: s.top + 0.006, ry: ry + 0.15 })
      out.fork.push({ ...at(0, 0, -0.145), y: s.top + 0.002 }); out.knife.push({ ...at(0, 0, 0.145), y: s.top + 0.002 })
      out.glass.push({ ...at(0, -0.2, 0.12), y: s.top + 0.05 })
    })
    return out
  }, [seats])
  return <>
    <Inst geo={g.plate} mat={M.ceramic} items={parts.plate} />
    <Inst geo={g.well} mat={M.wax} items={parts.well} />
    <Inst geo={g.napkin} mat={M.linen} items={parts.napkin} />
    <Inst geo={g.fork} mat={M.brass} items={parts.fork} /><Inst geo={g.knife} mat={M.brass} items={parts.knife} />
    <Inst geo={g.glass} mat={M.glassClear} items={parts.glass} />
  </>
}

const BLOOM = ['#e9b8c0', '#f3e3d0', '#d98a8a', '#f0d27a', '#c7d6a0']
function Candle({ position }) {
  const M = getMaterials()
  return <group position={position}>
    <mesh position={[0, 0.03, 0]} material={M.glassClear}><cylinderGeometry args={[0.04, 0.036, 0.06, 20]} /></mesh>
    <mesh position={[0, 0.026, 0]} material={M.wax}><cylinderGeometry args={[0.028, 0.028, 0.044, 16]} /></mesh>
    <mesh position={[0, 0.062, 0]} material={M.flame} userData={{ noShadow: true }}><sphereGeometry args={[0.011, 10, 8]} /></mesh>
  </group>
}
function BudVase({ position, seed = 1 }) {
  const M = getMaterials()
  const blooms = useMemo(() => Array.from({ length: 5 }, (_, i) => { const a = i * 2.4 + seed; return [Math.cos(a) * 0.035, 0.17 + (i % 3) * 0.02, Math.sin(a) * 0.035, BLOOM[(i + seed) % 5]] }), [seed])
  return <group position={position}>
    <mesh position={[0, 0.06, 0]} material={M.glassClear}><cylinderGeometry args={[0.022, 0.034, 0.12, 16]} /></mesh>
    {blooms.map(([x, y, z, c], i) => <group key={i}>
      <mesh position={[x * 0.5, y / 2 + 0.06, z * 0.5]} rotation={[z * 4, 0, -x * 4]}><cylinderGeometry args={[0.002, 0.002, y - 0.04, 4]} /><meshStandardMaterial color="#4f6a34" roughness={0.8} /></mesh>
      <mesh position={[x, y + 0.04, z]}><sphereGeometry args={[0.03, 12, 10]} /><meshStandardMaterial color={c} roughness={0.7} /></mesh>
    </group>)}
  </group>
}

function Cup({ position, ry = 0 }) {
  const M = getMaterials()
  return <group position={position} rotation={[0, ry, 0]}>
    <mesh position={[0, 0.005, 0]} material={M.ceramic}><cylinderGeometry args={[0.075, 0.055, 0.01, 24]} /></mesh>
    <mesh position={[0, 0.04, 0]} material={M.ceramic}><cylinderGeometry args={[0.045, 0.03, 0.06, 20]} /></mesh>
    <mesh position={[0, 0.068, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.038, 20]} /><meshStandardMaterial color="#3a2012" roughness={0.25} /></mesh>
    <mesh position={[0.058, 0.04, 0]} rotation={[0, 0, Math.PI / 2]} material={M.ceramic}><torusGeometry args={[0.016, 0.006, 6, 12, Math.PI]} /></mesh>
  </group>
}
function CakeDome({ position }) {
  const M = getMaterials()
  return <group position={position}>
    <mesh position={[0, 0.02, 0]} material={M.brass}><cylinderGeometry args={[0.2, 0.17, 0.04, 32]} /></mesh>
    <mesh position={[0, 0.07, 0]} material={M.wax}><cylinderGeometry args={[0.13, 0.13, 0.07, 28]} /></mesh>
    <mesh position={[0, 0.115, 0]}><cylinderGeometry args={[0.13, 0.13, 0.02, 28]} /><meshStandardMaterial color="#4a2a18" roughness={0.4} /></mesh>
    <mesh position={[0, 0.04, 0]} material={M.glassClear}><sphereGeometry args={[0.19, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
  </group>
}

export function TableSettings() {
  const M = getMaterials()
  const hall = useMemo(seatsHall, []), priv = useMemo(seatsPrivate, [])
  const { c, len } = PRIVATE_TABLE
  return <group>
    <PlaceSettings seats={hall} /><PlaceSettings seats={priv} />
    {HALL_TABLES.map(([x, z], i) => <group key={i}><Candle position={[x - 0.1, 0.76, z + 0.04]} /><BudVase position={[x + 0.09, 0.76, z - 0.05]} seed={i + 1} /></group>)}
    {/* private room: linen runner, candles + vases down the centre */}
    <mesh position={[c[0], 0.768, c[1]]} rotation={[-Math.PI / 2, 0, 0]} material={M.linen}><planeGeometry args={[0.2, len - 0.5]} /></mesh>
    {[-2, -1, 0, 1, 2].map((o) => <Candle key={o} position={[c[0] + (o % 2 ? 0.05 : -0.05), 0.768, c[1] + o * 1.0 + 0.5]} />)}
    {[-1.5, 0.3, 1.9].map((o, i) => <BudVase key={i} position={[c[0], 0.768, c[1] + o]} seed={i + 5} />)}
    {/* garden coffee tables */}
    {GARDEN_GROUPS.map((g, i) => <group key={i} position={[g.c[0], 0.4175, g.c[1]]}>
      <Cup position={[-0.2, 0, 0.12]} ry={0.5 + i} /><Cup position={[0.22, 0, -0.1]} ry={2 + i} />
      <Candle position={[0.02, 0, 0.2]} /><BudVase position={[-0.05, 0, -0.2]} seed={i + 9} />
    </group>)}
    {/* coffee bar counter top (y 1.1) */}
    <group position={[7.55, 1.1, -49.5]}>
      <CakeDome position={[0, 0, 2.4]} /><CakeDome position={[0.05, 0, 3.3]} />
      {[-3.4, -2.8, -2.2, 1.4].map((z, i) => <Cup key={i} position={[-0.1 + (i % 2) * 0.12, 0, z]} ry={i} />)}
      <BudVase position={[0.2, 0, -1.8]} seed={3} />
    </group>
  </group>
}

// Timber ceiling beams in the dining hall, skirting boards and an inlaid dark-stone floor border along every room
export function Architecture2() {
  const M = getMaterials()
  const hall = ROOMS.find((r) => r.id === 'hall')
  return <group>
    {[-14, -18, -22, -26].map((z) => <mesh key={z} position={[0, hall.h - 0.15, z]} material={M.walnut} userData={{ noShadow: false }}><boxGeometry args={[19.6, 0.3, 0.34]} /></mesh>)}
    {[-1, 1].map((s) => <group key={s}>
      <mesh position={[s * 9.78, 0.09, -27]} material={M.walnut}><boxGeometry args={[0.04, 0.18, 54]} /></mesh>
      <mesh position={[s * 9.76, 0.2, -27]} material={M.walnut}><boxGeometry args={[0.02, 0.03, 54]} /></mesh>
      <mesh position={[s * 9.35, 0.007, -27]} rotation={[-Math.PI / 2, 0, 0]} material={M.darkMarble}><planeGeometry args={[0.3, 54]} /></mesh>
      <mesh position={[s * 9.12, 0.008, -27]} rotation={[-Math.PI / 2, 0, 0]} material={M.brass}><planeGeometry args={[0.02, 54]} /></mesh>
    </group>)}
  </group>
}

export function Rugs() {
  const priv = useMemo(() => rugTexture(['#cfc1a6', '#4d3b28', '#9a7a52'], 3), [])
  const round = useMemo(() => rugTexture(['#d3c6ad', '#5b4631', '#a2845c'], 7, true), [])
  const { c } = PRIVATE_TABLE
  const mat = (map) => <meshStandardMaterial map={map} roughness={1} polygonOffset polygonOffsetFactor={-1} />
  return <group>
    <mesh position={[c[0], 0.009, c[1]]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4.2, 8]} />{mat(priv)}</mesh>
    {GARDEN_GROUPS.map((g, i) => <mesh key={i} position={[g.c[0], 0.009, g.c[1]]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[3, 64]} />{mat(round)}</mesh>)}
  </group>
}
