import { withModel, GLBTree } from './Models.jsx'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { merge } from './util.js'
import { getMaterials } from './materials.js'
import { QUALITY } from './quality.js'
import { rng } from './util.js'

function leafGeo(lw, ll, curl) {
  const g = new THREE.PlaneGeometry(lw, ll, 2, 6)
  g.translate(0, ll / 2, 0)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), t = y / ll
    const taper = Math.pow(1 - t, 0.65) * (0.3 + 0.7 * Math.min(1, t * 4))
    p.setX(i, x * taper)
    p.setZ(i, curl * t * t * ll + Math.abs(x) * 0.35)
  }
  g.computeVertexNormals()
  return g
}
let geos
const G = () => (geos ||= { tree: leafGeo(0.3, 0.62, 0.35), trop: leafGeo(0.42, 1.5, 0.45), small: leafGeo(0.14, 0.3, 0.3) })

function Leaves({ geo, items }) {
  const M = getMaterials(), ref = useRef()
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color()
    items.forEach((it, i) => {
      o.position.set(...it.pos); o.rotation.set(...it.rot); o.scale.setScalar(it.s); o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix); ref.current.setColorAt(i, c.set(it.color))
    })
    ref.current.instanceMatrix.needsUpdate = true; ref.current.instanceColor.needsUpdate = true
  }, [items])
  return <instancedMesh ref={ref} args={[geo, M.leaf, items.length]} frustumCulled={false} />
}

const TREE_GREENS = ['#4c6a2a', '#5b7a31', '#3e5a26', '#6a8a3a', '#52702c', '#7a8f3c']
const TROP_GREENS = ['#2c5a2a', '#356a30', '#264d27', '#3f7335']

function limb(from, to, r0, r1) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a), L = d.length()
  const g = new THREE.CylinderGeometry(r1, r0, L, 7); g.translate(0, L / 2, 0)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()))
  g.translate(a.x, a.y, a.z); return g
}

function Planter({ r, h, kind }) {
  const M = getMaterials()
  const mat = kind === 'dark' ? M.planterDark : M.stone
  return <group>
    <mesh position={[0, h / 2, 0]} material={mat}><cylinderGeometry args={[r, r * 0.88, h, 48]} /></mesh>
    <mesh position={[0, h + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.soil}><circleGeometry args={[r * 0.94, 32]} /></mesh>
    <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}><torusGeometry args={[r * 0.97, 0.012, 6, 48]} /></mesh>
  </group>
}

function Cover({ r, h, seed }) {
  const items = useMemo(() => {
    const q = rng(seed + 99), out = [], n = QUALITY.mobile ? 30 : 90
    for (let i = 0; i < n; i++) {
      const a = q() * Math.PI * 2, rr = Math.sqrt(q()) * r * 0.85
      out.push({ pos: [Math.cos(a) * rr, h, Math.sin(a) * rr], rot: [-0.8 + q() * 0.5, a + Math.PI / 2, 0], s: 0.9 + q() * 0.9, color: TREE_GREENS[(q() * 6) | 0] })
    }
    return out
  }, [r, h, seed])
  return <Leaves geo={G().small} items={items} />
}

function ProceduralTree({ position, height = 3.6, crown = 1.3, seed = 1, r = 0.8, ph = 0.7, kind = 'stone', scale = 1 }) {
  const M = getMaterials()
  const { items, trunk } = useMemo(() => {
    const q = rng(seed * 7919), cy = height * 0.7, items = [], N = QUALITY.leaves
    for (let i = 0; i < N; i++) {
      const u = q() * 2 - 1, a = q() * Math.PI * 2, k = Math.sqrt(1 - u * u), rad = 0.35 + 0.65 * Math.cbrt(q())
      items.push({
        pos: [k * Math.cos(a) * rad * crown, ph + cy + u * rad * crown * 0.75, k * Math.sin(a) * rad * crown],
        rot: [q() * 6.28, q() * 6.28, q() * 6.28], s: 0.75 + q() * 0.75, color: TREE_GREENS[(q() * 6) | 0],
      })
    }
    const parts = [limb([0, ph, 0], [0.05, ph + cy * 0.6, 0], 0.08, 0.05)]
    for (let i = 0; i < 4; i++) {
      const a = q() * 6.28
      parts.push(limb([0.05, ph + cy * 0.55, 0], [Math.cos(a) * crown * 0.6, ph + cy * (0.95 + q() * 0.2), Math.sin(a) * crown * 0.6], 0.035, 0.015))
    }
    return { items, trunk: merge(parts) }
  }, [seed, height, crown, ph])
  return (
    <group position={position} scale={scale}>
      <Planter r={r} h={ph} kind={kind} />
      <mesh geometry={trunk} material={M.bark} />
      <Leaves geo={G().tree} items={items} />
      <Cover r={r} h={ph} seed={seed} />
    </group>
  )
}

export function Tropical({ position, seed = 1, r = 0.5, ph = 0.6, kind = 'dark', scale = 1, leaves = 16 }) {
  const items = useMemo(() => {
    const q = rng(seed * 313), out = []
    for (let i = 0; i < leaves; i++) {
      const a = (i / leaves) * Math.PI * 2 + q()
      out.push({ pos: [Math.cos(a) * 0.08, ph, Math.sin(a) * 0.08], rot: [0.25 + q() * 0.7, -a + Math.PI / 2, 0], s: 0.7 + q() * 0.55, color: TROP_GREENS[(q() * 4) | 0] })
    }
    return out
  }, [seed, leaves, ph])
  return (
    <group position={position} scale={scale}>
      <Planter r={r} h={ph} kind={kind} />
      <TropLeaves items={items} />
    </group>
  )
}
function TropLeaves({ items }) {
  const M = getMaterials(), ref = useRef()
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color()
    items.forEach((it, i) => {
      o.position.set(...it.pos); o.rotation.order = 'YXZ'; o.rotation.set(it.rot[0], it.rot[1], 0); o.scale.setScalar(it.s); o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix); ref.current.setColorAt(i, c.set(it.color))
    })
    ref.current.instanceMatrix.needsUpdate = true; ref.current.instanceColor.needsUpdate = true
  }, [items])
  return <instancedMesh ref={ref} args={[G().trop, M.leaf, items.length]} frustumCulled={false} />
}

// Long low stone planter with ground-cover foliage
export function PlanterBed({ position, length = 4, width = 0.9, height = 0.55, seed = 1 }) {
  const M = getMaterials()
  const items = useMemo(() => {
    const q = rng(seed * 17), out = [], n = QUALITY.mobile ? 60 : 180
    for (let i = 0; i < n; i++) out.push({ pos: [(q() - 0.5) * (length - 0.2), height, (q() - 0.5) * (width - 0.15)], rot: [-0.7 + q() * 0.5, q() * 6.28, 0], s: 1 + q() * 1.1, color: TREE_GREENS[(q() * 6) | 0] })
    return out
  }, [length, width, height, seed])
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} material={M.stone}><boxGeometry args={[length, height, width]} /></mesh>
      <Leaves geo={G().small} items={items} />
    </group>
  )
}

export const PlantedTree = withModel('plant', GLBTree, ProceduralTree)
