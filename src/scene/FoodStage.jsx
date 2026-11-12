import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { ROOMS, MENU_PROPS } from './layout.js'
import { foodState } from './stage.js'
import { QUALITY } from './quality.js'

const china = <meshPhysicalMaterial color="#f4efe6" roughness={0.25} clearcoat={0.6} />
const food = (c, r = 0.55) => <meshStandardMaterial color={c} roughness={r} />

function Prop({ kind, color }) {
  switch (kind) {
    case 'cup': return <group>
      <mesh position={[0, 0.006, 0]}><cylinderGeometry args={[0.1, 0.1, 0.012, 32]} />{china}</mesh>
      <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.07, 0.05, 0.11, 32]} />{china}</mesh>
      <mesh position={[0, 0.123, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.063, 32]} />{food(color, 0.2)}</mesh>
      <mesh position={[0.078, 0.075, 0]}><torusGeometry args={[0.028, 0.007, 8, 16]} />{china}</mesh>
    </group>
    case 'glass': return <group>
      <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.05, 0.04, 0.17, 24, 1, true]} /><meshPhysicalMaterial color="#dbe7e3" transparent opacity={0.25} roughness={0.03} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.046, 0.037, 0.12, 24]} />{food(color, 0.2)}</mesh>
      <mesh position={[0.012, 0.12, 0]} rotation={[0, 0, -0.15]}><cylinderGeometry args={[0.004, 0.004, 0.2, 8]} />{food('#c9984c', 0.3)}</mesh>
    </group>
    case 'plate': return <group>
      <mesh position={[0, 0.007, 0]}><cylinderGeometry args={[0.14, 0.11, 0.014, 40]} />{china}</mesh>
      <mesh position={[0, 0.04, 0]} scale={[1, 0.5, 0.8]}><sphereGeometry args={[0.06, 20, 14]} />{food(color)}</mesh>
      {[[-0.06, 0.03], [0.07, -0.02], [0.02, 0.07]].map(([x, z], i) => <mesh key={i} position={[x, 0.03, z]}><sphereGeometry args={[0.014, 10, 8]} />{food('#4f7a35')}</mesh>)}
    </group>
    case 'bowl': return <group>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}><sphereGeometry args={[0.1, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />{china}</mesh>
      <mesh position={[0, 0.045, 0]} scale={[1, 0.35, 1]}><sphereGeometry args={[0.092, 24, 12]} />{food(color)}</mesh>
    </group>
    case 'cake': return <group>
      {[0, 1, 2].map((i) => <mesh key={i} position={[0, 0.015 + i * 0.034, 0]}><boxGeometry args={[0.14 - i * 0.01, 0.03, 0.1]} />{food(i === 1 ? '#f3e6c8' : color, 0.8)}</mesh>)}
      <mesh position={[0, 0.115, 0]}><boxGeometry args={[0.12, 0.008, 0.09]} />{food('#3a2014', 0.9)}</mesh>
    </group>
    default: return <group>
      <mesh position={[0, 0.07, 0]} scale={[1, 0.85, 1]}><sphereGeometry args={[0.075, 24, 16]} />{food(color, 0.35)}</mesh>
      <mesh position={[0.1, 0.09, 0]} rotation={[0, 0, -0.9]}><cylinderGeometry args={[0.008, 0.016, 0.09, 10]} />{food(color, 0.35)}</mesh>
      <mesh position={[0, 0.15, 0]}><sphereGeometry args={[0.022, 12, 8]} />{food('#c9984c', 0.3)}</mesh>
    </group>
  }
}
const HOT = new Set(['cup', 'pot', 'plate', 'bowl'])
const SLOTS = { 3: [[-0.12, 0.13], [0.12, 0.13], [0, -0.13]], 4: [[-0.12, 0.14], [0.12, 0.14], [-0.12, -0.14], [0.12, -0.14]] }
const D = 1.1 // distance in front of the camera (close enough to never be hidden by furniture)

// Props pop out beside the flipped menu card: spring-in, spin, bob, steam; the one you hover on the card enlarges.
export default function FoodStage() {
  const g = useRef(), items = useRef(MENU_PROPS.map((r) => r.map(() => null)))
  const { camera, size } = useThree()
  useFrame((state, dt) => {
    if (!g.current) return
    g.current.position.copy(camera.position); g.current.quaternion.copy(camera.quaternion)
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * D * (size.width / size.height), T = state.clock.elapsedTime - foodState.t0 - 1.7
    MENU_PROPS.forEach((room, r) => {
      const side = ROOMS[r].side === 'left' ? 1 : -1, on = foodState.room === r, slots = SLOTS[room.length] || SLOTS[4]
      room.forEach((_, i) => {
        const o = items.current[r][i]; if (!o) return
        const u = o.userData, tt = T - i * 0.35
        u.a = THREE.MathUtils.damp(u.a ?? 0, on && tt > 0 ? 1 : 0, on ? 14 : 6, dt)
        o.visible = u.a > 0.01; if (!o.visible) return
        const pop = tt > 0 ? 1 - Math.exp(-5 * tt) * Math.cos(12 * tt) : 0, hov = foodState.hover === i
        u.h = THREE.MathUtils.damp(u.h ?? 1, hov ? 1.4 : 1, 8, dt)
        o.scale.setScalar(Math.max(0.001, pop * u.h * 0.95 * u.a))
        o.position.set(side * halfW * 0.24 + slots[i][0], slots[i][1] + Math.sin(state.clock.elapsedTime * 1.6 + i) * 0.01, -D)
        o.rotation.set(0.55, (u.r = (u.r ?? 0) + dt * (hov ? 3.2 : 0.7)), 0)
      })
    })
  })
  if (QUALITY.mobile) return null
  return (
    <group ref={g}>
      <pointLight position={[0, 0.2, 0.3]} intensity={1.6} distance={3} decay={2} color="#ffe2b0" />
      {MENU_PROPS.map((room, r) => room.map(([kind, color], i) => (
        <group key={`${r}-${i}`} ref={(el) => { items.current[r][i] = el }} visible={false}>
          <mesh position={[0, -0.004, 0]}><cylinderGeometry args={[0.16, 0.16, 0.008, 40]} /><meshStandardMaterial color="#c9984c" metalness={1} roughness={0.25} /></mesh>
          <Prop kind={kind} color={color} />
          {HOT.has(kind) && <Sparkles position={[0, 0.2, 0]} scale={[0.12, 0.22, 0.12]} count={8} size={3} speed={0.6} opacity={0.35} noise={1} color="#ffffff" />}
        </group>
      )))}
    </group>
  )
}
