import { gsap } from 'gsap'

const HOME_COMPLETE_TIME = 1.66
const MEDIA_TIMEOUT = 1800

const isVisible = (node) => {
  const rect = node.getBoundingClientRect()
  return rect.bottom > 0 && rect.top < window.innerHeight * 0.88
}

export function initHomeMotion(section, { reducedMotion = false } = {}) {
  if (!section) return () => {}

  const base = section.querySelector('.home-v9-mother-base')
  const image = base?.querySelector('img')
  const environment = section.querySelector('.home-v9-layer-environment')
  const subject = section.querySelector('.home-v9-layer-subject')
  const foreground = section.querySelector('.home-v9-layer-foreground')
  const blueWipe = section.querySelector('.home-v9-blue-wipe')
  const layers = [environment, subject, foreground].filter(Boolean)
  const nav = section.querySelector('.top-nav')
  const copy = section.querySelector('.home-v9-copy')
  const utility = Array.from(section.querySelectorAll('.home-v9-index, .home-v9-coordinate, .home-v9-scroll'))
  const rules = Array.from(section.querySelectorAll('.home-v9-rule'))
  const animated = [base, ...layers, nav, copy, ...utility, ...rules, blueWipe].filter(Boolean)
  const mobile = window.matchMedia('(max-width: 900px)').matches
  const tablet = !mobile && window.matchMedia('(max-width: 1100px)').matches

  let timeline = null
  let observer = null
  let readinessTimer = 0
  let entryFrame = 0
  let mediaReady = false
  let inViewport = isVisible(section)
  let played = false
  let disposed = false

  const setFinalState = () => {
    gsap.killTweensOf(animated)
    if (base) gsap.set(base, { clearProps: 'transform,opacity,visibility' })
    if (layers.length) gsap.set(layers, { opacity: 0, clearProps: 'transform,visibility' })
    const finalTargets = [nav, copy, ...utility, ...rules].filter(Boolean)
    if (finalTargets.length) gsap.set(finalTargets, { clearProps: 'transform,opacity,clipPath,visibility' })
    if (blueWipe) {
      blueWipe.classList.remove('is-wipe-running')
      gsap.set(blueWipe, { transform: 'translate3d(-290%,0,0)', opacity: 0 })
    }
    section.classList.add('is-inview', 'is-complete')
    section.dataset.homeMotionState = 'complete'
  }

  const replayBlueWipe = () => {
    if (!blueWipe) return
    blueWipe.classList.remove('is-wipe-running')
    void blueWipe.offsetWidth
    blueWipe.classList.add('is-wipe-running')
  }

  const prepare = () => {
    timeline?.kill()
    gsap.killTweensOf(animated)
    section.classList.remove('is-inview', 'is-complete')
    section.dataset.homeMotionState = 'prepared'

    gsap.set(base, {
      scale: mobile ? 1.028 : (tablet ? 1.04 : 1.072),
      x: mobile ? 4 : (tablet ? 6 : 13),
      y: mobile ? 2 : (tablet ? 3 : 4),
      transformOrigin: mobile ? '58% 52%' : '72% 52%',
      force3D: true,
    })

    if (mobile) {
      gsap.set(layers, { opacity: 0 })
    } else {
      gsap.set(environment, {
        scale: tablet ? 1.025 : 1.038,
        x: tablet ? -7 : -11,
        y: tablet ? -4 : -5,
        opacity: tablet ? 0.34 : 0.24,
        transformOrigin: '68% 48%',
        force3D: true,
      })
      gsap.set(subject, {
        scale: tablet ? 1.038 : 1.058,
        x: tablet ? 12 : 18,
        y: tablet ? 2 : 2,
        opacity: tablet ? 0.52 : 0.36,
        transformOrigin: '70% 48%',
        force3D: true,
      })
      gsap.set(foreground, {
        scale: tablet ? 1.04 : 1.06,
        x: tablet ? -10 : -16,
        y: tablet ? 6 : 9,
        opacity: tablet ? 0.45 : 0.3,
        transformOrigin: '66% 68%',
        force3D: true,
      })
    }

    gsap.set(nav, { opacity: 0, y: mobile ? -4 : -8 })
    gsap.set(copy, {
      opacity: 0,
      x: mobile ? -10 : -20,
      yPercent: mobile ? 0 : -44,
      clipPath: 'inset(0 0 100% 0)',
    })
    gsap.set(utility, { opacity: 0, y: mobile ? 4 : 8 })
    gsap.set(rules, { scaleX: 0, transformOrigin: 'left center' })
  }

  const buildTimeline = () => {
    timeline?.kill()
    timeline = gsap.timeline({
      paused: true,
      defaults: { overwrite: 'auto' },
      onStart: () => {
        section.classList.add('is-inview')
        section.dataset.homeMotionState = 'playing'
      },
      onComplete: setFinalState,
    })

    timeline.to(base, {
      scale: 1,
      x: 0,
      y: 0,
      duration: mobile ? 0.82 : (tablet ? 1.07 : 1.24),
      ease: mobile || tablet ? 'power3.out' : 'power3.inOut',
    }, mobile ? 0 : 0.08)

    if (!mobile) {
      timeline
        .to(environment, { scale: 1, x: 0, y: 0, opacity: 0, duration: tablet ? 0.78 : 1.08, ease: 'power3.out' }, 0.12)
        .to(subject, { scale: 1, x: 0, y: 0, opacity: 0, duration: tablet ? 0.82 : 1.12, ease: 'power3.out' }, 0.18)
        .to(foreground, { scale: 1, x: 0, y: 0, opacity: 0, duration: tablet ? 0.74 : 1.02, ease: 'power3.out' }, 0.28)
    }

    const copyStart = mobile ? 0.28 : (tablet ? 0.78 : 0.86)
    timeline
      .to(nav, { opacity: 1, y: 0, duration: mobile ? 0.34 : 0.48, ease: 'power2.out' }, mobile ? 0.2 : (tablet ? 0.74 : 0.8))
      .to(copy, {
        opacity: 1,
        x: 0,
        yPercent: mobile ? 0 : -44,
        clipPath: 'inset(0 0 0% 0)',
        duration: mobile ? 0.46 : 0.52,
        ease: 'power3.out',
      }, copyStart)
      .to(rules[0], { scaleX: 1, duration: mobile ? 0.32 : 0.42, ease: 'power3.out' }, mobile ? 0.48 : (tablet ? 0.88 : 1.02))
      .to(rules[1], { scaleX: 1, duration: mobile ? 0.3 : 0.38, ease: 'power3.out' }, mobile ? 0.52 : (tablet ? 0.94 : 1.08))
      .to(utility, {
        opacity: 1,
        y: 0,
        duration: mobile ? 0.3 : 0.38,
        stagger: mobile ? 0.025 : 0.04,
        ease: 'power2.out',
      }, mobile ? 0.5 : (tablet ? 0.9 : 1.08))

    if (!mobile && !tablet) timeline.to({}, { duration: .18 }, 1.48)

    return timeline
  }

  const play = ({ replay = false } = {}) => {
    if (disposed || reducedMotion || !mediaReady || !inViewport || (played && !replay)) return
    played = true
    replayBlueWipe()
    prepare()
    buildTimeline().play(0)
  }

  const requestPlay = (options) => {
    entryFrame = window.requestAnimationFrame(() => play(options))
  }

  const markMediaReady = () => {
    if (mediaReady || disposed) return
    mediaReady = true
    window.clearTimeout(readinessTimer)
    const cleanHomepageEntry = !window.location.hash || window.location.hash === '#title'
    if (cleanHomepageEntry && inViewport) requestPlay()
  }

  const onHomeEnter = () => {
    inViewport = isVisible(section)
    played = false
    if (mediaReady && inViewport) requestPlay({ replay: true })
  }

  section.dataset.homeMotionState = reducedMotion ? 'complete' : 'loading'
  section.dataset.homeMotionDuration = String(HOME_COMPLETE_TIME)

  if (reducedMotion) {
    played = true
    mediaReady = true
    setFinalState()
  } else {
    prepare()
    const decoded = image?.decode ? image.decode().catch(() => undefined) : Promise.resolve()
    decoded.then(markMediaReady)
    readinessTimer = window.setTimeout(markMediaReady, MEDIA_TIMEOUT)

    observer = new IntersectionObserver(([entry]) => {
      inViewport = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.12)
      if (inViewport && mediaReady && !played && (!window.location.hash || window.location.hash === '#title')) requestPlay()
    }, { threshold: [0, 0.12, 0.35] })
    observer.observe(section)
    window.addEventListener('portfolio:home-enter', onHomeEnter)
  }

  return () => {
    disposed = true
    observer?.disconnect()
    timeline?.kill()
    gsap.killTweensOf(animated)
    window.clearTimeout(readinessTimer)
    window.cancelAnimationFrame(entryFrame)
    window.removeEventListener('portfolio:home-enter', onHomeEnter)
    section.classList.remove('is-inview', 'is-complete', 'is-directory-transitioning')
    delete section.dataset.homeMotionState
    delete section.dataset.homeMotionDuration
    gsap.set(animated, { clearProps: 'all' })
  }
}

export const homeMotionDuration = HOME_COMPLETE_TIME * 1000
