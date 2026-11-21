import { useCallback, useEffect, useRef, useState } from 'react'
import './CoffeeIntro.css'

const BASE = import.meta.env.BASE_URL
const VIDEO_SRC = `${BASE}intro/noir-intro.mp4`
const POSTER_SRC = `${BASE}intro/noir-poster.jpg`

// Cinematic title cards, timed (seconds) to the food shots in the video.
// pos: where the text sits on screen. big: the main line, small: eyebrow + sub line.
const CUES = [
  { at: 0.4,  to: 3.0,  pos: 'left',   eyebrow: 'NOIR CAFÉ PRESENTS',  lines: ['Morning,', 'reimagined.'],           sub: 'A cinematic coffee experience' },
  { at: 3.2,  to: 5.7,  pos: 'right',   eyebrow: 'CHAPTER I · THE TABLE', lines: ['Golden.', 'Buttery. Alive.'],     sub: 'Baked slow. Served warm.' },
  { at: 5.9,  to: 8.7,  pos: 'center',  eyebrow: 'CHAPTER II · THE RITUAL', lines: ['Every pour,', 'a ritual.'],    sub: 'Single-origin. Steam rising.' },
  { at: 8.9,  to: 11.6, pos: 'left',    eyebrow: 'CHAPTER III · THE FRESH', lines: ['Bright.', 'Unapologetic.'],      sub: 'Sun-ripened, plated with care.' },
  { at: 11.8, to: 13.7, pos: 'center',  eyebrow: 'CHAPTER IV · THE RUSH', lines: ['Taste', 'in motion.'],            sub: '' },
  { at: 13.9, to: 99,   pos: 'center',  eyebrow: 'NOIR CAFÉ',            lines: ['Beyond Coffee.', 'Into Experience.'], sub: 'Step inside', final: true },
]

export default function CoffeeIntro({ onComplete }) {
  const videoRef = useRef(null)
  const completed = useRef(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [started, setStarted] = useState(false)
  const [muted, setMuted] = useState(true)
  const [needsTap, setNeedsTap] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const finish = useCallback(() => {
    if (completed.current) return
    completed.current = true
    setLeaving(true)
    window.setTimeout(() => onComplete?.(), 900)
  }, [onComplete])

  // Autoplay: try with sound first (allowed if the visitor already interacted), fall back to muted.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    let cancelled = false
    ;(async () => {
      try {
        v.muted = false
        await v.play()
        if (!cancelled) setMuted(false)
      } catch {
        try {
          v.muted = true
          await v.play()
          if (!cancelled) setMuted(true)
        } catch {
          if (!cancelled) setNeedsTap(true)
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Smooth time tracking for the text cues + progress line.
  useEffect(() => {
    let raf
    const tick = () => {
      const v = videoRef.current
      if (v) setTime(v.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const toggleSound = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const tapToPlay = async () => {
    const v = videoRef.current
    if (!v) return
    try { await v.play(); setNeedsTap(false) } catch { /* ignore */ }
  }

  const skip = () => finish()

  const cueIndex = CUES.reduce((acc, c, i) => (time >= c.at && time < c.to ? i : acc), -1)
  const cue = cueIndex >= 0 ? CUES[cueIndex] : null
  const pct = duration ? Math.min(1, time / duration) : 0

  return (
    <section className={`coffee-intro ${leaving ? 'leaving' : ''}`} aria-label="NOIR Cafe cinematic introduction">
      <video
        ref={videoRef}
        className={`coffee-intro-video ${started ? 'on' : ''}`}
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        playsInline
        muted
        preload="auto"
        disablePictureInPicture
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlaying={() => { setStarted(true); setNeedsTap(false) }}
        onEnded={finish}
        onError={finish /* never trap the visitor on a broken video */}
      />

      <div className="coffee-intro-shade" />
      <div className="coffee-intro-grain" />
      <div className="coffee-bar top" />
      <div className="coffee-bar bottom" />

      <div className="coffee-intro-brand">
        <span>NOIR</span><i /><span>CAFÉ</span>
      </div>

      {cue && (
        <div
          key={cueIndex}
          className={`cue cue-${cue.pos} ${cue.final ? 'cue-final' : ''}`}
          style={{ '--dur': `${Math.min(cue.to - cue.at, 2.4)}s` }}
        >
          <span className="cue-eyebrow">{cue.eyebrow}</span>
          <h1 className="cue-title">
            {cue.lines.map((line, li) => (
              <span className="cue-line" key={li}>
                <span style={{ animationDelay: `${0.25 + li * 0.22}s` }}>{line}</span>
              </span>
            ))}
          </h1>
          <i className="cue-rule" />
          {cue.sub && <p className="cue-sub">{cue.sub}</p>}
        </div>
      )}

      <div className="coffee-intro-bottom">
        <span>{started ? 'NOW PLAYING' : 'PREPARING YOUR EXPERIENCE...'}</span>
        <div className="coffee-progress"><i style={{ transform: `scaleX(${pct})` }} /></div>
        <span>{Math.round(pct * 100)}%</span>
      </div>

      <div className="coffee-actions">
        <button className="coffee-btn" onClick={toggleSound} type="button" aria-label={muted ? 'Turn sound on' : 'Mute'}>
          {muted ? 'SOUND OFF' : 'SOUND ON'} <span>{muted ? '♪̸' : '♪'}</span>
        </button>
        <button className="coffee-btn" onClick={skip} type="button">
          SKIP INTRO <span>↗</span>
        </button>
      </div>

      {needsTap && (
        <button className="coffee-tap" onClick={tapToPlay} type="button">
          <b>▶</b> TAP TO BEGIN
        </button>
      )}
    </section>
  )
}
