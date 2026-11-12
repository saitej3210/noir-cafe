import { useEffect, useLayoutEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { mood } from './mood.js'
import { getMaterials } from './materials.js'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ToneMapping, N8AO, SMAA } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import Building from './Rooms.jsx'
import Atmosphere from './Atmosphere.jsx'
import CameraRig from './CameraRig.jsx'
import Tables from './Tables.jsx'
import FoodStage from './FoodStage.jsx'
import { QUALITY } from './quality.js'

function Env() {
  const { gl, scene } = useThree()
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.65
    scene.background = new THREE.Color('#110c08')
    scene.fog = new THREE.FogExp2('#140e09', 0.005)
    return () => { env.dispose(); pm.dispose() }
  }, [gl, scene])
  return null
}

const NIGHT_BG = new THREE.Color('#110c08'), DAY_BG = new THREE.Color('#bcd3dc'), NIGHT_FOG = new THREE.Color('#140e09'), DAY_FOG = new THREE.Color('#d8d3c6')
const GLOW = [['warm', 2.8], ['warmSoft', 1.6], ['bulb', 4]]
function Mood() {
  const { scene } = useThree()
  useFrame((_, dt) => {
    const diff = Math.abs(mood.v - mood.target)
    if (diff < 0.0005 && mood.v === mood.target) return
    mood.v = diff < 0.0005 ? mood.target : THREE.MathUtils.damp(mood.v, mood.target, 2.5, Math.min(dt, 0.05))
    const v = mood.v, M = getMaterials()
    if (scene.background?.isColor) scene.background.copy(DAY_BG).lerp(NIGHT_BG, v)
    if (scene.fog) { scene.fog.color.copy(DAY_FOG).lerp(NIGHT_FOG, v); scene.fog.density = 0.003 + 0.002 * v }
    scene.environmentIntensity = 1.15 - 0.5 * v
    for (const [k, b] of GLOW) M[k].emissiveIntensity = b * (0.2 + 0.8 * v)
    document.documentElement.dataset.mood = v < 0.5 ? 'day' : 'night'
  })
  return null
}

// tier 2 = AO + bloom, 1 = bloom only, 0 = plain render. Drops automatically when FPS falls, climbs back when it recovers.
export default function Scene() {
  const { gl, setDpr } = useThree()
  const max = QUALITY.post ? 2 : 0
  const [autoTier, setTier] = useState(max)
  const [low, setLow] = useState(false)
  const tier = low ? 0 : autoTier
  useEffect(() => { const h = () => setLow((l) => !l); window.addEventListener('noir-lite', h); return () => window.removeEventListener('noir-lite', h) }, [])
  useEffect(() => {
    gl.toneMapping = tier > 0 ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping
    const dpr = Math.min(window.devicePixelRatio || 1, QUALITY.mobile ? 1.5 : 2)
    setDpr(tier === 2 ? dpr : tier === 1 ? Math.min(dpr, 1.5) : Math.min(dpr, QUALITY.post ? 1 : 1.25))
  }, [tier, gl, setDpr])
  return (
    <>
      <PerformanceMonitor flipflops={3} onDecline={() => setTier((t) => Math.max(0, t - 1))} onIncline={() => setTier((t) => Math.min(max, t + 1))} onFallback={() => setTier(0)} />
      <Env />
      <Mood />
      <Building />
      <Atmosphere />
      <CameraRig />
      <Tables />
      <FoodStage />
      {tier > 0 && (
        <EffectComposer key={tier} multisampling={0} disableNormalPass>
          {tier === 2 ? <N8AO halfRes aoRadius={1.3} distanceFalloff={1.2} intensity={2.2} quality="low" /> : <></>}
          <Bloom intensity={0.55} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
          <Vignette eskil={false} offset={0.25} darkness={0.35} />
        </EffectComposer>
      )}
    </>
  )
}
