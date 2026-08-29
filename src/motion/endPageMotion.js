import { gsap } from 'gsap'

const DESKTOP_MEDIA = '(min-width: 1025px)'
const REDUCED_MEDIA = '(prefers-reduced-motion: reduce)'
const MEDIA_TIMEOUT = 1600

export function initEndPageMotion(section, panel) {
  if (!section || !panel) return () => {}

  const stage = section.querySelector('.end-page-stage')
  const image = section.querySelector('.end-page-image')
  const veils = Array.from(section.querySelectorAll('.end-d08-hand-veil'))
  const scans = Array.from(section.querySelectorAll('.end-d08-hand-scan'))
  const bridge = section.querySelector('.end-d08-signal-bridge')
  const signal = section.querySelector('.end-d08-signal-core')
  const panelParts = [panel.querySelector('header'), panel.querySelector('.end-page-system-log-body'), panel.querySelector('footer')].filter(Boolean)
  const animated = [panel, ...panelParts, ...veils, ...scans, bridge, signal].filter(Boolean)
  if (!stage || !image) return () => {}

  section.dataset.endMotion = 'd08-local-hand-projection'
  const desktop = window.matchMedia(DESKTOP_MEDIA).matches
  const reduced = window.matchMedia(REDUCED_MEDIA).matches
  let observer = null
  let timeline = null
  let timer = 0
  let disposed = false
  let played = false
  let mediaReady = false
  let inViewport = false

  const finalState = () => {
    timeline?.kill()
    gsap.killTweensOf(animated)
    gsap.set([panel, ...panelParts], { clearProps: 'transform,clipPath,opacity,filter,willChange' })
    gsap.set(veils, { opacity: 0, clearProps: 'clipPath,willChange' })
    gsap.set(scans, { opacity: 0, clearProps: 'transform,filter,willChange' })
    gsap.set([bridge, signal].filter(Boolean), { opacity: 0, clearProps: 'transform,filter,willChange' })
    section.dataset.endMotionState = 'complete'
  }

  if (!desktop || reduced) {
    finalState()
    return () => {
      delete section.dataset.endMotion
      delete section.dataset.endMotionState
    }
  }

  const prepare = () => {
    timeline?.kill()
    gsap.killTweensOf(animated)
    section.dataset.endMotionState = 'prepared'
    gsap.set(stage, { clearProps: 'transform,transformOrigin,willChange' })
    gsap.set(veils, { opacity: 1, willChange: 'clip-path,opacity' })
    gsap.set(scans, { opacity: 0, scaleX: 0, transformOrigin: 'left center', willChange: 'transform,opacity' })
    gsap.set(bridge, { opacity: 0, scaleX: 0, transformOrigin: 'left center', willChange: 'transform,opacity' })
    gsap.set(signal, { opacity: 0, scale: .65, xPercent: -50, yPercent: -50, filter: 'blur(.8px)', willChange: 'transform,opacity,filter' })
    gsap.set(panel, {
      clipPath: 'polygon(48% 46%, 52% 46%, 52% 54%, 48% 54%)',
      opacity: 0,
      willChange: 'transform,clip-path,opacity',
    })
    gsap.set(panelParts, { opacity: 0, y: 7 })
  }

  const play = () => {
    if (disposed || played || !mediaReady || !inViewport) return
    played = true
    window.clearTimeout(timer)
    section.dataset.endMotionState = 'running'
    timeline = gsap.timeline({ paused: true, defaults: { overwrite: 'auto' }, onComplete: finalState })
      .to(scans[0], { opacity: .9, scaleX: 1, duration: .48, ease: 'power3.out' }, .1)
      .to(veils[0], { opacity: 0, duration: .62, ease: 'power2.out' }, .22)
      .to(scans[0], { opacity: 0, duration: .34, ease: 'power2.out' }, .46)
      .to(scans[1], { opacity: .78, scaleX: 1, duration: .5, ease: 'power3.out' }, .28)
      .to(veils[1], { opacity: 0, duration: .66, ease: 'power2.out' }, .42)
      .to(scans[1], { opacity: 0, duration: .34, ease: 'power2.out' }, .66)
      .to(bridge, { opacity: .75, scaleX: 1, duration: .38, ease: 'power3.out' }, .7)
      .to(signal, { opacity: .62, scale: 1, filter: 'blur(0px)', duration: .24, ease: 'power2.out' }, .78)
      .to(signal, { opacity: 0, scale: 1.55, duration: .48, ease: 'power2.out' }, 1.02)
      .to(bridge, { opacity: .18, duration: .42, ease: 'power2.out' }, 1.04)
      .to(panel, { clipPath: 'polygon(0 0, 96% 0, 100% 14%, 100% 100%, 4% 100%, 0 86%)', opacity: 1, duration: .62, ease: 'power3.out' }, .82)
      .to(panelParts, { opacity: 1, y: 0, duration: .38, stagger: .07, ease: 'power2.out' }, 1.08)
      .to(bridge, { opacity: 0, duration: .3 }, 1.45)
      .to({}, { duration: .95 }, 1.75)
    timeline.play(0)
  }

  prepare()
  const ready = image.decode ? image.decode().catch(() => undefined) : Promise.resolve()
  const markReady = () => {
    if (disposed || mediaReady) return
    mediaReady = true
    window.clearTimeout(timer)
    play()
  }
  ready.then(markReady)
  timer = window.setTimeout(markReady, MEDIA_TIMEOUT)

  observer = new IntersectionObserver(([entry]) => {
    inViewport = Boolean(entry?.isIntersecting && entry.intersectionRatio >= .08)
    if (inViewport && mediaReady) {
      observer.disconnect()
      play()
    }
  }, { threshold: [0, .08, .2] })
  observer.observe(section)

  return () => {
    disposed = true
    observer?.disconnect()
    timeline?.kill()
    window.clearTimeout(timer)
    gsap.killTweensOf(animated)
    gsap.set([panel, ...panelParts], { clearProps: 'transform,clipPath,opacity,filter,willChange' })
    gsap.set(veils, { clearProps: 'opacity,clipPath,willChange' })
    gsap.set(scans, { clearProps: 'opacity,transform,filter,willChange' })
    gsap.set([bridge, signal].filter(Boolean), { clearProps: 'opacity,transform,filter,willChange' })
    delete section.dataset.endMotion
    delete section.dataset.endMotionState
  }
}
