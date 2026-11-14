import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { merge } from './util.js'
import { Text } from '@react-three/drei'
import { FONT } from './fonts.js'
import { getMaterials } from './materials.js'
import { rng } from './util.js'
import { withModel, GLBChairs } from './Models.jsx'
import { Blob, ContactShadows } from './Decals.jsx'

function chairGeos() {
  // upholstered cushion with a softly bevelled edge + wooden seat rail
  const seat = new RoundedBoxGeometry(0.5, 0.075, 0.48, 4, 0.032).translate(0, 0.482, 0)
  // curved back panel with real thickness (extruded annular sector), gentle bevel
  const sh = new THREE.Shape(), r0 = 0.25, r1 = 0.285, a0 = Math.PI / 2 - 1.2, a1 = Math.PI / 2 + 1.2
  sh.absarc(0, 0, r1, a0, a1, false); sh.absarc(0, 0, r0, a1, a0, true); sh.closePath()
  const back = new THREE.ExtrudeGeometry(sh, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 32 })
  back.rotateX(-Math.PI / 2); back.translate(0, 0.54, 0.03)
  const legs = [new THREE.BoxGeometry(0.44, 0.035, 0.42).translate(0, 0.43, 0)] // seat rail
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const g = new THREE.CylinderGeometry(0.011, 0.017, 0.43, 10).translate(0, 0.215, 0)
    g.rotateZ(-sx * 0.07); g.rotateX(sz * 0.07); g.translate(sx * 0.205, 0, sz * 0.195); legs.push(g)
    legs.push(new THREE.CylinderGeometry(0.0125, 0.0125, 0.012, 10).translate(sx * 0.205 + sx * 0.0, 0.006, sz * 0.195 + sz * 0.0))
  }
  return { fabric: merge([seat, back]), metal: merge(legs) }
}

function ProceduralChairs({ items, material = 'fabricRust' }) {
  const M = getMaterials()
  const { fabric, metal } = useMemo(chairGeos, [])
  const a = useRef(), b = useRef()
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    items.forEach((it, i) => {
      o.position.set(it.p[0], 0, it.p[1]); o.rotation.set(0, it.ry, 0); o.scale.setScalar(it.s || 1); o.updateMatrix()
      a.current.setMatrixAt(i, o.matrix); b.current.setMatrixAt(i, o.matrix)
    })
    a.current.instanceMatrix.needsUpdate = b.current.instanceMatrix.needsUpdate = true
  }, [items])
  return <>
    <instancedMesh ref={a} args={[fabric, M[material], items.length]} frustumCulled={false} />
    <instancedMesh ref={b} args={[metal, M.bronze, items.length]} frustumCulled={false} />
  </>
}

export function RoundTable({ position }) {
  const M = getMaterials()
  return <group position={position}>
    <Blob r={0.95} o={1} />
    <mesh position={[0, 0.74, 0]} material={M.darkMarble}><cylinderGeometry args={[0.62, 0.62, 0.04, 56]} /></mesh>
    <mesh position={[0, 0.76, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}><torusGeometry args={[0.62, 0.008, 6, 56]} /></mesh>
    <mesh position={[0, 0.38, 0]} material={M.brass}><cylinderGeometry args={[0.04, 0.05, 0.72, 16]} /></mesh>
    <mesh position={[0, 0.02, 0]} material={M.brass}><cylinderGeometry args={[0.3, 0.32, 0.04, 40]} /></mesh>
  </group>
}

export function LongTable({ position, len, wid }) {
  const M = getMaterials()
  return <group position={position}>
    <Blob r={1} sx={wid * 1.1} sz={len / 2 + 0.3} o={1} />
    <mesh position={[0, 0.74, 0]} material={M.darkMarble}><boxGeometry args={[wid, 0.05, len]} /></mesh>
    <mesh position={[0, 0.715, 0]} material={M.brass}><boxGeometry args={[wid + 0.02, 0.012, len + 0.02]} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[0, 0.36, s * (len / 2 - 0.7)]} material={M.walnut}><boxGeometry args={[wid * 0.7, 0.7, 0.12]} /></mesh>)}
  </group>
}

function sector(r0, r1, a0, a1) {
  const s = new THREE.Shape()
  s.moveTo(r0 * Math.cos(a0), r0 * Math.sin(a0)); s.lineTo(r1 * Math.cos(a0), r1 * Math.sin(a0))
  s.absarc(0, 0, r1, a0, a1, false); s.lineTo(r0 * Math.cos(a1), r0 * Math.sin(a1)); s.absarc(0, 0, r0, a1, a0, true)
  return s
}

// Curved sofa wrapping around the group origin (where the coffee table goes)
export function Sofa({ position, rotation = 0, R = 1.5, span = Math.PI * 0.62, depth = 0.95 }) {
  const M = getMaterials()
  const { seat, back, base, pillows } = useMemo(() => {
    const a0 = -span / 2, a1 = span / 2
    const bev = { bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.07, bevelSegments: 4, curveSegments: 48 }
    const seat = new THREE.ExtrudeGeometry(sector(R, R + depth, a0, a1), { depth: 0.28, ...bev }).rotateX(-Math.PI / 2).translate(0, 0.14, 0)
    const back = new THREE.ExtrudeGeometry(sector(R + depth - 0.3, R + depth, a0, a1), { depth: 0.5, ...bev }).rotateX(-Math.PI / 2).translate(0, 0.42, 0)
    const base = new THREE.ExtrudeGeometry(sector(R + 0.12, R + depth - 0.12, a0 + 0.06, a1 - 0.06), { depth: 0.1, bevelEnabled: false, curveSegments: 40 }).rotateX(-Math.PI / 2)
    const q = rng(7), pillows = []
    for (let i = 0; i < 3; i++) {
      const a = a0 + span * (0.18 + 0.32 * i), rr = R + depth - 0.45
      pillows.push({ pos: [rr * Math.cos(a), 0.66, -rr * Math.sin(a)], ry: Math.atan2(-Math.cos(a), Math.sin(a)), rust: i !== 1 && q() > 0.1 })
    }
    return { seat, back, base, pillows }
  }, [R, span, depth])
  return <group position={position} rotation={[0, rotation, 0]}>
    <Blob r={2.55} o={0.8} />
    <mesh geometry={seat} material={M.fabricCream} />
    <mesh geometry={back} material={M.fabricCream} />
    <mesh geometry={base} material={M.brass} />
    {pillows.filter((p) => p.rust).map((p, i) => (
      <mesh key={i} position={p.pos} rotation={[-0.22, p.ry, 0]} material={M.fabricRust}><boxGeometry args={[0.42, 0.38, 0.12]} /></mesh>
    ))}
  </group>
}

export function CoffeeTable({ position, r = 0.62 }) {
  const M = getMaterials()
  return <group position={position}>
    <Blob r={r + 0.3} o={1} />
    <mesh position={[0, 0.2, 0]} material={M.bronze}><cylinderGeometry args={[r, r * 0.9, 0.4, 48]} /></mesh>
    <mesh position={[0, 0.405, 0]} material={M.darkMarble}><cylinderGeometry args={[r + 0.02, r + 0.02, 0.025, 48]} /></mesh>
    <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}><torusGeometry args={[r + 0.02, 0.01, 6, 48]} /></mesh>
  </group>
}

export function Stool({ position }) {
  const M = getMaterials()
  return <group position={position}>
    <Blob r={0.34} o={1} />
    <mesh position={[0, 0.03, 0]} material={M.brass}><cylinderGeometry args={[0.2, 0.22, 0.04, 32]} /></mesh>
    <mesh position={[0, 0.35, 0]} material={M.brass}><cylinderGeometry args={[0.025, 0.025, 0.7, 12]} /></mesh>
    <mesh position={[0, 0.72, 0]} material={M.fabricRust}><cylinderGeometry args={[0.19, 0.17, 0.09, 32]} /></mesh>
    <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}><torusGeometry args={[0.18, 0.008, 6, 32]} /></mesh>
  </group>
}

export function Pendant({ position, kind = 'cone', drop = 2 }) {
  const M = getMaterials()
  return <group position={position}>
    <mesh position={[0, drop / 2, 0]} material={M.blackMetal}><cylinderGeometry args={[0.004, 0.004, drop, 4]} /></mesh>
    {kind === 'cone' ? <>
      <mesh material={M.blackMetal}><cylinderGeometry args={[0.1, 0.32, 0.3, 40, 1, true]} /></mesh>
      <mesh position={[0, -0.06, 0]} material={M.bulb}><sphereGeometry args={[0.07, 16, 12]} /></mesh>
    </> : <mesh material={M.bulb}><sphereGeometry args={[0.2, 24, 16]} /></mesh>}
  </group>
}

export function Painting({ position, w = 3.6, h = 1.9 }) {
  const M = getMaterials()
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 540
    const g = c.getContext('2d'), q = rng(5)
    const sky = g.createLinearGradient(0, 0, 0, 540); sky.addColorStop(0, '#2a2420'); sky.addColorStop(0.55, '#b0875a'); sky.addColorStop(1, '#2a2118')
    g.fillStyle = sky; g.fillRect(0, 0, 1024, 540)
    const ridge = (base, amp, col, seed) => {
      const r = rng(seed); const ph = [r() * 6, r() * 6, r() * 6]
      g.fillStyle = col; g.beginPath(); g.moveTo(0, 540)
      for (let x = 0; x <= 1024; x += 8) g.lineTo(x, base - amp * (0.5 * Math.sin(x / 140 + ph[0]) + 0.3 * Math.sin(x / 61 + ph[1]) + 0.2 * Math.sin(x / 23 + ph[2])))
      g.lineTo(1024, 540); g.fill()
    }
    ridge(250, 70, '#5a4632', 1); ridge(300, 60, '#3d3023', 2); ridge(350, 40, '#251d16', 3)
    const w2 = g.createLinearGradient(0, 380, 0, 540); w2.addColorStop(0, '#c49a62'); w2.addColorStop(1, '#2b2118')
    g.fillStyle = w2; g.fillRect(0, 400, 1024, 140)
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(240,210,160,${q() * 0.18})`; g.fillRect(q() * 1024, 400 + q() * 140, 30 + q() * 120, 1.5) }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t
  }, [])
  return <group position={position}>
    <mesh material={M.blackMetal}><boxGeometry args={[w + 0.14, h + 0.14, 0.06]} /></mesh>
    <mesh position={[0, 0, 0.035]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
    <mesh position={[0, h / 2 + 0.3, 0.04]} material={M.warm}><boxGeometry args={[w * 0.8, 0.03, 0.03]} /></mesh>
  </group>
}

export function EspressoMachine({ position }) {
  const M = getMaterials()
  return <group position={position}>
    <mesh position={[0, 0.3, 0]} material={M.chrome}><boxGeometry args={[0.95, 0.5, 0.55]} /></mesh>
    <mesh position={[0, 0.58, 0]} material={M.blackMetal}><boxGeometry args={[0.97, 0.08, 0.57]} /></mesh>
    {[-0.28, 0, 0.28].map((x) => <mesh key={x} position={[x, 0.12, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={M.blackMetal}><cylinderGeometry args={[0.04, 0.04, 0.12, 12]} /></mesh>)}
    {[-0.3, 0.3].map((x) => <mesh key={x} position={[x, 0.68, 0]} material={M.chrome}><cylinderGeometry args={[0.09, 0.09, 0.12, 20]} /></mesh>)}
  </group>
}

// Wall of walnut shelving with back-lit shelves and bottles (faces -x; place against the east wall)
export function BackBar({ position, len = 7, h = 2.5 }) {
  const M = getMaterials()
  const bottles = useMemo(() => {
    const q = rng(3), out = []
    for (let s = 0; s < 3; s++) for (let x = -len / 2 + 0.2; x < len / 2 - 0.2; x += 0.1 + q() * 0.08) {
      const bh = 0.2 + q() * 0.12
      out.push({ z: x, y: 0.55 + s * 0.62 + bh / 2 + 0.02, h: bh, r: 0.028 + q() * 0.018, m: (q() * 5) | 0 })
    }
    return out
  }, [len])
  return <group position={position}>
    <mesh position={[0, 1.6, 0]} material={M.walnut}><boxGeometry args={[0.06, h + 0.9, len + 0.3]} /></mesh>
    {[0.55, 1.17, 1.79, 2.4].map((y) => <mesh key={y} position={[-0.2, y, 0]} material={M.walnut}><boxGeometry args={[0.42, 0.04, len]} /></mesh>)}
    {[0.55, 1.17, 1.79].map((y) => <mesh key={'l' + y} position={[-0.38, y + 0.58, 0]} material={M.warm}><boxGeometry args={[0.02, 0.02, len - 0.1]} /></mesh>)}
    {bottles.map((b, i) => <mesh key={i} position={[-0.2, b.y, b.z]} material={M.bottle[b.m]}><cylinderGeometry args={[b.r, b.r, b.h, 10]} /></mesh>)}
  </group>
}

export function Logo({ position, size = 1, color = '#f3d9a8' }) {
  return <group position={position} scale={size}>
    <mesh><torusGeometry args={[0.3, 0.025, 12, 48]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    <Text font={FONT} fontSize={0.34} anchorX="center" anchorY="middle" position={[0, 0.01, 0]}>S<meshBasicMaterial color={color} toneMapped={false} /></Text>
  </group>
}

const ChairsImpl = withModel('chair', GLBChairs, ProceduralChairs)
export const Chairs = (props) => <>
  <ChairsImpl {...props} />
  <ContactShadows items={props.items.map((it) => ({ p: it.p, r: 0.42 * (it.s || 1) }))} />
</>
