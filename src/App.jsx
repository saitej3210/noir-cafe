import { Suspense, useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Scene from './scene/Scene.jsx'
import { QUALITY } from './scene/quality.js'
import { scrollState } from './scene/CameraRig.jsx'
import Reserve from './Reserve.jsx'
import Owner from './Owner.jsx'
import { foodState } from './scene/stage.js'
import { mood } from './scene/mood.js'
import { ROOMS, FINALE, ROOM_U } from './scene/layout.js'
import { useMenuCatalog } from './menuCatalog.js'
import CoffeeIntro from './CoffeeIntro.jsx'

gsap.registerPlugin(ScrollTrigger)

const AREA_BY_ROOM = [undefined, 'Main Dining Hall', 'Private Dining Room', 'Coffee Lounge', 'Garden Lounge']
const Split = ({ text }) => {
  let n = 0
  return text.split(' ').map((w, wi) => (
    <span key={wi} className="w">{[...w].map((c) => <span key={n} className="ch" style={{ '--i': n++ }}>{c}</span>)}{' '}</span>
  ))
}

function MenuCard({ id, side, m, onReserve }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div id={id} className={`menu ${side}`}>
      <div className={`card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
        <div className="face front">
          <small>{m.kicker}</small><h3>{m.title}</h3>
          <ul>{m.items.map(([n, d, p], idx) => <li key={n} onMouseEnter={() => { foodState.hover = idx }} onMouseLeave={() => { foodState.hover = -1 }}><b>{n}<em>{p}</em></b><span>{d}</span></li>)}</ul>
          <button className="mreserve" onClick={(e) => { e.stopPropagation(); onReserve() }}>Reserve here</button>
          <div className="tap">tap card to flip</div>
        </div>
        <div className="face back"><div><div className="mono">N</div><p>{m.note}</p></div></div>
      </div>
    </div>
  )
}

// Synthesised café ambience (soft murmur + warm pad) — no audio files needed.
function createAmbience() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)
  const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = buf.getChannelData(0); let l = 0
  for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5 }
  const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520
  const ng = ctx.createGain(); ng.gain.value = 0.5; n.connect(f); f.connect(ng); ng.connect(master); n.start()
  ;[110, 164.81, 220, 277.18].forEach((fr, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain()
    o.frequency.value = fr; g.gain.value = 0.035; lfo.frequency.value = 0.08 + i * 0.03; lg.gain.value = 0.02
    lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(master); o.start(); lfo.start()
  })
  return { ctx, master }
}

export default function App() {
  const menus = useMenuCatalog()
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(-1)
  const lenisRef = useRef(null)
  const audioRef = useRef(null)
  const tourOn = useRef(false)
  const [intro, setIntro] = useState('wait') // wait -> play -> done
  const [lite, setLite] = useState(false)
  const [owner, setOwner] = useState(false)
  const [sound, setSound] = useState(false)
  const [night, setNight] = useState(true)
  const [booking, setBooking] = useState(false)
  const [area, setArea] = useState()
  const openBooking = (a) => { setArea(a); setBooking(true) }
  useEffect(() => { if (booking || owner || intro !== 'done') lenisRef.current?.stop(); else lenisRef.current?.start() }, [booking, owner, intro])
  useEffect(() => { if (!ready) return; const t = setTimeout(() => setIntro((i) => (i === 'wait' ? 'play' : i)), 500); return () => clearTimeout(t) }, [ready])
  const enter = (withSound) => { if (intro === 'done') return; setIntro('done'); scrollState.introTarget = 0; if (withSound && !sound) toggleSound() }
  const toggleLite = () => { window.dispatchEvent(new Event('noir-lite')); setLite((l) => !l) }
  const toggleFs = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())
  const toggleMood = () => { mood.target = night ? 0 : 1; setNight(!night) }
  const [tour, setTour] = useState(false)
  const toggleSound = () => {
    if (!audioRef.current) audioRef.current = createAmbience()
    const { ctx, master } = audioRef.current, on = !sound
    ctx.resume(); master.gain.setTargetAtTime(on ? 0.6 : 0, ctx.currentTime, 0.8); setSound(on)
  }
  const toggleTour = () => {
    const l = lenisRef.current
    if (tourOn.current) { l.scrollTo(l.scroll, { immediate: true }); tourOn.current = false; setTour(false); return }
    tourOn.current = true; setTour(true)
    l.scrollTo(document.documentElement.scrollHeight - window.innerHeight, { duration: 170, easing: (t) => t, onComplete: () => { tourOn.current = false; setTour(false) } })
  }
  const { progress: loaded } = useProgress()
  const scrollToU = (u) => lenisRef.current?.scrollTo(u * (document.documentElement.scrollHeight - window.innerHeight), { duration: 5 })

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true, syncTouch: true, syncTouchLerp: 0.08, touchMultiplier: 1.35, wheelMultiplier: 1.1, gestureOrientation: 'vertical', infinite: false })
    lenisRef.current = lenis
    lenis.stop() // locked until the intro's Enter button is pressed
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    const st = ScrollTrigger.create({
      trigger: '.scroll-track', start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        scrollState.progress = self.progress
        document.documentElement.style.setProperty('--p', self.progress.toFixed(4))
        setActive(ROOM_U.reduce((acc, u, i) => (self.progress >= u - 0.005 ? i : acc), -1))
      },
    })
    const onKey = (e) => {
      const fwd = e.key === 'ArrowRight' || e.key === 'PageDown', back = e.key === 'ArrowLeft' || e.key === 'PageUp'
      if (!fwd && !back) return
      if (e.target.closest?.('input,select,textarea,.modal')) return
      e.preventDefault()
      const p = scrollState.progress
      scrollToU(fwd ? ROOM_U.find((u) => u > p + 0.01) ?? 1 : [...ROOM_U].reverse().find((u) => u < p - 0.01) ?? 0)
    }
    const stopTour = () => { if (tourOn.current) { lenis.scrollTo(lenis.scroll, { immediate: true }); tourOn.current = false; setTour(false) } }
    const evs = ['wheel', 'touchstart', 'keydown']
    evs.forEach((ev) => window.addEventListener(ev, stopTour, { passive: true }))
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); evs.forEach((ev) => window.removeEventListener(ev, stopTour)); st.kill(); gsap.ticker.remove(tick); lenis.destroy() }
  }, [])

  return (
    <>
      <div className="stage">
        <Canvas
          dpr={QUALITY.dpr}
          gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: QUALITY.post ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping, toneMappingExposure: 0.92 }}
          camera={{ fov: 52, near: 0.1, far: 300, position: [0, 3.2, 38] }}
          onCreated={() => setTimeout(() => setReady(true), 400)}
        >
          <Suspense fallback={null}><Scene /></Suspense>
        </Canvas>
      </div>
      <div className={`hero ${intro !== 'done' ? 'wait' : ''}`}><h1>NOIR CAFÉ</h1><p>Beyond Coffee. Into Experience.</p></div>
      {ROOMS.map((r, i) => (
        <div key={r.id} id={`room-text-${i}`} className={`room-text ${r.side}`}>
          <h2><Split text={r.title} /></h2><p>{r.text}</p>
        </div>
      ))}
      {ROOMS.map((r, i) => <MenuCard key={r.id} id={`room-menu-${i}`} side={r.side === 'left' ? 'right' : 'left'} m={menus[i]} onReserve={() => openBooking(AREA_BY_ROOM[i])} />)}
      <div id="room-text-finale" className="room-text center"><h2><Split text={FINALE.title} /></h2><p>{FINALE.text}</p><button className="cta" onClick={() => openBooking(AREA_BY_ROOM[active])}>Reserve a table</button></div>
      <Reserve open={booking} onClose={() => setBooking(false)} initialArea={area} />
      <Owner open={owner} onClose={() => setOwner(false)} />
      <div className="bar" />
      <div className={`controls ${intro !== 'done' ? 'wait' : ''}`}>
        <button onClick={() => openBooking(AREA_BY_ROOM[active])}>Reserve</button>
        <button onClick={toggleMood}>{night ? '☀ Day' : '☾ Night'}</button>
        <button className={tour ? 'on' : ''} onClick={toggleTour}>{tour ? '❚❚ Pause tour' : '▶ Auto tour'}</button>
        <button className={sound ? 'on' : ''} onClick={toggleSound}>{sound ? '♪ Sound on' : '♪ Sound'}</button>
      </div>
      <nav className="rail" aria-label="Rooms">
        {ROOMS.map((r, i) => (
          <button key={r.id} className={i === active ? 'on' : ''} onClick={() => scrollToU(ROOM_U[i])} aria-label={r.name}><span>{r.name}</span></button>
        ))}
      </nav>
      <div className={`hint ${intro !== 'done' ? 'wait' : ''}`}>Scroll to enter · or use ← →</div>
      <div id="caption" className="caption" />
      {QUALITY.debug && <pre id="debug" style={{ position: 'fixed', top: 8, left: 8, zIndex: 9, margin: 0, padding: 8, background: 'rgba(0,0,0,.7)', color: '#9f9', fontSize: 12 }} />}
      <div className={`loader ${ready ? 'done' : ''}`}>NOIR CAFÉ<i style={{ transform: `scaleX(${loaded / 100})` }} /></div>
      {intro !== 'done' && <CoffeeIntro onComplete={() => enter(false)} /> }
      <div className={`tools ${intro !== 'done' ? 'wait' : ''}`}>
        <button title="Lite mode (smoother on slow devices)" className={lite ? 'on' : ''} onClick={toggleLite}>Lite mode</button>
        <button title="Owner dashboard" onClick={() => setOwner(true)}>Owner login</button>
        <button title="Fullscreen" onClick={toggleFs}>Fullscreen</button>
        <button title="Hide / show interface" onClick={() => document.documentElement.classList.toggle('clean')}>Hide / Show UI</button>
      </div>
      <div className="scroll-track" />
    </>
  )
}


