import * as THREE from 'three'
import { textures } from './textures.js'

let cache
export function getMaterials() {
  if (cache) return cache
  const T = textures()
  const std = (o) => new THREE.MeshStandardMaterial(o)
  const phys = (o) => new THREE.MeshPhysicalMaterial(o)
  const rep = (t, x, y) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(x, y); return c }
  const mk = (o) => (o.clearcoat || o.sheen || o.anisotropy ? phys(o) : std(o))
  // PBR surface from a texture set: colour + normal + roughness maps. `roughness` multiplies the roughness map.
  const tiled = (kind, rx, ry, { normal = 1, ...o } = {}) =>
    mk({ map: rep(T[kind].map, rx, ry), normalMap: rep(T[kind].normal, rx, ry), normalScale: new THREE.Vector2(normal, normal), roughnessMap: rep(T[kind].rough, rx, ry), roughness: 1, ...o })
  const glow = (c, i = 2.6) => std({ color: '#2a1a0a', emissive: c, emissiveIntensity: i, toneMapped: false })
  const upholstery = (kind, rx, ry, color, o = {}) => phys({ map: rep(T[kind].map, rx, ry), normalMap: rep(T[kind].normal, rx, ry), roughnessMap: rep(T[kind].rough, rx, ry), roughness: 1, color, side: THREE.DoubleSide, ...o })

  cache = {
    tiled, rep,
    stone: tiled('limestone', 1 / 3, 1 / 3, { roughness: 0.92, normal: 1.1, color: '#f2e9d8' }),
    ceiling: tiled('limestone', 1 / 4, 1 / 4, { roughness: 1, normal: 0.5, color: '#e6ded0' }),
    travertine: tiled('travertine', 1 / 2, 1 / 2, { roughness: 0.95, normal: 1.1, clearcoat: 0.18, clearcoatRoughness: 0.45 }),
    darkMarble: tiled('darkMarble', 1, 1, { roughness: 1, normal: 0.3, metalness: 0.02, envMapIntensity: 0.6, clearcoat: 0.7, clearcoatRoughness: 0.05 }),
    walnut: tiled('walnut', 1 / 1.5, 1 / 1.5, { roughness: 0.9, normal: 0.9, color: '#e8d2bc', clearcoat: 0.35, clearcoatRoughness: 0.35 }),
    brass: std({ color: '#c9984c', metalness: 1, roughness: 0.26, envMapIntensity: 1.3 }),
    bronze: std({ color: '#3a2c20', metalness: 0.9, roughness: 0.34 }),
    blackMetal: std({ color: '#141312', metalness: 0.85, roughness: 0.4 }),
    chrome: std({ color: '#c9ccd0', metalness: 1, roughness: 0.16 }),
    // rust-coloured velvet-leather for the dining chairs
    fabricRust: upholstery('leather', 3, 3, '#8a4125', { roughness: 0.95, sheen: 0.55, sheenColor: new THREE.Color('#d9825f'), sheenRoughness: 0.45, normalScale: new THREE.Vector2(0.9, 0.9) }),
    fabricCream: upholstery('fabric', 5, 5, '#e6d8bf', { roughness: 1, sheen: 0.7, sheenColor: new THREE.Color('#fff3e0'), sheenRoughness: 0.6, normalScale: new THREE.Vector2(1.2, 1.2) }),
    linen: upholstery('fabric', 8, 8, '#efe6d6', { roughness: 1, normalScale: new THREE.Vector2(0.8, 0.8) }),
    glass: phys({ color: '#dbe7e3', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.14, envMapIntensity: 1.8, depthWrite: false, side: THREE.DoubleSide }),
    glassClear: phys({ color: '#f4fbf8', roughness: 0.02, transparent: true, opacity: 0.22, envMapIntensity: 2.2, depthWrite: false, side: THREE.DoubleSide }),
    ceramic: phys({ color: '#f6f1e8', roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
    wax: phys({ color: '#f1e3c4', roughness: 0.5, sheen: 0.3, sheenColor: new THREE.Color('#ffd9a0') }),
    warm: glow('#ffc77a', 2.8),
    warmSoft: glow('#ffd9a0', 1.6),
    bulb: glow('#ffe2b0', 4),
    flame: std({ color: '#ffcf80', emissive: '#ffb04a', emissiveIntensity: 5, toneMapped: false }),
    leaf: std({ color: '#ffffff', map: T.leaf, roughness: 0.42, side: THREE.DoubleSide, emissive: '#0c1a07', emissiveIntensity: 0.3, envMapIntensity: 0.8 }),
    bark: tiled('bark', 1, 2, { roughness: 1, normal: 1.4, color: '#c8b8a6' }),
    soil: std({ color: '#2a1f17', roughness: 1 }),
    planterDark: std({ color: '#2b2a28', roughness: 0.5, metalness: 0.35 }),
    bottle: ['#3a2a1a', '#7a4a1a', '#1f2a24', '#8a6a3a', '#2a1a14'].map((c) => phys({ color: c, roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 })),
  }
  return cache
}
