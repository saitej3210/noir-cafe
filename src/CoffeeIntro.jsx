import { useCallback, useEffect, useRef, useState } from 'react'
import './CoffeeIntro.css'

const TOTAL_FRAMES = 300
const FRAME_PATH = `${import.meta.env.BASE_URL}noir-frames/`

export default function CoffeeIntro({ onComplete }) {
  const canvasRef = useRef(null)
  const cache = useRef(new Map())
  const progressRef = useRef(0)
  const touchY = useRef(null)
  const completed = useRef(false)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const drawFrame = useCallback((frameNumber) => {
    const canvas = canvasRef.current
    const img = cache.current.get(frameNumber)
    if (!canvas || !img?.complete || !img.naturalWidth) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.round(rect.width * dpr)
    const height = Math.round(rect.height * dpr)

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
    const drawWidth = img.naturalWidth * scale
    const drawHeight = img.naturalHeight * scale

    ctx.fillStyle = '#050403'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(
      img,
      (width - drawWidth) / 2,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight
    )
  }, [])

  const loadFrame = useCallback((number) => {
    const n = Math.max(1, Math.min(TOTAL_FRAMES, number))
    if (cache.current.has(n)) return cache.current.get(n)

    const img = new Image()
    cache.current.set(n, img)
    img.onload = () => {
      if (n === Math.round(progressRef.current * (TOTAL_FRAMES - 1)) + 1) {
        drawFrame(n)
      }
      if (n === 1) setLoaded(true)
    }
    img.src = `${FRAME_PATH}frame_${String(n).padStart(4, '0')}.webp`
    return img
  }, [drawFrame])

  const renderProgress = useCallback((value) => {
    const next = Math.max(0, Math.min(1, value))
    progressRef.current = next
    setProgress(next)

    const frame = Math.round(next * (TOTAL_FRAMES - 1)) + 1

    // Keep a small rolling image cache to avoid decoding all 300 images at once.
    for (let n = Math.max(1, frame - 3); n <= Math.min(TOTAL_FRAMES, frame + 8); n++) {
      loadFrame(n)
    }

    const img = loadFrame(frame)
    if (img.complete && img.naturalWidth) drawFrame(frame)

    for (const [n] of cache.current) {
      if (Math.abs(n - frame) > 18) cache.current.delete(n)
    }

    if (next >= 1 && !completed.current) {
      completed.current = true
      window.setTimeout(() => onComplete?.(), 500)
    }
  }, [drawFrame, loadFrame, onComplete])

  useEffect(() => {
    loadFrame(1)
    for (let n = 2; n <= 12; n++) loadFrame(n)

    const resize = () => {
      const frame = Math.round(progressRef.current * (TOTAL_FRAMES - 1)) + 1
      drawFrame(frame)
    }
    window.addEventListener('resize', resize)

    const advance = (delta) => {
      if (completed.current) return
      renderProgress(progressRef.current + delta / 2600)
    }

    const wheel = (event) => {
      event.preventDefault()
      advance(event.deltaY)
    }

    const touchStart = (event) => {
      touchY.current = event.touches[0]?.clientY ?? null
    }

    const touchMove = (event) => {
      if (touchY.current === null) return
      event.preventDefault()
      const currentY = event.touches[0]?.clientY ?? touchY.current
      advance(touchY.current - currentY)
      touchY.current = currentY
    }

    const touchEnd = () => { touchY.current = null }

    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchmove', touchMove, { passive: false })
    window.addEventListener('touchend', touchEnd)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('touchend', touchEnd)
      cache.current.clear()
    }
  }, [drawFrame, loadFrame, renderProgress])

  const skip = () => {
    if (completed.current) return
    completed.current = true
    onComplete?.()
  }

  return (
    <section className="coffee-intro" aria-label="NOIR Cafe cinematic introduction">
      <canvas ref={canvasRef} className="coffee-intro-canvas" />
      <div className="coffee-intro-shade" />

      <div className="coffee-intro-brand">
        <span>NOIR</span>
        <i />
        <span>CAFÉ</span>
      </div>

      <div className="coffee-intro-copy">
        <span className="coffee-eyebrow">A CINEMATIC COFFEE EXPERIENCE</span>
        <h1>Beyond Coffee.</h1>
        <p>Into Experience.</p>
      </div>

      <div className="coffee-intro-bottom">
        <span>{loaded ? 'SCROLL TO EXPERIENCE' : 'PREPARING YOUR EXPERIENCE...'}</span>
        <div className="coffee-progress">
          <i style={{ transform: `scaleX(${progress})` }} />
        </div>
        <span>{Math.round(progress * 100)}%</span>
      </div>

      <button className="coffee-skip" onClick={skip} type="button">
        SKIP INTRO <span>↗</span>
      </button>
    </section>
  )
}
