const MOTION_MEDIA = '(min-width: 1440px)'
const REDUCED_MEDIA = '(prefers-reduced-motion: reduce)'
const RESUME_DELAY = 650
const ENTRY_DELAY = 360
const MIN_TRAVEL_X = 180
const MIN_TRAVEL_Y = 90

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function getMotionSpeed() {
  if (window.innerWidth >= 2400) return 22
  if (window.innerWidth >= 1800) return 20
  if (window.innerWidth >= 1440) return 18
  return 16
}

export function initEndPageDvdMotion(section, panel) {
  if (!section || !panel) return () => {}

  const stage = section.querySelector('.end-page-stage')
  if (!stage) return () => {}

  const motionMedia = window.matchMedia(MOTION_MEDIA)
  const reducedMedia = window.matchMedia(REDUCED_MEDIA)
  const pauseReasons = new Set(['offscreen'])
  const resumeTimers = new Map()

  let frameId = 0
  let measureFrameId = 0
  let entryTimer = 0
  let lastFrameTime = 0
  let entryReady = false
  let hasEntered = false
  let inViewport = false
  let x = 0
  let y = 0
  let velocityX = 0
  let velocityY = 0
  let collisionCount = 0
  let hasMeaningfulTravel = false
  let bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 }

  const isViewportMotionEligible = () => motionMedia.matches && !reducedMedia.matches
  const isMotionEligible = () => isViewportMotionEligible() && hasMeaningfulTravel
  const rangeX = () => Math.max(0, bounds.maxX - bounds.minX)
  const rangeY = () => Math.max(0, bounds.maxY - bounds.minY)

  const writeTransform = () => {
    panel.style.transform = `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0)`
  }

  const stopFrame = () => {
    if (frameId) cancelAnimationFrame(frameId)
    frameId = 0
    lastFrameTime = 0
    section.dataset.dvdRafActive = 'false'
  }

  const canRun = () => (
    isMotionEligible()
    && entryReady
    && inViewport
    && !document.hidden
    && pauseReasons.size === 0
  )

  const emitCollision = (axis) => {
    collisionCount += 1
    panel.dataset.dvdCollisions = String(collisionCount)
    section.dispatchEvent(new CustomEvent('end-page-dvd-collision', {
      detail: { axis, count: collisionCount, x, y },
    }))
  }

  const tick = (now) => {
    if (!canRun()) {
      stopFrame()
      return
    }

    if (!lastFrameTime) lastFrameTime = now
    const elapsed = Math.min((now - lastFrameTime) / 1000, 0.05)
    lastFrameTime = now

    let nextX = x + velocityX * elapsed
    let nextY = y + velocityY * elapsed
    let hitX = false
    let hitY = false

    if (nextX < bounds.minX) {
      nextX = bounds.minX
      velocityX = Math.abs(velocityX)
      hitX = true
    } else if (nextX > bounds.maxX) {
      nextX = bounds.maxX
      velocityX = -Math.abs(velocityX)
      hitX = true
    }

    if (nextY < bounds.minY) {
      nextY = bounds.minY
      velocityY = Math.abs(velocityY)
      hitY = true
    } else if (nextY > bounds.maxY) {
      nextY = bounds.maxY
      velocityY = -Math.abs(velocityY)
      hitY = true
    }

    x = nextX
    y = nextY
    if (hitX || hitY) emitCollision(hitX && hitY ? 'xy' : hitX ? 'x' : 'y')
    writeTransform()
    frameId = requestAnimationFrame(tick)
  }

  const requestRun = () => {
    if (!canRun()) return
    panel.dataset.dvdState = 'running'
    if (frameId) return
    section.dataset.dvdRafActive = 'true'
    lastFrameTime = 0
    frameId = requestAnimationFrame(tick)
  }

  const reflectInteractionState = () => {
    panel.dataset.dvdPause = [...pauseReasons].join(',')
    if (pauseReasons.size && entryReady && isMotionEligible()) {
      panel.dataset.dvdState = 'paused'
    }
  }

  const pause = (reason) => {
    const timer = resumeTimers.get(reason)
    if (timer) clearTimeout(timer)
    resumeTimers.delete(reason)
    pauseReasons.add(reason)
    stopFrame()
    reflectInteractionState()
  }

  const resume = (reason, delay = RESUME_DELAY) => {
    const current = resumeTimers.get(reason)
    if (current) clearTimeout(current)
    const timer = window.setTimeout(() => {
      resumeTimers.delete(reason)
      pauseReasons.delete(reason)
      reflectInteractionState()
      requestRun()
    }, delay)
    resumeTimers.set(reason, timer)
  }

  const applyStaticState = (reason) => {
    stopFrame()
    clearTimeout(entryTimer)
    entryReady = false
    hasMeaningfulTravel = false
    x = 0
    y = 0
    panel.dataset.dvdState = 'static'
    panel.dataset.dvdPause = ''
    panel.style.removeProperty('transform')
    section.dataset.dvdMode = reason
    section.dataset.dvdTravel = `${rangeX().toFixed(2)},${rangeY().toFixed(2)}`
  }

  const measure = () => {
    measureFrameId = 0
    if (reducedMedia.matches) {
      applyStaticState('reduced-static')
      return
    }
    if (!motionMedia.matches) {
      applyStaticState('viewport-static')
      return
    }

    const previousRangeX = rangeX()
    const previousRangeY = rangeY()
    const normalizedX = previousRangeX ? (x - bounds.minX) / previousRangeX : 0.18
    const normalizedY = previousRangeY ? (y - bounds.minY) / previousRangeY : 0.34
    const stageRect = stage.getBoundingClientRect()
    const panelWidth = panel.offsetWidth
    const panelHeight = panel.offsetHeight
    const outerPadding = clamp(window.innerWidth * 0.025, 36, 64)

    const visibleLeft = outerPadding - stageRect.left
    const visibleRight = window.innerWidth - outerPadding - stageRect.left - panelWidth
    const protectedRight = stageRect.width * 0.42 - panelWidth
    const visibleBottom = window.innerHeight - outerPadding - stageRect.top - panelHeight
    const stageBottom = stageRect.height - panelHeight - outerPadding
    const maxY = Math.max(outerPadding, Math.min(visibleBottom, stageBottom))
    const desiredMinY = Math.max(outerPadding, stageRect.height * 0.52)

    bounds = {
      minX: Math.max(outerPadding, visibleLeft),
      maxX: Math.max(Math.max(outerPadding, visibleLeft), Math.min(visibleRight, protectedRight)),
      minY: Math.min(desiredMinY, maxY),
      maxY,
    }

    panel.dataset.dvdBounds = [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY]
      .map((value) => value.toFixed(2))
      .join(',')
    section.dataset.dvdTravel = `${rangeX().toFixed(2)},${rangeY().toFixed(2)}`
    hasMeaningfulTravel = rangeX() >= MIN_TRAVEL_X && rangeY() >= MIN_TRAVEL_Y
    if (!hasMeaningfulTravel) {
      applyStaticState('travel-static')
      return
    }

    x = bounds.minX + clamp(normalizedX, 0, 1) * rangeX()
    y = bounds.minY + clamp(normalizedY, 0, 1) * rangeY()
    const speed = getMotionSpeed()
    const signX = velocityX < 0 ? -1 : 1
    const signY = velocityY < 0 ? -1 : 1
    velocityX = signX * speed * 0.82
    velocityY = signY * speed * 0.57
    panel.dataset.dvdSpeed = String(speed)
    panel.dataset.dvdTrajectory = `${velocityX.toFixed(2)},${velocityY.toFixed(2)}`
    section.dataset.dvdMode = window.innerWidth < 1600 ? 'compact-motion' : 'desktop-motion'
    entryReady = hasEntered
    panel.dataset.dvdState = hasEntered ? 'revealed' : 'prepared'
    writeTransform()
    requestRun()
  }

  const scheduleMeasure = () => {
    if (measureFrameId) cancelAnimationFrame(measureFrameId)
    measureFrameId = requestAnimationFrame(measure)
  }

  const beginEntry = () => {
    if (hasEntered || !isViewportMotionEligible()) return
    hasEntered = true
    panel.dataset.dvdState = 'revealed'
    clearTimeout(entryTimer)
    entryTimer = window.setTimeout(() => {
      entryReady = true
      requestRun()
    }, ENTRY_DELAY)
  }

  const onVisibilityChange = () => {
    if (document.hidden) pause('hidden')
    else resume('hidden', 0)
  }

  const onPointerEnter = () => pause('pointer')
  const onPointerLeave = () => resume('pointer')
  const onPointerDown = () => pause('press')
  const onPointerUp = () => resume('press')
  const onFocusIn = () => pause('focus')
  const onFocusOut = (event) => {
    if (!panel.contains(event.relatedTarget)) resume('focus')
  }
  const onSelectStart = () => pause('selection')
  const onSelectionChange = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) resume('selection')
  }
  const onMediaChange = () => {
    if (!isViewportMotionEligible()) {
      applyStaticState(reducedMedia.matches ? 'reduced-static' : 'viewport-static')
    }
    else {
      panel.dataset.dvdState = hasEntered ? 'revealed' : 'prepared'
      if (hasEntered) {
        entryReady = true
        scheduleMeasure()
      } else if (inViewport) {
        scheduleMeasure()
        beginEntry()
      }
    }
  }

  panel.dataset.dvdState = isViewportMotionEligible() ? 'prepared' : 'static'
  panel.dataset.dvdCollisions = '0'
  panel.addEventListener('pointerenter', onPointerEnter)
  panel.addEventListener('pointerleave', onPointerLeave)
  panel.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  panel.addEventListener('focusin', onFocusIn)
  panel.addEventListener('focusout', onFocusOut)
  panel.addEventListener('selectstart', onSelectStart)
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('resize', scheduleMeasure, { passive: true })
  motionMedia.addEventListener('change', onMediaChange)
  reducedMedia.addEventListener('change', onMediaChange)

  const resizeObserver = new ResizeObserver(scheduleMeasure)
  resizeObserver.observe(stage)
  resizeObserver.observe(panel)

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inViewport = Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.04)
    if (inViewport) {
      pauseReasons.delete('offscreen')
      reflectInteractionState()
      scheduleMeasure()
      beginEntry()
      requestRun()
    } else {
      pause('offscreen')
    }
  }, { threshold: [0, 0.04, 0.12] })
  intersectionObserver.observe(section)

  if (!isViewportMotionEligible()) {
    applyStaticState(reducedMedia.matches ? 'reduced-static' : 'viewport-static')
  } else scheduleMeasure()

  const api = {
    getState: () => ({
      mode: section.dataset.dvdMode,
      state: panel.dataset.dvdState,
      pause: panel.dataset.dvdPause,
      collisions: collisionCount,
      position: { x, y },
      velocity: { x: velocityX, y: velocityY },
      bounds: { ...bounds },
      travel: { x: rangeX(), y: rangeY() },
      thresholds: { x: MIN_TRAVEL_X, y: MIN_TRAVEL_Y },
      meaningfulTravel: hasMeaningfulTravel,
      rafActive: Boolean(frameId),
    }),
  }
  window.__END_PAGE_DVD_MOTION__ = api

  return () => {
    stopFrame()
    if (measureFrameId) cancelAnimationFrame(measureFrameId)
    clearTimeout(entryTimer)
    resumeTimers.forEach((timer) => clearTimeout(timer))
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    panel.removeEventListener('pointerenter', onPointerEnter)
    panel.removeEventListener('pointerleave', onPointerLeave)
    panel.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    panel.removeEventListener('focusin', onFocusIn)
    panel.removeEventListener('focusout', onFocusOut)
    panel.removeEventListener('selectstart', onSelectStart)
    document.removeEventListener('selectionchange', onSelectionChange)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('resize', scheduleMeasure)
    motionMedia.removeEventListener('change', onMediaChange)
    reducedMedia.removeEventListener('change', onMediaChange)
    panel.style.removeProperty('transform')
    delete panel.dataset.dvdState
    delete panel.dataset.dvdPause
    delete panel.dataset.dvdBounds
    delete panel.dataset.dvdSpeed
    delete panel.dataset.dvdTrajectory
    delete panel.dataset.dvdCollisions
    delete section.dataset.dvdMode
    delete section.dataset.dvdTravel
    delete section.dataset.dvdRafActive
    if (window.__END_PAGE_DVD_MOTION__ === api) delete window.__END_PAGE_DVD_MOTION__
  }
}
