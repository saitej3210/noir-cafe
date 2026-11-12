import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { QUALITY } from './quality.js'

// Golden dust motes drifting through each room's light.
const ZONES = [
  { p: [0, 3, -5], s: [16, 4, 9], n: 30 },
  { p: [0, 3, -20], s: [18, 4.5, 18], n: 70 },
  { p: [0, 2.5, -36], s: [18, 3.5, 10], n: 40 },
  { p: [0, 3, -48], s: [18, 4, 10], n: 45 },
  { p: [0, 4.5, -66], s: [18, 6, 20], n: 80 },
]
const BEAMS = [[-6, -59, 0.28], [-1, -63, 0.22], [4, -60, 0.3], [7, -68, 0.2], [-5, -70, 0.25]]
function GodRays() {
  return BEAMS.map(([x, z, tilt], i) => (
    <mesh key={i} position={[x, 3.4, z]} rotation={[0.05, 0, tilt]}>
      <cylinderGeometry args={[0.4, 1.9, 7, 24, 1, true]} />
      <meshBasicMaterial color="#ffe2b0" transparent opacity={0.055} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  ))
}

export default function Atmosphere() {
  const k = QUALITY.mobile ? 0.4 : 1
  return (
    <>
      {ZONES.map((z, i) => (
        <Sparkles key={i} position={z.p} scale={z.s} count={Math.round(z.n * k)} size={2.4} speed={0.15} opacity={0.55} noise={0.4} color="#ffd9a0" />
      ))}
      <GodRays />
      <Sparkles position={[7, 1.5, -49]} scale={[1.2, 1.6, 1.2]} count={14} size={5} speed={0.5} opacity={0.35} noise={1} color="#ffffff" />
    </>
  )
}
