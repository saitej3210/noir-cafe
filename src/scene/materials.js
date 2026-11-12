import * as THREE from 'three'
import { textures } from './textures.js'

let cache
export function getMaterials() {
  if (cache) return cache
  const T = textures()
  const std = (o) => new THREE.MeshStandardMaterial(o)
  const rep = (t, x, y) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(x, y); return c }
  const mk = (o) => (o.clearcoat ? new THREE.MeshPhysicalMaterial(o) : std(o))
  const tiled = (kind, rx, ry, o = {}) =>
    mk({ map: rep(T[kind].map, rx, ry), bumpMap: rep(T[kind].bump, rx, ry), bumpScale: 1, roughness: 0.6, ...o })
  const glow = (c, i = 2.6) => std({ color: '#2a1a0a', emissive: c, emissiveIntensity: i, toneMapped: false })

  cache = {
    tiled,
    stone: tiled('limestone', 1 / 3, 1 / 3, { roughness: 0.86, bumpScale: 1.4 }),
    ceiling: std({ color: '#e2d2b4', roughness: 0.95 }),
    travertine: tiled('travertine', 1 / 2, 1 / 2, { roughness: 0.42, bumpScale: 1.2, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
    darkMarble: tiled('darkMarble', 1, 1, { roughness: 0.1, metalness: 0.05, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.05 }),
    walnut: tiled('walnut', 1 / 1.5, 1 / 1.5, { roughness: 0.5, bumpScale: 0.8, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    brass: std({ color: '#c9984c', metalness: 1, roughness: 0.2 }),
    bronze: std({ color: '#3a2c20', metalness: 0.9, roughness: 0.32 }),
    blackMetal: std({ color: '#141312', metalness: 0.85, roughness: 0.38 }),
    chrome: std({ color: '#c9ccd0', metalness: 1, roughness: 0.18 }),
    fabricRust: new THREE.MeshPhysicalMaterial({
      color: '#98482a', roughness: 0.92, bumpMap: rep(T.fabric.bump, 6, 6), bumpScale: 0.6,
      sheen: 0.7, sheenColor: new THREE.Color('#d9825f'), sheenRoughness: 0.5, side: THREE.DoubleSide,
    }),
    fabricCream: new THREE.MeshPhysicalMaterial({
      color: '#e4d6bd', roughness: 0.95, bumpMap: rep(T.fabric.bump, 8, 8), bumpScale: 0.5,
      sheen: 0.6, sheenColor: new THREE.Color('#fff3e0'), sheenRoughness: 0.55, side: THREE.DoubleSide,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#dbe7e3', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.16,
      envMapIntensity: 1.8, depthWrite: false, side: THREE.DoubleSide,
    }),
    warm: glow('#ffc77a', 2.8),
    warmSoft: glow('#ffd9a0', 1.6),
    bulb: glow('#ffe2b0', 4),
    leaf: std({ color: '#ffffff', roughness: 0.5, side: THREE.DoubleSide }),
    bark: std({ color: '#4a3a2c', roughness: 0.92 }),
    soil: std({ color: '#2a1f17', roughness: 1 }),
    planterDark: std({ color: '#2b2a28', roughness: 0.55, metalness: 0.35 }),
    bottle: [ '#3a2a1a', '#7a4a1a', '#1f2a24', '#8a6a3a', '#2a1a14' ].map((c) => std({ color: c, roughness: 0.25, metalness: 0.2 })),
  }
  return cache
}
