import * as THREE from 'three'
import { rng } from './util.js'
import { QUALITY } from './quality.js'

// Tileable value-noise fbm, returns Float32Array(size*size) in 0..1
function fbm(size, seed, base = 4, oct = 5, gain = 0.5) {
  const r = rng(seed), out = new Float32Array(size * size)
  let amp = 1, tot = 0
  for (let o = 0; o < oct; o++) {
    const n = base << o, lat = new Float32Array(n * n)
    for (let i = 0; i < lat.length; i++) lat[i] = r()
    for (let y = 0; y < size; y++) {
      const fy = (y / size) * n, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), ya = y0 % n, yb = (y0 + 1) % n
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * n, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), xa = x0 % n, xb = (x0 + 1) % n
        const a = lat[ya * n + xa], b = lat[ya * n + xb], c = lat[yb * n + xa], d = lat[yb * n + xb]
        out[y * size + x] += amp * ((a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy)
      }
    }
    tot += amp; amp *= gain
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot
  return out
}

function paint(size, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size
  const ctx = c.getContext('2d'), img = ctx.createImageData(size, size)
  fn(img.data, size); ctx.putImageData(img, 0, 0); return c
}
const px = (d, i, r, g, b) => { const o = i * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255 }
const clamp01 = (v) => Math.max(0, Math.min(1, v))

function limestone(size) {
  const a = fbm(size, 11, 3, 6), b = fbm(size, 12, 14, 3), c = fbm(size, 13, 52, 2)
  const bump = new Float32Array(size * size)
  const map = paint(size, (d) => {
    for (let i = 0; i < size * size; i++) {
      const pore = c[i] > 0.7 ? (c[i] - 0.7) * 2.2 : 0
      const k = (0.86 + 0.28 * (a[i] - 0.5) * 2 * 0.5 + 0.1 * (b[i] - 0.5)) * (1 - pore * 0.55)
      bump[i] = clamp01(0.5 + (a[i] - 0.5) * 0.6 + (b[i] - 0.5) * 0.4 - pore)
      px(d, i, 226 * k, 206 * k, 172 * k)
    }
  })
  return { map, bump: gray(size, bump) }
}
function travertine(size) {
  const n = fbm(size, 21, 3, 5), p = fbm(size, 22, 38, 2), w = fbm(size, 23, 6, 4)
  const bump = new Float32Array(size * size)
  const map = paint(size, (d) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x
      const band = Math.sin((y / size) * Math.PI * 2 * 7 + n[i] * 8) * 0.5 + 0.5
      const streak = Math.pow(w[i], 2) * 0.6
      const pit = p[i] > 0.74 ? 0.55 : 1
      const t = clamp01(band * 0.55 + streak)
      const r = (232 - 40 * t) * pit, g = (212 - 52 * t) * pit, b = (182 - 62 * t) * pit
      bump[i] = pit < 1 ? 0.1 : 0.55 + 0.2 * band
      px(d, i, r, g, b)
    }
  })
  return { map, bump: gray(size, bump) }
}
function floor(size) {
  const n = fbm(size, 31, 3, 5), w = fbm(size, 32, 8, 4)
  const bump = new Float32Array(size * size).fill(0.5)
  const half = size / 2
  const map = paint(size, (d) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x
      const tx = x % half, ty = y % half
      const v = Math.abs(Math.sin(((x + y) / size) * Math.PI * 2 * 3 + n[i] * 9))
      const vein = Math.pow(1 - v, 22)
      const v2 = Math.pow(1 - Math.abs(Math.sin(((x - y) / size) * Math.PI * 2 * 2 + n[i] * 6 + 1.3)), 40)
      let k = 0.93 + 0.12 * (w[i] - 0.5)
      let r = 208 * k, g = 190 * k, b = 160 * k
      const m = Math.min(1, vein * 0.55 + v2 * 0.35)
      r -= 70 * m; g -= 80 * m; b -= 85 * m
      if (tx < 1.5 || ty < 1.5 || tx > half - 1.5 || ty > half - 1.5) { r *= 0.55; g *= 0.55; b *= 0.55; bump[i] = 0.1 }
      px(d, i, r, g, b)
    }
  })
  return { map, bump: gray(size, bump) }
}
function darkMarble(size) {
  const n = fbm(size, 41, 3, 6), m = fbm(size, 42, 5, 5)
  const bump = new Float32Array(size * size).fill(0.5)
  const map = paint(size, (d) => {
    for (let i = 0; i < size * size; i++) {
      const ridge = 1 - Math.abs(2 * n[i] - 1)
      const vein = Math.pow(ridge, 11) * 0.9 + Math.pow(1 - Math.abs(2 * m[i] - 1), 18) * 0.35
      const base = 22 + 10 * m[i]
      px(d, i, base + 215 * vein, base - 2 + 195 * vein, base - 4 + 160 * vein)
    }
  })
  return { map, bump: gray(size, bump) }
}
function walnut(size) {
  const f = fbm(size, 51, 5, 5), g = fbm(size, 52, 40, 3)
  const bump = new Float32Array(size * size)
  const map = paint(size, (d) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const t = x / size, m = t < 0.5 ? t * 2 : (1 - t) * 2 // mirrored => seamless
      const xi = Math.floor(m * size * 0.1), i = y * size + x
      const n = f[y * size + xi]
      const grain = Math.sin(y * 0.33 + n * 16) * 0.5 + 0.5
      const pores = g[y * size + xi] > 0.72 ? 0.7 : 1
      const k = (0.62 + 0.38 * grain) * pores
      bump[i] = 0.4 + 0.4 * grain * pores
      px(d, i, 112 * k, 70 * k, 38 * k)
    }
  })
  return { map, bump: gray(size, bump) }
}
function fabric(size) {
  const n = fbm(size, 61, 24, 3)
  const bump = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++)
    bump[y * size + x] = clamp01(0.5 + 0.22 * Math.sin(x * 1.6) * Math.sin(y * 1.6) + 0.3 * (n[y * size + x] - 0.5))
  return { map: gray(size, bump), bump: gray(size, bump) }
}
function gray(size, f) {
  return paint(size, (d) => { for (let i = 0; i < size * size; i++) { const v = f[i] * 255; px(d, i, v, v, v) } })
}

let cache
export function textures() {
  if (cache) return cache
  const S = QUALITY.texture, s = Math.min(S, 512)
  const mk = (cv, srgb) => {
    const t = new THREE.CanvasTexture(cv)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
    t.anisotropy = 8
    return t
  }
  const pair = ({ map, bump }) => ({ map: mk(map, true), bump: mk(bump, false) })
  cache = {
    limestone: pair(limestone(S)), travertine: pair(travertine(s)), floor: pair(floor(S)),
    darkMarble: pair(darkMarble(s)), walnut: pair(walnut(s)), fabric: pair(fabric(256)),
  }
  return cache
}
