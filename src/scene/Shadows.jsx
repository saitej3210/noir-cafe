import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mood } from './mood.js'
import { HALL_TABLES, PRIVATE_TABLE, GARDEN_GROUPS } from './layout.js'

// Real, soft, physically-placed shadows from the ceiling downlights above the tables — the thing that separates a render
// from a cartoon. The scene is static, so the shadow maps are only re-rendered when a light is re-assigned.
// Only the SLOTS nearest fixtures cast at any moment (cheap); a fixture swaps while its light is faded out so nothing pops.
const SLOTS = 3
const FIXTURES = [
  ...HALL_TABLES.map(([x, z]) => [x, 5.4, z]),
  [0, 5.4, -12], [0, 5.4, -28],
  [-3, 4.3, -33], [PRIVATE_TABLE.c[0], 4.3, PRIVATE_TABLE.c[1] - 1.5], [PRIVATE_TABLE.c[0], 4.3, PRIVATE_TABLE.c[1] + 1.5],
  [7, 4.6, -47], [7, 4.6, -52], [0, 4.4, -45],
  ...GARDEN_GROUPS.map((g) => [g.c[0], 6.4, g.c[1]]), [0, 6.4, -66], [0, 6.4, -58],
  [-4, 4.8, -6], [4, 4.8, -6], [0, 4.6, -3],
]

export default function Shadows({ enabled = true }) {
  const { gl, camera } = useThree()
  const group = useRef()
  const lights = useRef([])
  const st = useRef(Array.from({ length: SLOTS }, () => ({ fix: -1, k: 0 })))
  const targets = useMemo(() => Array.from({ length: SLOTS }, () => new THREE.Object3D()), [])
  const frames = useRef(0)
  useEffect(() => {
    gl.shadowMap.enabled = enabled
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
  }, [gl, enabled])
  useFrame((_, dt) => {
    if (!enabled) return
    const d = Math.min(dt, 0.05), s = st.current, c = camera.position
    const order = FIXTURES.map((f, i) => [Math.hypot(f[0] - c.x, f[2] - c.z), i]).sort((a, b) => a[0] - b[0]).slice(0, SLOTS).map((x) => x[1])
    const want = new Set(order), used = new Set(s.map((x) => x.fix))
    const spare = order.filter((i) => !used.has(i))
    s.forEach((slot, i) => {
      const keep = want.has(slot.fix)
      if (!keep && slot.k > 0.02) slot.k = THREE.MathUtils.damp(slot.k, 0, 10, d)
      else if (!keep) { // faded out → re-point this light at the next nearest fixture and refresh the shadow maps
        const n = spare.shift(); if (n !== undefined) {
          slot.fix = n; const f = FIXTURES[n], L = lights.current[i]
          L.position.set(f[0], f[1], f[2]); targets[i].position.set(f[0], 0, f[2]); targets[i].updateMatrixWorld(); L.target = targets[i]
          gl.shadowMap.needsUpdate = true
        }
      } else slot.k = THREE.MathUtils.damp(slot.k, 1, 6, d)
      const L = lights.current[i]; if (L) L.intensity = slot.fix >= 0 ? L.userData.base * slot.k * (0.3 + 0.7 * mood.v) : 0
    })
    if (frames.current++ < 90 && frames.current % 15 === 0) gl.shadowMap.needsUpdate = true // let late-loading models (GLB chairs/plants) into the maps
  })
  if (!enabled) return null
  return (
    <group ref={group}>
      {targets.map((t, i) => <primitive key={'t' + i} object={t} />)}
      {Array.from({ length: SLOTS }, (_, i) => (
        <spotLight
          key={i} ref={(l) => { lights.current[i] = l; if (l) l.userData.base = 230 }}
          angle={0.95} penumbra={0.85} intensity={0} distance={16} decay={2} color="#ffd9a6" castShadow
          shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-camera-near={0.5} shadow-camera-far={16}
        />
      ))}
    </group>
  )
}
