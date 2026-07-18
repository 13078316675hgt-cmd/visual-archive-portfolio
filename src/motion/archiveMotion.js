import { gsap } from 'gsap'

const DESKTOP_DURATION = 1250
const TABLET_DURATION = 1080
const MOBILE_DURATION = 930
const MEDIA_TIMEOUT = 1800
const SETTLED_FRAMES = 5

const isSceneVisible = (scene) => {
  const rect = scene.getBoundingClientRect()
  return rect.bottom > 0 && rect.top < window.innerHeight * 0.9
}

export function initArchiveMotion(scene, { reducedMotion = false } = {}) {
  if (!scene) return () => {}

  const motionParent = scene.querySelector('.directory-motion-parent')
  const imageFrame = scene.querySelector('.directory-image-frame')
  const image = scene.querySelector('.directory-master-image')
  const nodes = Array.from(scene.querySelectorAll('.archive-route-node'))
  const mobile = window.matchMedia('(max-width: 900px)').matches
  const tablet = !mobile && window.matchMedia('(max-width: 1100px)').matches
  const motionTarget = mobile || tablet ? imageFrame : motionParent
  const queryValue = new URLSearchParams(window.location.search).get('archiveMotion')
  const disposers = []

  let timeline = null
  let observer = null
  let readinessTimer = 0
  let settleFrame = 0
  let mediaReady = false
  let inViewport = isSceneVisible(scene)
  let played = false
  let navigationSettling = false
  let disposed = false
  let lastScrollY = window.scrollY
  let stableFrames = 0

  scene.dataset.archiveMotionReady = 'true'
  scene.dataset.archiveMotionDirection = 'mother-image-pullback'
  scene.dataset.archivePhase = reducedMotion || queryValue === 'end' ? 'complete' : 'loading'

  const setActiveNode = (chapter) => {
    if (chapter) scene.dataset.archiveActive = chapter
    else delete scene.dataset.archiveActive
  }

  const setComplete = () => {
    timeline?.kill()
    gsap.killTweensOf(motionTarget)
    gsap.set(motionTarget, { clearProps: 'transform,transformOrigin,willChange' })
    scene.dataset.archivePhase = 'complete'
    scene.classList.add('is-archive-complete')
  }

  const prepare = () => {
    timeline?.kill()
    gsap.killTweensOf(motionTarget)
    scene.classList.remove('is-archive-complete')
    scene.dataset.archivePhase = 'prepared'

    gsap.set(motionTarget, {
      scale: mobile ? 1.022 : (tablet ? 1.035 : 1.095),
      x: mobile ? 2 : (tablet ? 4 : 8),
      y: mobile ? 2 : (tablet ? 3 : 5),
      transformOrigin: mobile || tablet ? '50% 50%' : '50% 53%',
      force3D: true,
      willChange: 'transform',
    })
  }

  const buildTimeline = () => {
    const firstDuration = mobile ? 0.68 : (tablet ? 0.78 : 0.9)
    const settleDuration = mobile ? 0.25 : (tablet ? 0.3 : 0.35)
    const firstScale = mobile ? 1.006 : (tablet ? 1.009 : 1.012)
    const firstX = mobile ? 0.5 : (tablet ? 0.8 : 1)
    const firstY = mobile ? 0.4 : (tablet ? 0.6 : 0.8)

    timeline?.kill()
    timeline = gsap.timeline({
      paused: true,
      defaults: { overwrite: 'auto' },
      onStart: () => { scene.dataset.archivePhase = 'reveal' },
      onComplete: setComplete,
    })
    timeline
      .to(motionTarget, {
        scale: firstScale,
        x: firstX,
        y: firstY,
        duration: firstDuration,
        ease: 'power3.out',
      }, 0)
      .to(motionTarget, {
        scale: 1,
        x: 0,
        y: 0,
        duration: settleDuration,
        ease: 'power2.out',
      }, firstDuration)
    return timeline
  }

  const play = () => {
    if (disposed || reducedMotion || played || navigationSettling || !mediaReady || !inViewport) return
    played = true
    buildTimeline().play(0)
  }

  const waitForVisibleSettledState = () => {
    window.cancelAnimationFrame(settleFrame)
    stableFrames = 0
    lastScrollY = window.scrollY

    const check = () => {
      if (disposed || !inViewport || navigationSettling || played || !mediaReady) {
        settleFrame = 0
        return
      }
      const currentScrollY = window.scrollY
      stableFrames = Math.abs(currentScrollY - lastScrollY) <= 0.5 ? stableFrames + 1 : 0
      lastScrollY = currentScrollY
      if (stableFrames >= SETTLED_FRAMES) {
        settleFrame = 0
        play()
        return
      }
      settleFrame = window.requestAnimationFrame(check)
    }
    settleFrame = window.requestAnimationFrame(check)
  }

  const prepareReplay = () => {
    played = false
    navigationSettling = true
    prepare()
  }

  const onTransitionStart = () => prepareReplay()
  const onTransitionSettled = () => {
    navigationSettling = false
    inViewport = isSceneVisible(scene)
    waitForVisibleSettledState()
  }
  const onHistoryEnter = () => {
    if (reducedMotion || queryValue === 'end') {
      played = true
      navigationSettling = false
      setComplete()
      return
    }
    prepareReplay()
  }

  const markMediaReady = () => {
    if (mediaReady || disposed) return
    mediaReady = true
    window.clearTimeout(readinessTimer)
    if (inViewport && !navigationSettling) waitForVisibleSettledState()
  }

  window.addEventListener('portfolio:directory-transition-start', onTransitionStart)
  window.addEventListener('portfolio:directory-transition-settled', onTransitionSettled)
  window.addEventListener('portfolio:directory-history-enter', onHistoryEnter)

  if (reducedMotion || queryValue === 'end') {
    played = true
    mediaReady = true
    scene.dataset.archiveReduced = reducedMotion ? 'true' : 'false'
    setComplete()
  } else {
    prepare()
    const decoded = image?.decode ? image.decode().catch(() => undefined) : Promise.resolve()
    decoded.then(markMediaReady)
    readinessTimer = window.setTimeout(markMediaReady, MEDIA_TIMEOUT)

    observer = new IntersectionObserver(([entry]) => {
      inViewport = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.16)
      if (inViewport) waitForVisibleSettledState()
      else window.cancelAnimationFrame(settleFrame)
    }, { threshold: [0, 0.16, 0.35], rootMargin: '0px 0px -5% 0px' })
    observer.observe(scene)
  }

  nodes.forEach((node) => {
    const chapter = node.dataset.chapter
    const onEnter = () => setActiveNode(chapter)
    const onLeave = () => { if (!node.matches(':focus-within')) setActiveNode(null) }
    const onFocusOut = (event) => { if (!node.contains(event.relatedTarget)) setActiveNode(null) }
    node.addEventListener('pointerenter', onEnter)
    node.addEventListener('pointerleave', onLeave)
    node.addEventListener('focusin', onEnter)
    node.addEventListener('focusout', onFocusOut)
    disposers.push(() => {
      node.removeEventListener('pointerenter', onEnter)
      node.removeEventListener('pointerleave', onLeave)
      node.removeEventListener('focusin', onEnter)
      node.removeEventListener('focusout', onFocusOut)
    })
  })

  return () => {
    disposed = true
    observer?.disconnect()
    timeline?.kill()
    gsap.killTweensOf(motionTarget)
    window.clearTimeout(readinessTimer)
    window.cancelAnimationFrame(settleFrame)
    disposers.forEach((dispose) => dispose())
    window.removeEventListener('portfolio:directory-transition-start', onTransitionStart)
    window.removeEventListener('portfolio:directory-transition-settled', onTransitionSettled)
    window.removeEventListener('portfolio:directory-history-enter', onHistoryEnter)
    setActiveNode(null)
    scene.classList.remove('is-archive-complete')
    delete scene.dataset.archiveMotionDirection
    delete scene.dataset.archiveReduced
    delete scene.dataset.archivePhase
    gsap.set(motionTarget, { clearProps: 'transform,transformOrigin,willChange' })
  }
}

export const archiveMotionReviewStates = Object.freeze(['initial', 'end', 'replay'])
export const archiveMotionDurations = Object.freeze({
  desktop: DESKTOP_DURATION,
  tablet: TABLET_DURATION,
  mobile: MOBILE_DURATION,
})
