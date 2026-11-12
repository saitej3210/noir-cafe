import { useMemo } from 'react'
import * as THREE from 'three'
import { merge } from './util.js'
import { getMaterials } from './materials.js'

export function openingPath({ x = 0, w, h, arch }, p = new THREE.Path()) {
  const r = w / 2
  p.moveTo(x - r, 0); p.lineTo(x + r, 0)
  if (arch) { p.lineTo(x + r, h - r); p.absarc(x, h - r, r, 0, Math.PI, false) }
  else { p.lineTo(x + r, h); p.lineTo(x - r, h) }
  p.lineTo(x - r, 0)
  return p
}

// Wall with real openings cut through it (arches or rectangles).
export function ArchWall({ position = [0, 0, 0], rotation = [0, 0, 0], width, height, thickness = 0.4, openings = [], material }) {
  const M = getMaterials()
  const geo = useMemo(() => {
    const hw = width / 2, s = new THREE.Shape()
    s.moveTo(-hw, -0.3); s.lineTo(hw, -0.3); s.lineTo(hw, height); s.lineTo(-hw, height); s.closePath()
    openings.forEach((o) => s.holes.push(openingPath(o)))
    const g = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false, curveSegments: 40 })
    g.translate(0, 0, -thickness / 2)
    return g
  }, [width, height, thickness, JSON.stringify(openings)])
  return <mesh geometry={geo} material={material || M.stone} position={position} rotation={rotation} />
}

const bar = (x, y, w, h, d = 0.07) => new THREE.BoxGeometry(w, h, d).translate(x, y, 0)

// Black-framed glass in an opening (arched or rectangular), in the wall's local space.
export function GlassOpening({ x = 0, w, h, arch = false, mullions = 3, rails = [], glow = false, thick = 0.4 }) {
  const M = getMaterials()
  const { frame, pane, trim } = useMemo(() => {
    const r = w / 2, spring = arch ? h - r : h, parts = []
    const topAt = (dx) => (arch ? spring + Math.sqrt(Math.max(0, r * r - dx * dx)) : h)
    parts.push(bar(x - r + 0.025, spring / 2, 0.05, spring), bar(x + r - 0.025, spring / 2, 0.05, spring), bar(x, 0.03, w, 0.06))
    if (arch) {
      const pts = []; for (let i = 0; i <= 40; i++) { const a = Math.PI * (i / 40); pts.push(new THREE.Vector3(x + r * Math.cos(a), spring + r * Math.sin(a), 0)) }
      parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.032, 6))
      parts.push(bar(x, spring, w, 0.05))
    } else parts.push(bar(x, h - 0.03, w, 0.06))
    for (let i = 1; i <= mullions; i++) {
      const dx = -r + (w * i) / (mullions + 1), top = topAt(dx)
      parts.push(bar(x + dx, top / 2, 0.04, top - 0.02))
    }
    rails.forEach((y) => parts.push(bar(x, y, w, 0.04)))
    const sh = openingPath({ x, w, h, arch }, new THREE.Shape())
    let trim = null
    if (glow && arch) {
      const pts = []; for (let i = 0; i <= 40; i++) { const a = Math.PI * (i / 40); pts.push(new THREE.Vector3(x + (r + 0.06) * Math.cos(a), spring + (r + 0.06) * Math.sin(a), 0)) }
      const t = [new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.02, 6), bar(x - r - 0.06, spring / 2, 0.04, spring, 0.04), bar(x + r + 0.06, spring / 2, 0.04, spring, 0.04)]
      trim = merge(t)
    }
    return { frame: merge(parts), pane: new THREE.ShapeGeometry(sh, 32), trim }
  }, [x, w, h, arch, mullions, glow, JSON.stringify(rails)])
  return (
    <group>
      <mesh geometry={frame} material={M.blackMetal} />
      <mesh geometry={pane} material={M.glass} renderOrder={2} />
      {trim && <>
        <mesh geometry={trim} material={M.warm} position={[0, 0, thick / 2 + 0.02]} />
        <mesh geometry={trim} material={M.warm} position={[0, 0, -thick / 2 - 0.02]} />
      </>}
    </group>
  )
}

// Floor-to-ceiling black-framed glass partition between x0..x1 (used for the private room)
export function GlassPartition({ x0, x1, z, h, bay = 1.6 }) {
  const M = getMaterials()
  const { frame, pane } = useMemo(() => {
    const w = x1 - x0, n = Math.round(w / bay), parts = []
    for (let i = 0; i <= n; i++) parts.push(bar(x0 + (w * i) / n, h / 2, 0.06, h, 0.1))
    parts.push(bar((x0 + x1) / 2, 0.04, w, 0.08, 0.1), bar((x0 + x1) / 2, h - 0.04, w, 0.08, 0.1), bar((x0 + x1) / 2, 2.6, w, 0.04, 0.08))
    return { frame: merge(parts), pane: new THREE.PlaneGeometry(w, h).translate((x0 + x1) / 2, h / 2, 0) }
  }, [x0, x1, h, bay])
  return (
    <group position={[0, 0, z]}>
      <mesh geometry={frame} material={M.blackMetal} />
      <mesh geometry={pane} material={M.glass} renderOrder={2} />
    </group>
  )
}

export function Ceiling({ z0, z1, h, material, width = 20 }) {
  const M = getMaterials()
  const d = Math.abs(z1 - z0)
  return <mesh position={[0, h + 0.15, (z0 + z1) / 2]} material={material || M.ceiling}><boxGeometry args={[width, 0.3, d]} /></mesh>
}

// Warm LED cove along both side walls
export function Cove({ z0, z1, h }) {
  const M = getMaterials()
  const d = Math.abs(z1 - z0)
  return <>
    {[-9.72, 9.72].map((x) => <mesh key={x} position={[x, h - 0.1, (z0 + z1) / 2]} material={M.warm}><boxGeometry args={[0.12, 0.05, d - 0.4]} /></mesh>)}
  </>
}
