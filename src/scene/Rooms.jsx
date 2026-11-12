import { useRef as _useRef } from 'react'
import { useFrame as _useFrame } from '@react-three/fiber'
import { mood as _mood } from './mood.js'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { getMaterials } from './materials.js'
import { ArchWall, GlassOpening, GlassPartition, Ceiling, Cove } from './Architecture.jsx'
import { PlantedTree, Tropical, PlanterBed } from './Plants.jsx'
import { Chairs, RoundTable, LongTable, Sofa, CoffeeTable, Stool, Pendant, Painting, EspressoMachine, BackBar, Logo } from './Furniture.jsx'
import { HALL_TABLES, PRIVATE_TABLE, GARDEN_GROUPS, ROOMS } from './layout.js'
import { face } from './util.js'
import { QUALITY } from './quality.js'

const R = Object.fromEntries(ROOMS.map((r) => [r.id, r]))
const SIDE = Math.PI / 2
const L = (...xs) => xs // readability helper

function Floors() {
  const M = getMaterials()
  const floor = useMemo(() => M.tiled('floor', 20 / 2.4, 78 / 2.4, { roughness: 0.15, bumpScale: 0.4, envMapIntensity: 1.4 }), [])
  const plaza = useMemo(() => M.tiled('floor', 90 / 2.4, 70 / 2.4, { roughness: 0.5, color: '#b3a58b', bumpScale: 0.6 }), [])
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -39]} material={floor}><planeGeometry args={[20, 78]} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 35]} material={plaza}><planeGeometry args={[90, 70]} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -39]}><planeGeometry args={[600, 600]} /><meshStandardMaterial color="#0d0a07" roughness={1} /></mesh>
  </>
}

function SideWalls() {
  const M = getMaterials()
  const specs = [
    { r: R.entrance, op: [-2.5, 2.5].map((x) => ({ x, w: 2.6, h: 3.8, arch: true })) },
    { r: R.hall, op: [-7.5, -2.5, 2.5, 7.5].map((x) => ({ x, w: 3.2, h: 4.6, arch: true })) },
    { r: R.private, op: [-3, 3].map((x) => ({ x, w: 2.4, h: 3.4, arch: true })) },
    { r: R.coffee, op: [] },
    { r: R.garden, op: [-9, -3, 3, 9].map((x) => ({ x, w: 3.6, h: 5.4, arch: true })) },
  ]
  return <>{specs.flatMap(({ r, op }) => [-10, 10].map((x) => (
    <group key={r.id + x} position={[x, 0, (r.z0 + r.z1) / 2]} rotation={[0, SIDE, 0]}>
      <ArchWall width={Math.abs(r.z1 - r.z0)} height={r.h} thickness={0.4} openings={op} />
      {op.map((o, i) => <GlassOpening key={i} {...o} mullions={r.id === 'garden' ? 3 : 2} glow />)}
    </group>
  )))}</>
}

function Dividers() {
  const M = getMaterials()
  return <>
    <ArchWall position={[0, 0, -10]} width={20} height={5.6} openings={[{ x: 0, w: 6, h: 4.2, arch: true }]} thickness={0.5} />
    <ArchWall position={[0, 0, -42]} width={20} height={5} openings={[{ x: -3, w: 3.2, h: 3.6, arch: true }]} />
    <ArchWall position={[0, 0, -54]} width={20} height={7} openings={[{ x: 0, w: 4, h: 4.2, arch: true }]} thickness={0.5} />
    {/* private room glass partition with a doorway at x = -3 */}
    <GlassPartition x0={-10} x1={-4.6} z={-30} h={4.6} />
    <GlassPartition x0={-1.4} x1={10} z={-30} h={4.6} />
    <mesh position={[0, 5.1, -30]} material={M.stone}><boxGeometry args={[20, 1.0, 0.4]} /></mesh>
    <mesh position={[-3, 4.1, -30]} material={M.stone}><boxGeometry args={[3.2, 1.0, 0.4]} /></mesh>
    <ArchWall position={[0, 0, -78]} width={20} height={7} openings={[{ x: 0, w: 5, h: 5.6, arch: true }, { x: -6.5, w: 3.4, h: 4.8, arch: true }, { x: 6.5, w: 3.4, h: 4.8, arch: true }]} />
    <group position={[0, 0, -78]}>
      <GlassOpening x={0} w={5} h={5.6} arch mullions={3} glow />
      <GlassOpening x={-6.5} w={3.4} h={4.8} arch mullions={2} glow />
      <GlassOpening x={6.5} w={3.4} h={4.8} arch mullions={2} glow />
    </group>
  </>
}

function Shell() {
  return <>
    <Floors /><SideWalls /><Dividers />
    {ROOMS.filter((r) => r.id !== 'garden').map((r) => <group key={r.id}><Ceiling z0={r.z0} z1={r.z1} h={r.h} /><Cove z0={r.z0} z1={r.z1} h={r.h} /></group>)}
    <GardenRoof />
  </>
}

function GardenRoof() {
  const M = getMaterials()
  const grid = useMemo(() => {
    const parts = []
    for (let x = -10; x <= 10; x += 2) parts.push(new THREE.BoxGeometry(0.07, 0.1, 24).translate(x, 0, 0))
    for (let z = -12; z <= 12; z += 2) parts.push(new THREE.BoxGeometry(20, 0.1, 0.07).translate(0, 0, z))
    return parts
  }, [])
  return <group position={[0, 7.05, -66]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={M.glass}><planeGeometry args={[20, 24]} /></mesh>
    {grid.map((g, i) => <mesh key={i} geometry={g} material={M.blackMetal} />)}
  </group>
}

// ---- Exterior façade, signage -------------------------------------------------------------
function Facade() {
  const M = getMaterials()
  const wall = [
    { x: -6, w: 4.4, h: 4.4, arch: true }, { x: 6, w: 4.4, h: 4.4, arch: true }, { x: 0, w: 5, h: 3.4, arch: false },
  ]
  return <group>
    <ArchWall width={20} height={5.4} thickness={0.5} openings={wall} />
    <GlassOpening x={-6} w={4.4} h={4.4} arch mullions={3} glow thick={0.5} />
    <GlassOpening x={6} w={4.4} h={4.4} arch mullions={3} glow thick={0.5} />
    {/* central entrance: open doorway in the middle, glazed sidelights + transom */}
    {[-1, 1].map((s) => <group key={s}>
      <mesh position={[s * 1.85, 1.3, 0]} material={M.glass}><planeGeometry args={[1.3, 2.6]} /></mesh>
      <mesh position={[s * 1.2, 1.3, 0]} material={M.blackMetal}><boxGeometry args={[0.06, 2.6, 0.1]} /></mesh>
      <mesh position={[s * 2.45, 1.7, 0]} material={M.blackMetal}><boxGeometry args={[0.06, 3.4, 0.1]} /></mesh>
    </group>)}
    <mesh position={[0, 3.0, 0]} material={M.glass}><planeGeometry args={[5, 0.8]} /></mesh>
    <mesh position={[0, 2.6, 0]} material={M.blackMetal}><boxGeometry args={[5, 0.06, 0.1]} /></mesh>
    <mesh position={[0, 3.4, 0.05]} material={M.blackMetal}><boxGeometry args={[5, 0.05, 0.12]} /></mesh>
    {[-1.5, 0, 1.5].map((x) => <mesh key={x} position={[x, 3.0, 0]} material={M.blackMetal}><boxGeometry args={[0.04, 0.8, 0.08]} /></mesh>)}
    {/* signage */}
    <group position={[0, 4.45, 0.3]}>
      <Logo position={[-2.35, 0.1, 0]} size={1.05} />
      <Text position={[0.45, 0.14, 0]} fontSize={0.62} letterSpacing={0.07} anchorX="center" anchorY="middle">NOIR CAFÉ<meshBasicMaterial color="#f6dcae" toneMapped={false} /></Text>
      <Text position={[0.45, -0.34, 0]} fontSize={0.19} letterSpacing={0.03} anchorX="center" anchorY="middle">Beyond Coffee. Into Experience.<meshBasicMaterial color="#f0cf98" toneMapped={false} /></Text>
    </group>
    {[-3.15, 3.15].map((x) => <mesh key={x} position={[x, 2.2, 0.28]} material={M.warm}><boxGeometry args={[0.05, 4, 0.04]} /></mesh>)}
    {/* forecourt planting */}
    <PlantedTree position={[-9.2, 0, 3.2]} height={4.6} crown={1.7} seed={1} r={0.9} ph={0.8} />
    <PlantedTree position={[9.2, 0, 3.2]} height={4.6} crown={1.7} seed={2} r={0.9} ph={0.8} />
    <PlantedTree position={[-4.4, 0, 3.0]} height={3.2} crown={1.2} seed={3} r={0.6} ph={0.6} kind="dark" />
    <PlantedTree position={[4.4, 0, 3.0]} height={3.2} crown={1.2} seed={4} r={0.6} ph={0.6} kind="dark" />
    <PlanterBed position={[-6.6, 0, 1.4]} length={4.2} seed={5} />
    <PlanterBed position={[6.6, 0, 1.4]} length={4.2} seed={6} />
    <PlantedTree position={[-14, 0, 6]} height={5.6} crown={2} seed={21} r={1} ph={0.8} />
    <PlantedTree position={[14, 0, 6]} height={5.6} crown={2} seed={22} r={1} ph={0.8} />
  </group>
}

// ---- Room 1 --------------------------------------------------------------------------------
function Reception() {
  const M = getMaterials()
  const flutes = useMemo(() => Array.from({ length: 36 }, (_, i) => -1.95 + i * 0.108), [])
  return <group>
    <group position={[-5.5, 0, -7.2]}>
      <mesh position={[0, 0.5, 0]} material={M.travertine}><boxGeometry args={[3.8, 1.0, 0.9]} /></mesh>
      {flutes.map((x, i) => <mesh key={i} position={[x, 0.5, 0.46]} material={M.walnut}><boxGeometry args={[0.07, 0.96, 0.04]} /></mesh>)}
      <mesh position={[0, 1.04, 0.05]} material={M.travertine}><boxGeometry args={[4, 0.07, 1.1]} /></mesh>
      <mesh position={[0, 0.06, 0.48]} material={M.warm}><boxGeometry args={[3.7, 0.03, 0.02]} /></mesh>
    </group>
    <mesh position={[-5.5, 2.3, -9.72]} material={M.walnut}><boxGeometry args={[4.6, 3.6, 0.1]} /></mesh>
    <Logo position={[-5.5, 2.6, -9.64]} size={1.3} />
    <Text position={[-5.5, 1.85, -9.64]} fontSize={0.3} letterSpacing={0.08} anchorX="center">NOIR CAFÉ<meshBasicMaterial color="#f3d9a8" toneMapped={false} /></Text>
    <PlantedTree position={[7.2, 0, -2.2]} height={4} crown={1.5} seed={31} r={0.8} ph={0.75} />
    <PlantedTree position={[-8, 0, -2.4]} height={4} crown={1.5} seed={32} r={0.8} ph={0.75} />
    <PlantedTree position={[8, 0, -8.2]} height={3.8} crown={1.4} seed={33} r={0.7} ph={0.7} kind="dark" />
    <Tropical position={[-8.3, 0, -9]} seed={34} />
  </group>
}

// ---- Room 2 --------------------------------------------------------------------------------
const HALL_CHAIRS = HALL_TABLES.flatMap(([tx, tz], t) => [0, 1, 2, 3].map((k) => {
  const a = k * Math.PI / 2 + 0.4 + t * 0.15
  return { p: [tx + Math.sin(a) * 0.9, tz + Math.cos(a) * 0.9], ry: a + Math.PI }
}))
function MainHall() {
  const M = getMaterials()
  const downlights = useMemo(() => {
    const out = []; for (let z = -12; z >= -28; z -= 4) for (let x = -8; x <= 8; x += 4) out.push([x, z]); return out
  }, [])
  const rings = [3.6, 2.5, 1.4]
  return <group>
    {HALL_TABLES.map(([x, z], i) => <RoundTable key={i} position={[x, 0, z]} />)}
    <Chairs items={HALL_CHAIRS} />
    {rings.map((r, i) => <group key={r} position={[0, 5.3 - i * 0.18, -20]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={M.warm}><torusGeometry args={[r, 0.035, 8, 96]} /></mesh>
      <mesh position={[0, 0.3 + i * 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.brass}><torusGeometry args={[r, 0.012, 6, 96]} /></mesh>
    </group>)}
    {downlights.map(([x, z], i) => <mesh key={i} position={[x, 5.58, z]} rotation={[Math.PI / 2, 0, 0]} material={M.warmSoft}><cylinderGeometry args={[0.1, 0.1, 0.02, 16]} /></mesh>)}
    {[-9, 9].flatMap((x, a) => [-14, -20, -26].map((z, b) => <PlantedTree key={`${x}${z}`} position={[x * 0.93, 0, z]} height={4.2} crown={1.5} seed={40 + a * 3 + b} r={0.75} ph={0.7} kind={b === 1 ? 'dark' : 'stone'} />))}
    <Tropical position={[-8.6, 0, -11.4]} seed={51} /><Tropical position={[8.6, 0, -11.4]} seed={52} />
    <Tropical position={[-8.6, 0, -28.6]} seed={53} /><Tropical position={[8.6, 0, -28.6]} seed={54} />
  </group>
}

// ---- Room 3 --------------------------------------------------------------------------------
const PT = PRIVATE_TABLE
const PRIV_CHAIRS = [
  ...[-2, -1, 0, 1, 2].flatMap((o) => [
    { p: [PT.c[0] - 1.08, PT.c[1] + o], ry: Math.PI / 2 }, { p: [PT.c[0] + 1.08, PT.c[1] + o], ry: -Math.PI / 2 },
  ]),
  { p: [PT.c[0], PT.c[1] - 3.05], ry: 0 }, { p: [PT.c[0], PT.c[1] + 3.05], ry: Math.PI },
]
function PrivateRoom() {
  const M = getMaterials()
  return <group>
    <LongTable position={[PT.c[0], 0, PT.c[1]]} len={PT.len} wid={PT.wid} />
    <Chairs items={PRIV_CHAIRS} />
    {/* back wall feature */}
    <mesh position={[3, 2.4, -41.74]} material={M.travertine}><boxGeometry args={[6.2, 4.2, 0.06]} /></mesh>
    <mesh position={[3, 4.55, -41.7]} material={M.warm}><boxGeometry args={[6.2, 0.03, 0.03]} /></mesh>
    <Painting position={[3, 2.4, -41.64]} w={3.8} h={1.9} />
    {/* pendant globes over the table */}
    {[-3, -2, -1, 0, 1, 2, 3].map((o) => <Pendant key={o} kind="globe" drop={1.3} position={[PT.c[0], 3.3 + Math.abs(o) * 0.05, PT.c[1] + o * 0.8]} />)}
    <mesh position={[PT.c[0], 4.55, PT.c[1]]} material={M.walnut}><boxGeometry args={[0.12, 0.05, 6]} /></mesh>
    <PlantedTree position={[7.6, 0, -33]} height={3.4} crown={1.2} seed={61} r={0.65} ph={0.65} kind="dark" />
    <Tropical position={[7.8, 0, -40]} seed={62} />
    <Tropical position={[-8.6, 0, -33]} seed={63} />
    <Tropical position={[-8.6, 0, -40.5]} seed={64} />
  </group>
}

// ---- Room 4 --------------------------------------------------------------------------------
function CoffeeLounge() {
  const M = getMaterials()
  const slats = useMemo(() => Array.from({ length: 24 }, (_, i) => -42.6 - i * 0.5), [])
  return <group>
    <group position={[7.5, 0, -49.5]}>
      <mesh position={[0, 0.52, 0]} material={M.travertine}><boxGeometry args={[0.95, 1.04, 8]} /></mesh>
      <mesh position={[0, 1.07, 0]} material={M.travertine}><boxGeometry args={[1.1, 0.06, 8.2]} /></mesh>
      <mesh position={[-0.49, 0.08, 0]} material={M.warm}><boxGeometry args={[0.02, 0.03, 7.9]} /></mesh>
      <mesh position={[-0.56, 1.04, 0]} material={M.brass}><boxGeometry args={[0.02, 0.02, 8.2]} /></mesh>
      <EspressoMachine position={[0.05, 1.1, -0.5]} />
    </group>
    <BackBar position={[9.7, 0, -49.5]} len={8} />
    {[-3, -1, 1, 3].map((o, i) => <Stool key={i} position={[6.2, 0, -49.5 + o * 1.4]} />)}
    {[-3.5, -1.2, 1.2, 3.5].map((o, i) => <Pendant key={i} position={[7.3, 3.7, -49.5 + o]} drop={1.4} />)}
    {/* walnut slat walls + logo door on west wall */}
    {slats.map((z, i) => <mesh key={i} position={[-9.7, 2.5, z - 0.1]} material={M.walnut}><boxGeometry args={[0.1, 5, 0.12]} /></mesh>)}
    <mesh position={[-9.74, 2, -48]} material={M.walnut}><boxGeometry args={[0.08, 4, 2.6]} /></mesh>
    <group position={[-9.66, 2.7, -48]} rotation={[0, SIDE, 0]}>
      <Logo size={1.2} /><Text position={[0, -0.7, 0]} fontSize={0.3} letterSpacing={0.1} anchorX="center">NOIR{'\n'}CAFÉ<meshBasicMaterial color="#f3d9a8" toneMapped={false} /></Text>
    </group>
    <PlantedTree position={[-7.6, 0, -43.6]} height={3.4} crown={1.2} seed={71} r={0.65} ph={0.65} kind="dark" />
    <Tropical position={[-7.8, 0, -52.6]} seed={72} />
    <Tropical position={[7.6, 0, -43.7]} seed={73} />
  </group>
}

// ---- Room 5 --------------------------------------------------------------------------------
const GARDEN_ARMCHAIRS = [[-3.4, -64.6], [-3.6, -62.8]].map((p) => ({ p, ry: face(p, [-6, -63]), s: 1.3 }))
function GardenLounge() {
  const trees = [[-9, -57], [-9, -63], [-9, -69], [-9, -75], [9, -57], [9, -63], [9, -69], [9, -75], [-4, -76.5], [4, -76.5]]
  return <group>
    {GARDEN_GROUPS.map((g, i) => <group key={i}>
      <Sofa position={[g.c[0], 0, g.c[1]]} rotation={g.rot} />
      <CoffeeTable position={[g.c[0], 0, g.c[1]]} />
    </group>)}
    <Chairs items={GARDEN_ARMCHAIRS} />
    {trees.map(([x, z], i) => <PlantedTree key={i} position={[x, 0, z]} height={5.4} crown={1.9} seed={80 + i} r={0.95} ph={0.8} kind={i % 3 === 1 ? 'dark' : 'stone'} />)}
    {[[-5, 4.9, -62], [5, 4.7, -62], [0, 5, -70], [-2.4, 4.6, -57], [2.4, 4.8, -74]].map((p, i) => <Pendant key={i} position={p} kind="globe" drop={7 - p[1]} />)}
    <Tropical position={[-3, 0, -57]} seed={95} /><Tropical position={[3, 0, -72]} seed={96} />
  </group>
}

// ---- Lights (physical units; point lights without shadows for performance) -----------------
const LIGHTS = [
  [[0, 3.2, 5], 70], [[-6, 4.6, -5], 40], [[6, 4.6, -5], 40],
  [[-5, 4.8, -16], 55], [[5, 4.8, -16], 55], [[-5, 4.8, -24], 55], [[5, 4.8, -24], 55], [[0, 4.9, -20], 60],
  [[-3, 3.8, -33], 45], [[3, 3.8, -37], 50], [[3, 3.8, -40], 40],
  [[0, 4.2, -45], 40], [[7, 3.6, -47], 45], [[7, 3.6, -52], 40],
  [[-5, 5.6, -62], 70], [[5, 5.6, -62], 70], [[0, 5.6, -70], 70], [[0, 5.2, -57], 50],
]
function Lights() {
  const n = QUALITY.maxLights
  const picked = LIGHTS.filter((_, i) => QUALITY.mobile ? i % Math.ceil(LIGHTS.length / n) === 0 : true).slice(0, n)
  const g = _useRef()
  _useFrame(() => {
    const v = _mood.v
    g.current?.children.forEach((c) => { c.intensity = c.isAmbientLight ? 0.3 * (1 + (1 - v) * 1.8) : c.userData.b * (0.3 + 0.7 * v) })
  })
  return <group ref={g}>
    <ambientLight intensity={0.3} color="#ffe6c2" />
    {picked.map(([p, i], k) => <pointLight key={k} position={p} intensity={i * 0.7} userData={{ b: i * 0.7 }} distance={22} decay={2} color="#ffcf94" />)}
  </group>
}

export default function Building() {
  return <>
    <Shell /><Facade /><Reception /><MainHall /><PrivateRoom /><CoffeeLounge /><GardenLounge /><Lights />
  </>
}
