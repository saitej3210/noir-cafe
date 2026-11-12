// Samples the camera spline and reports any point that comes within MARGIN of a wall/furniture box.
import * as THREE from 'three'
import { WAYPOINTS, OBSTACLES } from '../src/scene/layout.js'

const MARGIN = 0.35
const curve = new THREE.CatmullRomCurve3(WAYPOINTS.map((w) => new THREE.Vector3(...w.p)), false, 'centripetal')
const hits = new Map()
const N = 4000
for (let i = 0; i <= N; i++) {
  const u = i / N, p = curve.getPoint(u)
  for (const [x0, x1, z0, z1, y0, y1, name] of OBSTACLES) {
    if (p.x > x0 - MARGIN && p.x < x1 + MARGIN && p.z > z0 - MARGIN && p.z < z1 + MARGIN && p.y > y0 && p.y < y1 && !hits.has(name))
      hits.set(name, { u: u.toFixed(3), x: p.x.toFixed(2), y: p.y.toFixed(2), z: p.z.toFixed(2) })
  }
  if (p.y < 1.4 && p.z < 1) console.log('low camera at u=', u.toFixed(3), p.y.toFixed(2))
}
if (hits.size) { console.error('Path clips obstacles:'); for (const [k, v] of hits) console.error(' -', k, v); process.exit(1) }
console.log(`Camera path clear of ${OBSTACLES.length} obstacle boxes (margin ${MARGIN} m, ${N} samples).`)
