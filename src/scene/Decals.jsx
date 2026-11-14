import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

// Soft contact shadows: radial-gradient decals that sit on the floor under furniture and plants. They are what makes
// objects look like they rest on the floor instead of floating — and they cost almost nothing, so they run on every device.
let shared
function parts() {
  if (shared) return shared
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62)
  gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(0.35, 'rgba(0,0,0,.55)'); gr.addColorStop(0.7, 'rgba(0,0,0,.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
  const map = new THREE.CanvasTexture(c)
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  const mat = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, color: '#000', opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
  return (shared = { geo, mat })
}

// one decal (use inside a group that sits on the floor)
export function Blob({ r = 1, sx = 1, sz = 1, o = 1, y = 0.012, position = [0, 0, 0] }) {
  const { geo, mat } = parts()
  const m = useMemo(() => { const x = mat.clone(); x.opacity = mat.opacity * o; return x }, [o, mat])
  return <mesh geometry={geo} material={m} position={[position[0], y, position[2]]} scale={[r * 2 * sx, 1, r * 2 * sz]} renderOrder={1} />
}

// many decals in one draw call: items = [{ p:[x,z], r, sx?, sz?, o? }]
export function ContactShadows({ items, o = 1 }) {
  const { geo, mat } = parts(), ref = useRef()
  const m = useMemo(() => { const x = mat.clone(); x.opacity = mat.opacity * o; return x }, [o, mat])
  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    items.forEach((it, i) => { d.position.set(it.p[0], 0.012, it.p[1]); d.rotation.set(0, it.ry || 0, 0); d.scale.set(it.r * 2 * (it.sx || 1), 1, it.r * 2 * (it.sz || 1)); d.updateMatrix(); ref.current.setMatrixAt(i, d.matrix) })
    ref.current.instanceMatrix.needsUpdate = true
  }, [items])
  return <instancedMesh ref={ref} args={[geo, m, items.length]} frustumCulled={false} renderOrder={1} />
}

// dark gradient strip where a wall meets the floor (ambient occlusion in the corner)
export function WallBase({ x, z0, z1, side = 1, w = 0.9, o = 0.5 }) {
  const map = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 64
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr; g.fillRect(0, 0, 4, 64); return new THREE.CanvasTexture(c)
  }, [])
  return (
    <mesh position={[x + side * w / 2, 0.011, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2]} renderOrder={1}>
      <planeGeometry args={[Math.abs(z1 - z0), w]} />
      <meshBasicMaterial map={map} transparent opacity={o} depthWrite={false} toneMapped={false} color="#000" polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}
