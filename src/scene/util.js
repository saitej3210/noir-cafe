import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
export const rng = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) }
export const face = (p, c) => Math.atan2(c[0] - p[0], c[1] - p[1]) // chair front = +z, p/c = [x,z]

// Merge geometries safely: normalises attributes, never returns null.
export function merge(parts, label = 'geometry') {
  const norm = parts.filter(Boolean).map((g) => {
    const n = g.index ? g.toNonIndexed() : g.clone()
    for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k)
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2))
    if (!n.attributes.normal) n.computeVertexNormals()
    return n
  })
  const m = norm.length ? mergeGeometries(norm, false) : null
  if (!m) { console.error('[noir] merge failed for', label); return new THREE.BufferGeometry() }
  return m
}
