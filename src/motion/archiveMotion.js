import { gsap } from 'gsap'

const DESKTOP_DURATION = 2800
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
  const desktopImage = scene.querySelector('.directory-d08-image-field img')
  const image = desktopImage || scene.querySelector('.directory-master-image')
  const nodes = Array.from(scene.querySelectorAll('.archive-route-node'))
  const mobile = window.matchMedia('(max-width: 900px)').matches
  const tablet = !mobile && window.matchMedia('(max-width: 1024px)').matches
  const desktop = !mobile && !tablet
  const imageField = scene.querySelector('.directory-d08-image-field')
  const reveals = Array.from(scene.querySelectorAll('.directory-d08-reveal'))
  const axes = Array.from(scene.querySelectorAll('.directory-d08-axis'))
  const caption = scene.querySelector('.directory-d08-caption')
  const headingLabel = scene.querySelector('.directory-heading > span')
  const headingWords = Array.from(scene.querySelectorAll('.directory-heading strong span'))
  const headingSmall = scene.querySelector('.directory-heading small')
  const index = scene.querySelector('.directory-d08-index')
  const registration = Array.from(scene.querySelectorAll('.directory-d08-registration i'))
  const desktopTargets = [imageField, ...reveals, ...axes, caption, headingLabel, ...headingWords, headingSmall, index, ...registration, ...nodes].filter(Boolean)
  const motionTarget = mobile || tablet ? imageFrame : imageField
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
  scene.dataset.archiveMotionDirection = desktop ? 'd08-local-editorial-assembly' : 'mother-image-pullback'
  scene.dataset.archivePhase = reducedMotion || queryValue === 'end' ? 'complete' : 'loading'

  const setActiveNode = (chapter) => {
    if (chapter) scene.dataset.archiveActive = chapter
    else delete scene.dataset.archiveActive
  }

  const setComplete = () => {
    timeline?.kill()
    gsap.killTweensOf(desktop ? desktopTargets : motionTarget)
    if (desktop) {
      gsap.set([imageField, ...axes, caption, headingLabel, ...headingWords, headingSmall, index, ...registration, ...nodes].filter(Boolean), { clearProps: 'transform,transformOrigin,opacity,clipPath,filter,willChange' })
      gsap.set(reveals, { clearProps: 'transform,transformOrigin,opacity,willChange' })
    } else gsap.set(motionTarget, { clearProps: 'transform,transformOrigin,willChange' })
    scene.dataset.archivePhase = 'complete'
    scene.classList.add('is-archive-complete')
  }

  const prepare = () => {
    timeline?.kill()
    gsap.killTweensOf(desktop ? desktopTargets : motionTarget)
    scene.classList.remove('is-archive-complete')
    scene.dataset.archivePhase = 'prepared'

    if (desktop) {
      gsap.set(imageField, { opacity: 1, transform: 'none' })
      gsap.set(reveals, { scaleX: 1, scaleY: 1, opacity: 1, willChange: 'transform,opacity' })
      gsap.set(axes, { scaleX: 0, scaleY: 0, transformOrigin: 'left top' })
      gsap.set(caption, { opacity: 0, y: 12, clipPath: 'inset(0 0 100% 0)' })
      gsap.set(headingLabel, { opacity: 0, x: -12 })
      gsap.set(headingWords, { opacity: 0, x: -28, clipPath: 'inset(0 100% 0 0)' })
      gsap.set(headingSmall, { opacity: 0, y: 8 })
      gsap.set(nodes, { opacity: 0, x: 14, willChange: 'transform,opacity' })
      gsap.set(index, { opacity: 0, x: -12 })
      gsap.set(registration, { scaleX: 0, transformOrigin: 'left center' })
    } else {
      gsap.set(motionTarget, {
        scale: mobile ? 1.022 : 1.035,
        x: mobile ? 2 : 4,
        y: mobile ? 2 : 3,
        transformOrigin: '50% 50%',
        force3D: true,
        willChange: 'transform',
      })
    }
  }

  const buildTimeline = () => {
    if (desktop) {
      const groupOne = nodes.slice(0, 4)
      const groupTwo = nodes.slice(4)
      timeline?.kill()
      timeline = gsap.timeline({
        paused: true,
        defaults: { overwrite: 'auto' },
        onStart: () => { scene.dataset.archivePhase = 'reveal' },
        onComplete: setComplete,
      })
      timeline
        .to(reveals[0], { scaleX: 0, duration: .55, ease: 'power3.inOut' }, .08)
        .to(reveals[1], { scaleX: 0, duration: .66, ease: 'power3.inOut' }, .22)
        .to(reveals[2], { scaleY: 0, duration: .64, ease: 'power3.inOut' }, .38)
        .to(axes, { scaleX: 1, scaleY: 1, duration: .58, stagger: .08, ease: 'power3.out' }, .48)
        .to(caption, { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: .52, ease: 'power3.out' }, .58)
        .to(headingLabel, { opacity: 1, x: 0, duration: .34, ease: 'power2.out' }, .84)
        .to(headingWords, { opacity: 1, x: 0, clipPath: 'inset(0 0% 0 0)', duration: .52, stagger: .07, ease: 'power3.out' }, .9)
        .to(headingSmall, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' }, 1.12)
        .to(groupOne, { opacity: 1, x: 0, duration: .4, stagger: .065, ease: 'power3.out' }, .9)
        .to(groupTwo, { opacity: 1, x: 0, duration: .4, stagger: .065, ease: 'power3.out' }, 1.12)
        .to(index, { opacity: 1, x: 0, duration: .28, ease: 'power2.out' }, 1.35)
        .to(registration, { scaleX: 1, duration: .28, stagger: .05, ease: 'power3.out' }, 1.4)
        .to({}, { duration: .9 }, 1.7)
      return timeline
    }

    const firstDuration = mobile ? 0.68 : 0.78
    const settleDuration = mobile ? 0.25 : (tablet ? 0.3 : 0.34)
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
    gsap.killTweensOf(desktop ? desktopTargets : motionTarget)
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
    if (desktop) gsap.set(desktopTargets, { clearProps: 'transform,transformOrigin,opacity,clipPath,filter,willChange' })
    else gsap.set(motionTarget, { clearProps: 'transform,transformOrigin,willChange' })
  }
}

export const archiveMotionReviewStates = Object.freeze(['initial', 'end', 'replay'])
export const archiveMotionDurations = Object.freeze({
  desktop: DESKTOP_DURATION,
  tablet: TABLET_DURATION,
  mobile: MOBILE_DURATION,
})

