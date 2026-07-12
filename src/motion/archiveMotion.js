const DESKTOP_DURATION = 5000
const MOBILE_DURATION = 1320

const REVIEW_TIMES = Object.freeze({
  initial: 0,
  stage: 300,
  core: 900,
  routes: 1700,
  nodes: 2600,
  windows: 3300,
  labels: 3900,
  terminal: 4600,
  end: DESKTOP_DURATION,
})

const ROUTE_TIMINGS = Object.freeze({
  '04': [900, 1400],
  '01': [1120, 1580],
  '05': [1120, 1580],
  '02': [1340, 1800],
  '06': [1340, 1840],
  '03': [1580, 2080],
  '07': [1580, 2120],
  '08': [1840, 2200],
  '09': [4070, 4470],
})

const NODE_TIMINGS = Object.freeze({
  '04': [1500, 1790],
  '01': [1740, 2030],
  '05': [1740, 2030],
  '02': [1990, 2280],
  '06': [1990, 2280],
  '03': [2240, 2530],
  '07': [2240, 2530],
  '08': [3600, 3890],
  '09': [4250, 4540],
})

const WINDOW_TIMINGS = Object.freeze({
  '04': [2100, 2570],
  '01': [2250, 2720],
  '05': [2370, 2840],
  '02': [2490, 2960],
  '06': [2610, 3080],
  '03': [2760, 3230],
  '07': [2910, 3480],
})

const LABEL_TIMINGS = Object.freeze({
  '04': [2600, 2960],
  '01': [2760, 3120],
  '05': [2880, 3240],
  '02': [3010, 3370],
  '06': [3130, 3490],
  '03': [3260, 3620],
  '07': [3420, 4020],
})

const TERMINAL_TIMINGS = Object.freeze({
  '08': [3760, 4080],
  '09': [4490, 4820],
})

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const phase = (time, start, end) => clamp((time - start) / Math.max(1, end - start))
const setProgress = (node, property, value) => node?.style.setProperty(property, value.toFixed(4))

function getPhaseName(time) {
  if (time <= 0) return 'initial'
  if (time < 500) return 'stage'
  if (time < 1250) return 'core'
  if (time < 2200) return 'routes'
  if (time < 3000) return 'nodes'
  if (time < 3650) return 'windows'
  if (time < 4200) return 'labels'
  if (time < 4850) return 'terminal'
  return 'complete'
}

function applyDesktopTime(scene, time) {
  const safeTime = clamp(time, 0, DESKTOP_DURATION)
  const stageProgress = phase(safeTime, 0, 500)
  const coreProgress = phase(safeTime, 350, 1250)
  const axisProgress = phase(safeTime, 900, 1450)

  setProgress(scene, '--archive-stage-progress', stageProgress)
  setProgress(scene, '--archive-core-progress', coreProgress)
  setProgress(scene, '--archive-axis-progress', axisProgress)
  setProgress(scene, '--archive-timeline-progress', safeTime / DESKTOP_DURATION)

  scene.querySelectorAll('.archive-selection-core-ring').forEach((ring, index) => {
    setProgress(ring, '--route-progress', phase(safeTime, 760 + index * 110, 1360 + index * 120))
  })
  const hub = scene.querySelector('.archive-selection-hub')
  setProgress(hub, '--route-progress', phase(safeTime, 1160, 1620))

  scene.querySelectorAll('.archive-selection-link').forEach((route) => {
    const timing = ROUTE_TIMINGS[route.dataset.routeChapter] || [900, 2200]
    setProgress(route, '--route-progress', phase(safeTime, timing[0], timing[1]))
  })

  scene.querySelectorAll('.archive-route-node').forEach((node) => {
    const chapter = node.dataset.chapter
    const nodeTiming = NODE_TIMINGS[chapter] || [1500, 3000]
    const nodeProgress = phase(safeTime, nodeTiming[0], nodeTiming[1])
    const windowTiming = WINDOW_TIMINGS[chapter]
    const labelTiming = LABEL_TIMINGS[chapter]
    const terminalTiming = TERMINAL_TIMINGS[chapter]

    setProgress(node, '--node-progress', nodeProgress)
    setProgress(node, '--anchor-progress', nodeProgress)
    setProgress(node, '--leader-progress', windowTiming
      ? phase(safeTime, windowTiming[0] - 150, windowTiming[0] + 130)
      : phase(safeTime, nodeTiming[1] - 80, nodeTiming[1] + 180))

    if (windowTiming) {
      setProgress(node, '--frame-progress', phase(safeTime, windowTiming[0], windowTiming[1]))
      setProgress(node, '--image-progress', phase(safeTime, windowTiming[0] + 110, windowTiming[1]))
    } else {
      setProgress(node, '--frame-progress', 0)
      setProgress(node, '--image-progress', 0)
    }

    if (labelTiming) {
      setProgress(node, '--strip-progress', phase(safeTime, labelTiming[0], labelTiming[0] + 180))
      setProgress(node, '--label-progress', phase(safeTime, labelTiming[0] + 100, labelTiming[1]))
    } else {
      setProgress(node, '--strip-progress', 0)
      setProgress(node, '--label-progress', 0)
    }

    setProgress(node, '--utility-progress', terminalTiming
      ? phase(safeTime, terminalTiming[0], terminalTiming[1])
      : 0)
  })

  scene.dataset.archivePhase = getPhaseName(safeTime)
  scene.classList.toggle('is-archive-complete', safeTime >= 4850)
}

function applyMobileTime(scene, time) {
  const safeTime = clamp(time, 0, MOBILE_DURATION)
  setProgress(scene, '--archive-mobile-head-progress', phase(safeTime, 0, 320))
  setProgress(scene, '--archive-mobile-route-progress', phase(safeTime, 140, 820))
  scene.querySelectorAll('.archive-route-node').forEach((node, index) => {
    const start = 230 + index * 72
    setProgress(node, '--archive-mobile-item-progress', phase(safeTime, start, start + 300))
  })
  scene.dataset.archivePhase = safeTime >= MOBILE_DURATION ? 'complete' : 'mobile'
  scene.classList.toggle('is-archive-complete', safeTime >= MOBILE_DURATION)
}

function setActiveNode(scene, chapter) {
  scene.querySelectorAll('.archive-selection-link.is-route-active').forEach((route) => route.classList.remove('is-route-active'))
  if (!chapter) {
    delete scene.dataset.archiveActive
    return
  }
  scene.dataset.archiveActive = chapter
  const activeRoutes = chapter === '09' ? ['08', '09'] : chapter === '08' ? ['08', '09'] : [chapter]
  activeRoutes.forEach((number) => scene.querySelector(`.archive-selection-link[data-route-chapter="${number}"]`)?.classList.add('is-route-active'))
}

export function initArchiveMotion(scene, { reducedMotion = false } = {}) {
  if (!scene) return () => {}

  const queryValue = new URLSearchParams(window.location.search).get('archiveMotion')
  const explicitReview = Object.prototype.hasOwnProperty.call(REVIEW_TIMES, queryValue)
  const replayRequested = queryValue === 'replay'
  const mobileQuery = window.matchMedia('(max-width: 1100px)')
  const nodes = Array.from(scene.querySelectorAll('.archive-route-node'))
  const disposers = []
  let observer = null
  let fallbackScrollRaf = 0
  let animationRaf = 0
  let played = false

  scene.dataset.archiveMotionReady = 'true'
  scene.dataset.archiveReview = explicitReview ? queryValue : ''

  const applyComplete = () => {
    if (mobileQuery.matches) applyMobileTime(scene, MOBILE_DURATION)
    else applyDesktopTime(scene, DESKTOP_DURATION)
  }

  const play = () => {
    if (played) return
    played = true
    observer?.disconnect()
    if (fallbackScrollRaf) window.cancelAnimationFrame(fallbackScrollRaf)
    const mobile = mobileQuery.matches
    const duration = mobile ? MOBILE_DURATION : DESKTOP_DURATION
    const startedAt = performance.now()
    scene.dataset.archiveReview = replayRequested ? 'replay' : ''

    const tick = (now) => {
      const elapsed = Math.min(duration, now - startedAt)
      if (mobile) applyMobileTime(scene, elapsed)
      else applyDesktopTime(scene, elapsed)
      if (elapsed < duration) animationRaf = window.requestAnimationFrame(tick)
      else animationRaf = 0
    }
    animationRaf = window.requestAnimationFrame(tick)
  }

  if (reducedMotion) {
    scene.dataset.archiveReduced = 'true'
    applyComplete()
  } else if (explicitReview) {
    const desktopTime = REVIEW_TIMES[queryValue]
    if (mobileQuery.matches) {
      const mobileTime = queryValue === 'initial' ? 0 : queryValue === 'stage' ? 360 : MOBILE_DURATION
      applyMobileTime(scene, mobileTime)
    } else {
      applyDesktopTime(scene, desktopTime)
    }
  } else {
    if (mobileQuery.matches) applyMobileTime(scene, 0)
    else applyDesktopTime(scene, 0)

    observer = new IntersectionObserver((entries) => {
      const entry = entries.find((candidate) => candidate.target === scene)
      if (!entry) return
      if (entry.isIntersecting && (entry.intersectionRatio >= 0.2 || entry.boundingClientRect.top < window.innerHeight * 0.68)) play()
      if (!played && entry.boundingClientRect.bottom < 0) {
        played = true
        applyComplete()
        observer?.disconnect()
      }
    }, { threshold: [0, 0.2, 0.35], rootMargin: '0px 0px -8% 0px' })
    observer.observe(scene)

    const verifyEntry = () => {
      fallbackScrollRaf = 0
      if (played) return
      const rect = scene.getBoundingClientRect()
      const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
      if (visible >= Math.min(window.innerHeight, rect.height) * 0.22) play()
      else if (rect.bottom < 0) {
        played = true
        applyComplete()
      }
    }
    const onScroll = () => {
      if (played || fallbackScrollRaf) return
      fallbackScrollRaf = window.requestAnimationFrame(verifyEntry)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    disposers.push(() => window.removeEventListener('scroll', onScroll))
    window.requestAnimationFrame(verifyEntry)
  }

  nodes.forEach((node) => {
    const chapter = node.dataset.chapter
    const onEnter = () => setActiveNode(scene, chapter)
    const onLeave = () => {
      if (!node.matches(':focus-visible')) setActiveNode(scene, null)
    }
    const onFocusOut = (event) => {
      if (!node.contains(event.relatedTarget)) setActiveNode(scene, null)
    }
    const onPointerDown = () => {
      node.classList.add('is-archive-ack')
      window.setTimeout(() => node.classList.remove('is-archive-ack'), 150)
    }
    node.addEventListener('pointerenter', onEnter)
    node.addEventListener('pointerleave', onLeave)
    node.addEventListener('focusin', onEnter)
    node.addEventListener('focusout', onFocusOut)
    node.addEventListener('pointerdown', onPointerDown)
    disposers.push(() => {
      node.removeEventListener('pointerenter', onEnter)
      node.removeEventListener('pointerleave', onLeave)
      node.removeEventListener('focusin', onEnter)
      node.removeEventListener('focusout', onFocusOut)
      node.removeEventListener('pointerdown', onPointerDown)
    })
  })

  return () => {
    observer?.disconnect()
    if (fallbackScrollRaf) window.cancelAnimationFrame(fallbackScrollRaf)
    if (animationRaf) window.cancelAnimationFrame(animationRaf)
    disposers.forEach((dispose) => dispose())
    setActiveNode(scene, null)
    scene.classList.remove('is-archive-complete')
    delete scene.dataset.archiveMotionReady
    delete scene.dataset.archiveReview
    delete scene.dataset.archiveReduced
    delete scene.dataset.archivePhase
  }
}

export const archiveMotionReviewStates = Object.freeze(Object.keys(REVIEW_TIMES).concat('replay'))
export const archiveMotionDurations = Object.freeze({ desktop: DESKTOP_DURATION, mobile: MOBILE_DURATION })
