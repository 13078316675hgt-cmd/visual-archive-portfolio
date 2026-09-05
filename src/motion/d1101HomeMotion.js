import { gsap } from 'gsap'
import { entryVisualState } from './entryVisualState.js'

export function initD1101HomeMotion(root, { reducedMotion = false } = {}) {
  if (!(root instanceof HTMLElement)) return () => {}

  const pdfMode = document.documentElement.classList.contains('portfolio-pdf-mode')
  const entry = root.querySelector('.marlsa-entry')
  const blank = root.querySelector('.marlsa-entry-blank')
  const prelude = root.querySelector('.marlsa-entry-prelude')
  const preludeOrbit = root.querySelector('.marlsa-entry-orbit')
  const preludeOrbitRings = [...root.querySelectorAll('.marlsa-entry-orbit i, .marlsa-entry-orbit > span')]
  const preludeOrbitScan = root.querySelector('.marlsa-entry-orbit-scan')
  const preludeOrbitTicks = root.querySelector('.marlsa-entry-orbit-ticks')
  const preludeCurrent = [...root.querySelectorAll('.marlsa-entry-current path')]
  const preludeCurrentNodes = [...root.querySelectorAll('.marlsa-entry-current-nodes circle')]
  const preludeMeta = root.querySelector('.marlsa-entry-prelude-meta')
  const preludeTitle = [...root.querySelectorAll('.marlsa-entry-prelude-title b')]
  const preludeLine = root.querySelector('.marlsa-entry-prelude i')
  const preludeHorizon = root.querySelector('.marlsa-entry-prelude-horizon')
  const preludeMarker = root.querySelector('.marlsa-entry-prelude-horizon > span')
  const splash = root.querySelector('.marlsa-entry-splash')
  const ocean = root.querySelector('.marlsa-entry-ocean')
  const bubbles = [...root.querySelectorAll('.marlsa-entry-bubbles i')]
  const bridge = root.querySelector('.marlsa-entry-bridge')
  const bridgeLines = [...root.querySelectorAll('.marlsa-entry-bridge path')]
  const bridgeRects = [...root.querySelectorAll('.marlsa-entry-bridge rect')]
  const flash = root.querySelector('.marlsa-entry-flash')
  const stage = root.querySelector('.marlsa-memory-stage')
  const reveals = [...root.querySelectorAll('.marlsa-home-reveal:not(.marlsa-memory-stage)')]

  if (reducedMotion || pdfMode || !entry || !blank || !ocean || !flash) {
    root.dataset.d1101Opening = 'static'
    if (entry) entry.style.display = 'none'
    window.dispatchEvent(new CustomEvent('portfolio:home-opening-complete'))
    return () => {
      delete root.dataset.d1101Opening
      if (entry) entry.style.removeProperty('display')
    }
  }

  const animated = [
    entry, blank, prelude, preludeOrbit, ...preludeOrbitRings, preludeOrbitScan, preludeOrbitTicks, ...preludeCurrent, ...preludeCurrentNodes, preludeMeta, ...preludeTitle, preludeLine, preludeHorizon, preludeMarker, splash, ocean,
    ...bubbles, bridge, ...bridgeLines, ...bridgeRects, flash, stage, ...reveals,
  ].filter(Boolean)
  let timeline
  let play

  const context = gsap.context(() => {
    play = () => {
      timeline?.kill()
      gsap.killTweensOf(animated)
      gsap.killTweensOf(entryVisualState)
      entryVisualState.resolve = 0
      root.dataset.d1101Opening = 'armed'
      window.dispatchEvent(new CustomEvent('portfolio:home-opening-start'))

      gsap.set(entry, { display: 'block', autoAlpha: 1, backgroundColor: '#fff', willChange: 'opacity' })
      gsap.set(blank, { autoAlpha: 1 })
      gsap.set(prelude, { autoAlpha: 1, y: 0, willChange: 'transform,opacity' })
      gsap.set(preludeOrbit, { autoAlpha: 0, scale: .72, yPercent: 3, willChange: 'transform,opacity' })
      gsap.set(preludeOrbitRings, { autoAlpha: 0, scale: .82, willChange: 'transform,opacity' })
      gsap.set(preludeOrbitScan, { autoAlpha: 0, rotation: -12, scale: .9, willChange: 'transform,opacity' })
      gsap.set(preludeOrbitTicks, { autoAlpha: 0, rotation: -6, scale: .94, willChange: 'transform,opacity' })
      gsap.set(preludeCurrent, { autoAlpha: 0, strokeDasharray: 920, strokeDashoffset: 920, willChange: 'opacity,stroke-dashoffset' })
      gsap.set(preludeCurrentNodes, { autoAlpha: 0, scale: .2, transformOrigin: 'center', willChange: 'transform,opacity' })
      gsap.set(preludeMeta, { autoAlpha: 0, x: -12, willChange: 'transform,opacity' })
      gsap.set(preludeTitle, { autoAlpha: 0, x: -22, clipPath: 'inset(0 100% 0 0)', willChange: 'transform,opacity,clip-path' })
      gsap.set(preludeLine, { scaleX: 0, willChange: 'transform' })
      gsap.set(preludeHorizon, { scaleX: 0, autoAlpha: 0, willChange: 'transform,opacity' })
      gsap.set(preludeMarker, { scale: .2, autoAlpha: 0, willChange: 'transform,opacity' })
      gsap.set(splash, { autoAlpha: 1 })
      gsap.set(ocean, { yPercent: 104, scale: 1.025, autoAlpha: 1, willChange: 'transform,opacity' })
      gsap.set(bubbles, { y: 80, scale: .25, autoAlpha: 0, willChange: 'transform,opacity' })
      gsap.set(bridge, { autoAlpha: 0, scale: 1.035, willChange: 'transform,opacity' })
      gsap.set(bridgeLines, { strokeDashoffset: 150, autoAlpha: 0 })
      gsap.set(bridgeRects, { scale: .3, autoAlpha: 0, transformOrigin: 'center' })
      gsap.set(flash, { autoAlpha: 0 })
      gsap.set(reveals, { y: 24, autoAlpha: 0, willChange: 'transform,opacity' })
      gsap.set(stage, { autoAlpha: 0, willChange: 'opacity' })

      timeline = gsap.timeline({
        defaults: { force3D: true },
        onComplete: () => {
          gsap.set(animated.filter((node) => node !== entry), { clearProps: 'transform,opacity,visibility,willChange,strokeDashoffset' })
          gsap.set(entry, { display: 'none', clearProps: 'transform,opacity,visibility,willChange,backgroundColor' })
          root.dataset.d1101Opening = 'complete'
          window.dispatchEvent(new CustomEvent('portfolio:home-opening-complete'))
        },
      })
        // 1. A restrained archive cue opens the descent without holding on a logo card.
        .to(preludeOrbit, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 1.26, ease: 'power4.out' }, .04)
        .to(preludeOrbitRings, { autoAlpha: 1, scale: 1, duration: .86, stagger: .075, ease: 'power3.out' }, .12)
        .to(preludeOrbitScan, { autoAlpha: 1, rotation: 7, scale: 1, duration: 1.46, ease: 'sine.inOut' }, .08)
        .to(preludeOrbitTicks, { autoAlpha: .7, rotation: 3, scale: 1, duration: 1.34, ease: 'sine.inOut' }, .16)
        .to(preludeCurrent, { autoAlpha: 1, strokeDashoffset: 0, duration: 1.18, stagger: { each: .045, from: 'center' }, ease: 'power2.inOut' }, .3)
        .to(preludeCurrentNodes, { autoAlpha: .82, scale: 1, duration: .44, stagger: { each: .055, from: 'center' }, ease: 'back.out(1.45)' }, .72)
        .to(preludeMeta, { autoAlpha: 1, x: 0, duration: .42, ease: 'power3.out' }, .12)
        .to(preludeTitle, { autoAlpha: 1, x: 0, clipPath: 'inset(0 0% 0 0)', duration: .58, stagger: .045, ease: 'power4.out' }, .22)
        .to(preludeLine, { scaleX: 1, duration: .66, ease: 'expo.inOut' }, .28)
        .to(preludeHorizon, { scaleX: 1, autoAlpha: 1, duration: .72, ease: 'power3.inOut' }, .36)
        .to(preludeMarker, { scale: 1, autoAlpha: 1, duration: .34, ease: 'back.out(1.35)' }, .6)
        // 2. The low circular field expands into the same arc used by the rising sea.
        .to(prelude, { autoAlpha: 0, y: -8, duration: .82, ease: 'sine.inOut' }, 1.14)
        // 3. The real water follows the guide waves without a cut or white flash.
        .to(ocean, { yPercent: 0, scale: 1.012, duration: 1.84, ease: 'power2.inOut' }, .98)
        .to(splash, { autoAlpha: 0, duration: 1.02, ease: 'sine.out' }, 1.76)
        .to(ocean, { scale: 1, duration: 2.8, ease: 'sine.out' }, 2.55)
        .to(bubbles, {
          y: (index) => -window.innerHeight * (.52 + (index % 5) * .04),
          x: (index) => (index % 2 ? 16 : -12),
          scale: 1,
          autoAlpha: .7,
          duration: 2.9,
          stagger: { each: .04, from: 'edges' },
          ease: 'sine.out',
        }, 1.78)
        // 4. The ocean is analysed into the same continuous structure used by the homepage.
        .to(bridge, { autoAlpha: 1, scale: 1, duration: .85, ease: 'power2.out' }, 3.48)
        .to(bridgeLines, { strokeDashoffset: 0, autoAlpha: 1, duration: 1.3, stagger: .12, ease: 'sine.inOut' }, 3.56)
        .to(bridgeRects, { scale: 1, autoAlpha: 1, duration: .62, stagger: .09, ease: 'back.out(1.7)' }, 3.82)
        // 5. Dry the ocean into paper and reveal the moving ribs through its curved silhouette.
        // Keep the homepage structure on its already-rendered first frame while the
        // ocean resolves. Starting its WebGL clock later prevents two fullscreen
        // render loops from fighting for the same frame during the hand-off.
        .call(() => window.dispatchEvent(new CustomEvent('portfolio:home-reveal')), [], 5.08)
        .set(entry, { backgroundColor: 'transparent' }, 3.7)
        .to(blank, { autoAlpha: 0, duration: .65, ease: 'sine.inOut' }, 3.7)
        .to(stage, { autoAlpha: 1, duration: 1.35, ease: 'sine.inOut' }, 3.7)
        .to(entryVisualState, { resolve: 1, duration: 3.15, ease: 'sine.inOut' }, 3.65)
        .to(reveals, { y: 0, autoAlpha: 1, duration: 1.25, stagger: .07, ease: 'power2.out' }, 5.0)
        .to(ocean, { autoAlpha: 0, duration: 1.1, ease: 'sine.inOut' }, 5.8)
        .to(bubbles, { autoAlpha: 0, duration: .72, stagger: .012, ease: 'sine.in' }, 4.58)
        .to(bridge, { autoAlpha: 0, duration: .9, ease: 'sine.inOut' }, 4.45)
        .to(entry, { autoAlpha: 0, duration: .5, ease: 'sine.out' }, 6.8)
    }

    if (!location.hash || location.hash === '#title') play()
    else {
      gsap.set(entry, { display: 'none' })
      root.dataset.d1101Opening = 'complete'
      window.dispatchEvent(new CustomEvent('portfolio:home-opening-complete'))
    }
  }, root)

  window.addEventListener('portfolio:home-enter', play)

  return () => {
    window.removeEventListener('portfolio:home-enter', play)
    timeline?.kill()
    context.revert()
    delete root.dataset.d1101Opening
  }
}

export default initD1101HomeMotion
