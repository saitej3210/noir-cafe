import * as THREE from 'three'
import { rng } from './util.js'
import { QUALITY } from './quality.js'

// ---------------------------------------------------------------------------------------------------------
// Procedural PBR texture sets: every material gets colour + NORMAL + ROUGHNESS maps (not just a bump map), built
// from physically-motivated height/roughness fields — grout lines, slab seams, wood rings and pores, leather
// grain, fabric weave, leaf veins — so surfaces catch light the way real stone, timber and cloth do.
// Everything tiles seamlessly. Drop-in photo textures can replace any set (see README "Photoreal textures").
// ---------------------------------------------------------------------------------------------------------

// Tileable value-noise fbm. bx/by = lattice cells across x / y (different values → stretched, grain-like noise).
function fbm(size, seed, bx = 4, oct = 5, gain = 0.5, by = bx) {
  const r = rng(seed), out = new Float32Array(size * size)
  let amp = 1, tot = 0
  for (let o = 0; o < oct; o++) {
    const nx = bx << o, ny = by << o, lat = new Float32Array(nx * ny)
    for (let i = 0; i < lat.length; i++) lat[i] = r()
    for (let y = 0; y < size; y++) {
      const fy = (y / size) * ny, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), ya = y0 % ny, yb = (y0 + 1) % ny
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * nx, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), xa = x0 % nx, xb = (x0 + 1) % nx
        const a = lat[ya * nx + xa], b = lat[ya * nx + xb], c = lat[yb * nx + xa], d = lat[yb * nx + xb]
        out[y * size + x] += amp * ((a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy)
      }
    }
    tot += amp; amp *= gain
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot
  return out
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const mix = (a, b, t) => a + (b - a) * t
const sstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t) }

function canvasFrom(size, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size
  const ctx = c.getContext('2d'), img = ctx.createImageData(size, size), d = img.data
  fn(d); ctx.putImageData(img, 0, 0); return c
}
const rgbCanvas = (size, r, g, b) => canvasFrom(size, (d) => { for (let i = 0, n = size * size; i < n; i++) { const o = i * 4; d[o] = clamp01(r[i] / 255) * 255; d[o + 1] = clamp01(g[i] / 255) * 255; d[o + 2] = clamp01(b[i] / 255) * 255; d[o + 3] = 255 } })
const grayCanvas = (size, f) => canvasFrom(size, (d) => { for (let i = 0, n = size * size; i < n; i++) { const v = clamp01(f[i]) * 255, o = i * 4; d[o] = d[o + 1] = d[o + 2] = v; d[o + 3] = 255 } })
// height field → tangent-space (OpenGL) normal map, wrapping at the edges so it tiles
function normalCanvas(size, h, strength) {
  return canvasFrom(size, (d) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const xl = (x - 1 + size) % size, xr = (x + 1) % size, yu = (y - 1 + size) % size, yd = (y + 1) % size
      const dx = (h[y * size + xr] - h[y * size + xl]) * strength, dy = (h[yd * size + x] - h[yu * size + x]) * strength
      const l = Math.hypot(dx, dy, 1), o = (y * size + x) * 4
      d[o] = (-dx / l * 0.5 + 0.5) * 255; d[o + 1] = (dy / l * 0.5 + 0.5) * 255; d[o + 2] = (1 / l * 0.5 + 0.5) * 255; d[o + 3] = 255
    }
  })
}
// pack {r,g,b: Float32Array 0..255, h: height 0..1, rough: 0..1} into three canvases
function pack(size, { r, g, b, h, rough, strength = 3 }) {
  return { color: rgbCanvas(size, r, g, b), normal: normalCanvas(size, h, strength), rough: grayCanvas(size, rough) }
}
const planes = (n) => [new Float32Array(n), new Float32Array(n), new Float32Array(n)]

// ---- honed limestone wall slabs (2 x 2 slabs per tile, hairline joints, fossil speckle, soft clouding) ------------------
function limestone(S) {
  const n = S * S, [R, G, B] = planes(n), H = new Float32Array(n), RO = new Float32Array(n)
  const cloud = fbm(S, 11, 3, 5), mid = fbm(S, 12, 10, 4), fine = fbm(S, 13, 64, 2), q = rng(14), half = S / 2
  const tone = [0, 1, 2, 3].map(() => 0.96 + q() * 0.08)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, slab = (y >= half ? 2 : 0) + (x >= half ? 1 : 0), lx = x % half, ly = y % half
    let k = tone[slab] * (0.9 + 0.16 * cloud[i] + 0.06 * (mid[i] - 0.5))
    const fossil = fine[i] > 0.74 ? (fine[i] - 0.74) * 2.4 : 0
    k *= 1 - fossil * 0.22
    let h = 0.55 + 0.25 * (mid[i] - 0.5) + 0.2 * (fine[i] - 0.5) - fossil * 0.4, ro = 0.55 + 0.3 * mid[i]
    const edge = Math.min(lx, ly, half - 1 - lx, half - 1 - ly)
    if (edge < 0.8) { k *= 0.84; h = 0.2; ro = 0.95 }
    R[i] = 224 * k; G[i] = 207 * k; B[i] = 176 * k; H[i] = h; RO[i] = ro
  }
  return pack(S, { r: R, g: G, b: B, h: H, rough: RO, strength: 2.2 })
}

// ---- travertine: banded, with elongated pits (filled) -------------------------------------------------
function travertine(S) {
  const n = S * S, [R, G, B] = planes(n), H = new Float32Array(n), RO = new Float32Array(n)
  const warp = fbm(S, 21, 3, 5), pit = fbm(S, 22, 3, 2, 0.5, 44), w = fbm(S, 23, 6, 4), fine = fbm(S, 24, 90, 2)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x
    const band = Math.sin((y / S) * Math.PI * 2 * 7 + warp[i] * 8) * 0.5 + 0.5
    const t = clamp01(band * 0.5 + Math.pow(w[i], 2) * 0.55)
    const p = sstep(0.7, 0.78, pit[i]) // elongated pits along the grain
    const f = 0.97 + 0.06 * fine[i]
    R[i] = (232 - 38 * t) * f * (1 - p * 0.1); G[i] = (212 - 48 * t) * f * (1 - p * 0.12); B[i] = (182 - 58 * t) * f * (1 - p * 0.14)
    H[i] = 0.6 + 0.12 * band - p * 0.5 + 0.05 * fine[i]; RO[i] = 0.42 + 0.25 * p + 0.15 * w[i]
  }
  return pack(S, { r: R, g: G, b: B, h: H, rough: RO, strength: 2.6 })
}

// ---- polished stone floor: 2x2 large-format tiles, per-tile tone & vein pattern, bevelled grout --------------------------
function floor(S) {
  const n = S * S, [R, G, B] = planes(n), H = new Float32Array(n), RO = new Float32Array(n)
  const cloud = fbm(S, 31, 3, 5), warp = fbm(S, 32, 4, 5), mid = fbm(S, 33, 12, 3), fine = fbm(S, 34, 80, 2), q = rng(35), half = S / 2
  const tile = [0, 1, 2, 3].map(() => ({ k: 0.95 + q() * 0.1, ox: (q() * S) | 0, oy: (q() * S) | 0, ph: q() * 6 }))
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, tl = tile[(y >= half ? 2 : 0) + (x >= half ? 1 : 0)], lx = x % half, ly = y % half
    const j = ((y + tl.oy) % S) * S + ((x + tl.ox) % S), wv = warp[j]
    const v1 = 1 - Math.abs(Math.sin(((x + y) / S) * Math.PI * 2 * 2 + wv * 9 + tl.ph)), v2 = 1 - Math.abs(Math.sin(((x - y) / S) * Math.PI * 2 * 1 + wv * 6 + tl.ph * 2))
    const vein = Math.pow(v1, 30) * 0.5 + Math.pow(v2, 55) * 0.32
    let k = tl.k * (0.93 + 0.1 * cloud[j] + 0.05 * (mid[j] - 0.5)) * (1 - vein * 0.22)
    let r = 190 * k, g = 172 * k, b = 144 * k
    let h = 0.6 + 0.03 * (fine[j] - 0.5), ro = 0.33 + 0.22 * mid[j] + 0.1 * vein
    const edge = Math.min(lx, ly, half - 1 - lx, half - 1 - ly)
    if (edge < 2) { r *= 0.42; g *= 0.4; b *= 0.38; h = 0.05; ro = 0.92 } // grout
    else if (edge < 3.2) { r *= 1.05; g *= 1.05; b *= 1.04; h = 0.35 + 0.1 * (edge - 2) } // chamfer
    R[i] = r; G[i] = g; B[i] = b; H[i] = h; RO[i] = ro
  }
  return pack(S, { r: R, g: G, b: B, h: H, rough: RO, strength: 2.4 })
}

// ---- nero-marquina style black marble with fine white veins -----------------------------------------------------
function darkMarble(S) {
  const n = S * S, [R, G, B] = planes(n), H = new Float32Array(n).fill(0.5), RO = new Float32Array(n)
  const a = fbm(S, 41, 3, 6), b = fbm(S, 42, 5, 5), c = fbm(S, 43, 24, 3)
  for (let i = 0; i < n; i++) {
    const ridge = 1 - Math.abs(2 * a[i] - 1), vein = Math.pow(ridge, 16) * 0.95 + Math.pow(1 - Math.abs(2 * b[i] - 1), 26) * 0.4
    const base = 20 + 9 * b[i] + 5 * c[i]
    R[i] = base + 218 * vein; G[i] = base - 1 + 202 * vein; B[i] = base - 3 + 168 * vein
    RO[i] = 0.08 + 0.1 * c[i] + 0.12 * vein
  }
  return pack(S, { r: R, g: G, b: B, h: H, rough: RO, strength: 0.5 })
}

// ---- walnut timber: planks, growth rings, open pores, medullary flecks ------------------------------------------------
function walnut(S) {
  const n = S * S, [R, G, B] = planes(n), H = new Float32Array(n), RO = new Float32Array(n)
  const ring = fbm(S, 51, 10, 4, 0.5, 2), streak = fbm(S, 52, 96, 3, 0.55, 3), pore = fbm(S, 53, 120, 2, 0.5, 4), q = rng(54), planks = 4, pw = S / planks
  const pk = Array.from({ length: planks }, () => ({ k: 0.88 + q() * 0.24, sh: (q() * S) | 0 }))
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, p = pk[(x / pw) | 0], lx = x % pw, j = ((y + p.sh) % S) * S + x
    const rg = Math.sin(((x / S) * 6 + ring[j] * 5.5) * Math.PI * 2) * 0.5 + 0.5
    const gr = 0.55 * rg + 0.3 * streak[j] + 0.15 * ring[j]
    const por = sstep(0.68, 0.74, pore[j]) // pores = tiny dark dashes along the grain
    let k = p.k * (0.76 + 0.3 * gr) * (1 - por * 0.25)
    let r = 118 * k, g = 74 * k, b = 42 * k, h = 0.55 + 0.14 * rg - por * 0.4, ro = 0.5 + 0.25 * por + 0.1 * streak[j]
    if (lx < 1.4 || lx > pw - 1.4) { r *= 0.35; g *= 0.35; b *= 0.35; h = 0.1; ro = 0.8 } // plank seam
    R[i] = r; G[i] = g; B[i] = b; H[i] = h; RO[i] = ro
  }
  return pack(S, { r: R, g: G, b: B, h: H, rough: RO, strength: 2.4 })
}

// ---- upholstery: woven bouclé / linen (near-neutral so the material colour tints it) ---------------------------------------
function fabric(S) {
  const n = S * S, [R, G, B] = planes(n), H = new Float32Array(n), RO = new Float32Array(n)
  const nz = fbm(S, 61, 16, 3), slub = fbm(S, 62, 4, 4, 0.5, 64), period = S / 64
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, u = (x / period) * Math.PI * 2, v = (y / period) * Math.PI * 2
    const weave = 0.5 + 0.25 * Math.sin(u) * Math.sin(v) + 0.12 * Math.sin(u * 2 + v) + 0.18 * (nz[i] - 0.5)
    const k = 0.82 + 0.3 * weave + 0.12 * (slub[i] - 0.5)
    R[i] = G[i] = B[i] = 240 * k; H[i] = weave; RO[i] = 0.82 + 0.15 * nz[i]
  }
  return pack(S, { r: R, g: G, b: B, h: H, rough: RO, strength: 2.2 })
}

// ---- leather: pebbled grain with creases ----------------------------------------------------------------------------------------
function leather(S) {
  const n = S * S, [R, G, B] = planes(n), H = new Float32Array(n), RO = new Float32Array(n)
  const a = fbm(S, 71, 48, 2), b = fbm(S, 72, 22, 2), wear = fbm(S, 73, 4, 4)
  for (let i = 0; i < n; i++) {
    const cell = 1 - Math.abs(2 * a[i] - 1), crease = Math.pow(1 - Math.abs(2 * b[i] - 1), 8)
    const h = 0.55 * Math.pow(cell, 0.6) + 0.35 * (1 - crease)
    const k = 0.78 + 0.28 * h + 0.14 * (wear[i] - 0.5)
    R[i] = G[i] = B[i] = 235 * k; H[i] = h; RO[i] = 0.4 + 0.3 * crease + 0.2 * wear[i]
  }
  return pack(S, { r: R, g: G, b: B, h: H, rough: RO, strength: 3.2 })
}

// ---- tree bark ----------------------------------------------------------------------------------------------------------------------
function bark(S) {
  const n = S * S, [R, G, B] = planes(n), H = new Float32Array(n), RO = new Float32Array(n).fill(0.9)
  const a = fbm(S, 81, 10, 4, 0.55, 2), b = fbm(S, 82, 40, 3, 0.5, 6)
  for (let i = 0; i < n; i++) {
    const ridge = 1 - Math.abs(2 * a[i] - 1), h = 0.6 * Math.pow(ridge, 1.5) + 0.4 * b[i], k = 0.5 + 0.7 * h
    R[i] = 96 * k; G[i] = 76 * k; B[i] = 58 * k; H[i] = h
  }
  return pack(S, { r: R, g: G, b: B, h: H, rough: RO, strength: 3.6 })
}

// ---- leaf: midrib + side veins, lighter centre, darker margin (grey-green so instance colours tint it) -----------------------
function leaf() {
  const W = 128, Hh = 256, c = document.createElement('canvas'); c.width = W; c.height = Hh
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, '#9aa68a'); grad.addColorStop(0.5, '#eef3e2'); grad.addColorStop(1, '#9aa68a')
  g.fillStyle = grad; g.fillRect(0, 0, W, Hh)
  const vg = g.createLinearGradient(0, Hh, 0, 0); vg.addColorStop(0, 'rgba(255,255,255,.22)'); vg.addColorStop(1, 'rgba(60,70,40,.28)')
  g.fillStyle = vg; g.fillRect(0, 0, W, Hh)
  g.strokeStyle = 'rgba(255,255,240,.9)'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(W / 2, Hh); g.lineTo(W / 2, 4); g.stroke()
  g.lineWidth = 1.3; g.strokeStyle = 'rgba(250,255,230,.55)'
  for (let y = Hh - 14; y > 22; y -= 14) {
    const reach = 54 * Math.sin(Math.PI * (1 - y / Hh) * 0.9 + 0.35)
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(W / 2, y); g.quadraticCurveTo(W / 2 + s * reach * 0.5, y - 10, W / 2 + s * reach, y - 30); g.stroke() }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

// ---- woven wool rug with border -------------------------------------------------------------------------------------------------------
export function rugTexture(palette = ['#d8c9ae', '#6f5a3e', '#a8896a'], seed = 3, round = false) {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S
  const g = c.getContext('2d'), q = rng(seed)
  g.fillStyle = palette[0]; g.fillRect(0, 0, S, S)
  if (round) {
    const ring = (r, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(S / 2, S / 2, r, 0, Math.PI * 2); g.stroke() }
    ring(S / 2 - 20, 16, palette[1]); ring(S / 2 - 52, 3, palette[2]); ring(S / 2 - 120, 6, palette[1]); ring(S / 2 - 150, 2, palette[2])
  } else {
    g.strokeStyle = palette[1]; g.lineWidth = 14; g.strokeRect(22, 22, S - 44, S - 44)
    g.lineWidth = 3; g.strokeStyle = palette[2]; g.strokeRect(46, 46, S - 92, S - 92)
  }
  g.fillStyle = palette[2]
  if (!round) for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) if ((i + j) % 2 === 0) { const x = 70 + i * ((S - 140) / 14), y = 70 + j * ((S - 140) / 14); g.globalAlpha = 0.18 + q() * 0.12; g.fillRect(x, y, (S - 140) / 14, (S - 140) / 14) }
  g.globalAlpha = 1
  const img = g.getImageData(0, 0, S, S), d = img.data // fibre noise
  for (let i = 0; i < S * S; i++) { const n = (q() - 0.5) * 46; d[i * 4] += n; d[i * 4 + 1] += n; d[i * 4 + 2] += n }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
}

let cache
export function textures() {
  if (cache) return cache
  const S = QUALITY.texture, s = Math.min(S, 512)
  const mk = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t }
  const set = ({ color, normal, rough }) => ({ map: mk(color, true), normal: mk(normal, false), rough: mk(rough, false) })
  cache = {
    limestone: set(limestone(S)), travertine: set(travertine(s)), floor: set(floor(S)), darkMarble: set(darkMarble(s)),
    walnut: set(walnut(s)), fabric: set(fabric(s)), leather: set(leather(s)), bark: set(bark(Math.min(S, 256))), leaf: leaf(),
  }
  return cache
}
