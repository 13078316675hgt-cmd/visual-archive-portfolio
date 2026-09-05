import { useEffect, useRef, useState } from 'react'
import SeascapeEntryCanvas from './SeascapeEntryCanvas.jsx'
import ContinuumCanvas from './ContinuumCanvas.jsx'

const scene = {
  title: 'FORM IN MOTION',
  subtitle: '形随想生',
  category: 'CHARACTER / CONCEPT ART',
  detail: '从轮廓到性格，从构想到画面。关于角色与想象的创作记录。',
  type: 'SELECTED WORKS / HUANG GUOTAI',
}

function MemoryStructure({ active }) {
  const canvasRef = useRef(null)
  const activeRef = useRef(active)
  const elapsedRef = useRef(0)
  const runtimeRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return undefined
    let width = 1
    let height = 1
    let frame = 0
    let previous = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const vertices = new Float64Array(16)
    const inner = new Float64Array(16)
    const faceLight = Array.from({ length: 8 }, (_, index) => 140 + 63 * Math.sin(index * .78 + .5))
    const shades = Array.from({ length: 256 }, (_, shade) => [
      `rgb(${shade},${shade + 1},${shade + 2})`,
      `rgb(${Math.max(20, Math.round(shade * .12))},${Math.max(55, Math.round(shade * .31))},${Math.max(96, shade)})`,
    ])
    const closePath = (points) => {
      context.beginPath()
      context.moveTo(points[0], points[1])
      for (let index = 2; index < 16; index += 2) context.lineTo(points[index], points[index + 1])
      context.closePath()
    }
    const draw = () => {
      const time = elapsedRef.current
      context.clearRect(0, 0, width, height)
      const mobile = width < 700
      for (let index = 91; index >= 0; index -= 1) {
          const progress = index / 91
          // Bounded travel keeps the sweeping silhouette; local waves carry motion along the ribs.
          const wave = progress * Math.PI * 2.15 + Math.sin(time * .48) * .28
          const ripple = Math.sin(progress * Math.PI * 2 - time * .85)
          const x = width * (-.17 + progress * 1.38)
          const y = height * (.57 + Math.sin(wave + .4) * (mobile ? .08 : .13) + ripple * .015)
          const radius = Math.min(width * .125, height * .25) * (.79 + .24 * Math.cos(wave)) * (1 + ripple * .065)
          // Rotation stays within ±19 degrees of the chosen pose, never accumulates a full turn.
          const twist = progress * 3.4 + .12 + Math.sin(time * .62) * .24 + ripple * .09
          let centerX = 0
          let centerY = 0
          for (let side = 0; side < 8; side += 1) {
            const angle = side / 8 * Math.PI * 2 + twist
            const offset = side * 2
            vertices[offset] = x + Math.cos(angle) * radius * .48
            vertices[offset + 1] = y + Math.sin(angle) * radius
            centerX += vertices[offset] / 8
            centerY += vertices[offset + 1] / 8
          }
          const highlighted = index > 34 && index < 55
          const depth = Math.cos(wave)
          for (let point = 0; point < 16; point += 2) {
            inner[point] = centerX + (vertices[point] - centerX) * .7
            inner[point + 1] = centerY + (vertices[point + 1] - centerY) * .7
          }
          for (let side = 0; side < 8; side += 1) {
            const shade = Math.max(0, Math.min(255, Math.round(faceLight[side] + depth * 12)))
            const offset = side * 2
            const next = (offset + 2) % 16
            context.beginPath()
            context.moveTo(vertices[offset], vertices[offset + 1])
            context.lineTo(vertices[next], vertices[next + 1])
            context.lineTo(inner[next], inner[next + 1])
            context.lineTo(inner[offset], inner[offset + 1])
            context.closePath()
            context.fillStyle = shades[shade][highlighted ? 1 : 0]
            context.fill()
          }
          closePath(vertices)
          context.strokeStyle = highlighted ? 'rgba(126,184,255,.64)' : 'rgba(255,255,255,.84)'
          context.lineWidth = 1.3
          context.stroke()
          closePath(inner)
          context.strokeStyle = highlighted ? 'rgba(4,34,105,.78)' : 'rgba(66,76,91,.27)'
          context.lineWidth = .65
          context.stroke()
      }
      if (canvas.dataset.ready !== 'true') canvas.dataset.ready = 'true'
    }
    const canAnimate = () => activeRef.current && !document.hidden && !reducedMotion.matches
    const tick = (now) => {
      frame = 0
      if (!canAnimate()) { previous = null; return }
      if (previous !== null) elapsedRef.current += Math.min((now - previous) / 1000, .05)
      previous = now
      draw()
      frame = window.requestAnimationFrame(tick)
    }
    const sync = () => {
      window.cancelAnimationFrame(frame)
      frame = 0
      previous = null
      if (canAnimate()) frame = window.requestAnimationFrame(tick)
    }
    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      const nextWidth = Math.round(width * pixelRatio)
      const nextHeight = Math.round(height * pixelRatio)
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) { canvas.width = nextWidth; canvas.height = nextHeight }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      draw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    runtimeRef.current = { sync }
    document.addEventListener('visibilitychange', sync)
    reducedMotion.addEventListener('change', sync)
    resize()
    sync()
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reducedMotion.removeEventListener('change', sync)
      if (runtimeRef.current?.sync === sync) runtimeRef.current = null
    }
  }, [])

  useEffect(() => { activeRef.current = active; runtimeRef.current?.sync() }, [active])
  return <canvas ref={canvasRef} className="marlsa-memory-structure" aria-hidden="true" />
}

const BUBBLE_GEOMETRY = Array.from({ length: 18 }, (_, index) => ({ '--bx': `${7 + ((index * 43) % 88)}%`, '--by': `${-14 + ((index * 19) % 24)}%`, '--bs': `${7 + ((index * 13) % 23)}px` }))
export default function MarlsaArchiveHome() {
  const [structureActive, setStructureActive] = useState(false)

  useEffect(() => {
    const stop = () => setStructureActive(false)
    const start = () => setStructureActive(true)
    window.addEventListener('portfolio:home-opening-start', stop)
    window.addEventListener('portfolio:home-opening-complete', start)
    window.addEventListener('portfolio:home-reveal', start)
    const frame = window.requestAnimationFrame(() => {
      const root = document.querySelector('#title.marlsa-archive-home')
      if (root?.dataset.d1101Opening === 'complete' || root?.dataset.d1101Opening === 'static') start()
    })
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('portfolio:home-opening-start', stop)
      window.removeEventListener('portfolio:home-opening-complete', start)
      window.removeEventListener('portfolio:home-reveal', start)
    }
  }, [])

  return <section id="title" className="d1101-homepage-locked marlsa-archive-home" data-home-visual="marlsa-memory-archive" aria-labelledby="marlsa-home-title" tabIndex={-1}>
    <div className="marlsa-memory-stage marlsa-home-reveal">
      <ContinuumCanvas active={structureActive} fallback={<MemoryStructure active={structureActive} />} />
      <svg className="marlsa-memory-registration" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
        <path className="marlsa-memory-diagonal" d="M-90 825 1330 170M160 920 1520 350" />
        <path d="M410 487 566 374M902 525 1060 653M310 640 140 711" />
        <g className="marlsa-memory-targets"><rect x="395" y="472" width="30" height="30" /><rect x="871" y="494" width="62" height="62" /><rect x="290" y="620" width="40" height="40" /></g>
        <path className="marlsa-memory-crosses" d="M561 370h10m-5-5v10M1055 653h10m-5-5v10M135 711h10m-5-5v10" />
      </svg>
    </div>

    <div className="marlsa-memory-topline marlsa-home-reveal">
      <a href="#title">A STUDY OF IMAGINATION</a>
      <nav aria-label="作品集章节导航"><a href="#contents">INDEX</a><a href="#character-sheets">CHARACTER</a><a href="#selected-works">WORKS</a><a href="#about-the-creator">ABOUT</a></nav>
    </div>

    <header className="marlsa-memory-heading marlsa-home-reveal">
      <p><span className="marlsa-memory-square" /> PERSONAL VISUAL ARCHIVE</p>
      <div className="marlsa-memory-heading-line"><h1 id="marlsa-home-title">MARLSA</h1><span className="marlsa-memory-edition">PORTFOLIO<br />EDITION — 2026</span></div>
      <div className="marlsa-memory-sequence-label">{scene.category}</div>
    </header>

    <div className="marlsa-memory-coordinate marlsa-home-reveal" aria-hidden="true">M / A<br /><i />SHAPES BECOME<br />CHARACTERS</div>

    <section className="marlsa-memory-caption marlsa-home-reveal" aria-label="创作理念">
      <span className="marlsa-memory-file">{scene.type}</span>
      <h2>{scene.title}<span>✦</span></h2>
      <p><b>{scene.subtitle}</b>{scene.detail}</p>
    </section>

    <div className="marlsa-memory-bottom-mark marlsa-home-reveal"><span>HUANG GUOTAI / 黄国泰</span><span>CHARACTER & CONCEPT DESIGN</span></div>
    <a className="marlsa-seascape-credit marlsa-home-reveal" href="https://github.com/tdmaav/shadertoy/blob/master/Seascape.shader" target="_blank" rel="noreferrer">SEASCAPE / TDM / CC BY-NC-SA 3.0</a>

    <div className="marlsa-entry" aria-hidden="true">
      <div className="marlsa-entry-blank" />
      <div className="marlsa-entry-prelude">
        <div className="marlsa-entry-orbit">
          <div className="marlsa-entry-orbit-scan" />
          <div className="marlsa-entry-orbit-ticks" />
          <i /><i /><i /><span />
          <small>DEPTH / 000.0</small><small>FORM TRACE / ACTIVE</small>
        </div>
        <svg className="marlsa-entry-current" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path className="marlsa-entry-current-broad" d="M712 970C649 793 512 746 352 656S121 480 50 292" />
          <path className="marlsa-entry-current-broad" d="M728 970C791 793 928 746 1088 656S1319 480 1390 292" />
          <path className="marlsa-entry-current-broad marlsa-entry-current-cross" d="M-84 690C244 595 452 706 720 638S1174 531 1524 618" />
          <path d="M720 968C670 780 522 705 238 610S-20 430-80 310" />
          <path d="M720 968C694 757 588 640 382 514S126 284 82 142" />
          <path d="M720 968C708 744 660 594 566 424S420 180 408-64" />
          <path d="M720 968C732 744 780 594 874 424S1020 180 1032-64" />
          <path d="M720 968C746 757 852 640 1058 514S1314 284 1358 142" />
          <path d="M720 968C770 780 918 705 1202 610S1460 430 1520 310" />
          <g className="marlsa-entry-current-nodes">
            <circle cx="222" cy="598" r="4" /><circle cx="387" cy="523" r="7" /><circle cx="568" cy="424" r="3" />
            <circle cx="720" cy="638" r="5" /><circle cx="872" cy="424" r="3" /><circle cx="1053" cy="523" r="7" /><circle cx="1218" cy="598" r="4" />
          </g>
        </svg>
        <div className="marlsa-entry-prelude-meta"><span>MARLSA / 0092</span><em>OCEAN ENTRY CALIBRATION</em></div>
        <div className="marlsa-entry-prelude-title"><b>DESCENT</b><b>INTO FORM</b></div>
        <i />
        <div className="marlsa-entry-prelude-horizon"><span /><small>SURFACE / 00.0 — DEPTH FIELD ACTIVE</small></div>
      </div>
      <div className="marlsa-entry-splash" />
      <div className="marlsa-entry-ocean"><SeascapeEntryCanvas /></div>
      <div className="marlsa-entry-bridge">
        <svg viewBox="0 0 1000 520" preserveAspectRatio="none"><path d="M-80 286C96 190 170 334 300 265S504 157 627 261 843 323 1080 197" /><path d="M-80 319C105 219 192 359 315 291S510 186 640 285 866 347 1080 226" /><g><rect x="170" y="270" width="20" height="20" /><rect x="300" y="255" width="20" height="20" /><rect x="617" y="251" width="20" height="20" /><rect x="835" y="300" width="20" height="20" /></g></svg>
        <span>MEMORY STRUCTURE ACQUIRED / TRANSFERRING</span>
      </div>
      <div className="marlsa-entry-bubbles">{BUBBLE_GEOMETRY.map((style, index) => <i key={index} style={style} />)}</div>
      <div className="marlsa-entry-flash" />
    </div>
  </section>
}
