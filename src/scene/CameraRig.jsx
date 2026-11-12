import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { foodState } from './stage.js'
import { QUALITY } from './quality.js'
import { WAYPOINTS, ROOMS, OBSTACLES } from './layout.js'

const show = (id, on) => { for (const k of [id, id.replace('text', 'menu')]) { const el = document.getElementById(k); if (el) el.classList.toggle('on', on) } }

export const scrollState = { progress: 0, intro: 1, introTarget: 1 } // intro: 1 = pulled back, 0 = in position

export default function CameraRig() {
  const { camera, size, gl } = useThree()
  const st = useRef({ u: 0, room: -2, active: -2, look: new THREE.Vector3(0, 3, 0), warned: new Set() })
  const { pos, look } = useMemo(() => ({
    pos: new THREE.CatmullRomCurve3(WAYPOINTS.map((w) => new THREE.Vector3(...w.p)), false, 'centripetal'),
    look: new THREE.CatmullRomCurve3(WAYPOINTS.map((w) => new THREE.Vector3(...w.t)), false, 'centripetal'),
  }), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const s = st.current, d = Math.min(dt, 0.05)
    // damped follow of the scroll progress => natural acceleration / deceleration
    s.u = THREE.MathUtils.damp(s.u, scrollState.progress, 4, d)
    const u = THREE.MathUtils.clamp(s.u, 0, 1)
    pos.getPoint(u, camera.position)
    scrollState.intro = THREE.MathUtils.damp(scrollState.intro, scrollState.introTarget, 1.1, d)
    const k = scrollState.intro // cinematic opening: slow drift in from far away once "Enter" is pressed
    camera.position.z += k * 12; camera.position.y += k * 1.8; camera.position.x += Math.sin(state.clock.elapsedTime * 0.35) * 0.9 * k
    look.getPoint(u, tmp)
    s.look.lerp(tmp, 1 - Math.exp(-7 * d))
    const px = QUALITY.mobile ? 0 : state.pointer.x, py = QUALITY.mobile ? 0 : state.pointer.y
    s.px = THREE.MathUtils.damp(s.px ?? 0, px, 3, d); s.py = THREE.MathUtils.damp(s.py ?? 0, py, 3, d)
    camera.position.y += Math.sin(state.clock.elapsedTime * 1.1) * 0.012 * Math.min(1, u * 30)
    camera.lookAt(s.look.x + s.px * 1.6, s.look.y + s.py * 0.7, s.look.z)

    const fov = size.width / size.height < 0.8 ? 72 : 52
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix() }

    // room caption
    const z = camera.position.z
    const idx = z > 0.2 ? -1 : ROOMS.findIndex((r) => z <= r.z0 && z > r.z1)
    if (idx !== s.room) {
      s.room = idx
      const el = document.getElementById('caption')
      if (el) { if (idx >= 0) { el.textContent = `${idx + 1}. ${ROOMS[idx].name}`; el.classList.add('on') } else el.classList.remove('on') }
    }

    const dbg = document.getElementById('debug')
    if (dbg) dbg.textContent = `u ${u.toFixed(3)}  pos ${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}\ncalls ${gl.info.render.calls}  tris ${gl.info.render.triangles}  textures ${gl.info.memory.textures}`

    // cinematic room text: one block visible at a time (5 = finale)
    let active = -1
    const r = ROOMS[idx]
    if (u > 0.965) active = 5
    else if (z < 6 && z > -8) active = 0
    else if (r && idx > 0) {
      const f = (r.z0 - z) / (r.z0 - r.z1)
      if (f > r.show[0] && f < r.show[1]) active = idx
    }
    if (active !== s.active) {
      if (s.active >= 0) show(s.active === 5 ? 'room-text-finale' : `room-text-${s.active}`, false)
      if (active >= 0) show(active === 5 ? 'room-text-finale' : `room-text-${active}`, true)
      s.active = active
      foodState.room = active >= 0 && active < 5 ? active : -1; foodState.t0 = state.clock.elapsedTime
    }

    if (import.meta.env.DEV) {
      const p = camera.position
      for (const [x0, x1, z0, z1, y0, y1, name] of OBSTACLES) {
        if (p.x > x0 - 0.35 && p.x < x1 + 0.35 && p.z > z0 - 0.35 && p.z < z1 + 0.35 && p.y > y0 && p.y < y1 && !s.warned.has(name)) {
          s.warned.add(name); console.warn(`[camera] within 0.35 m of "${name}" at u=${u.toFixed(3)}`)
        }
      }
    }
  })
  return null
}
