const DESKTOP_DURATION = 1080
const MOBILE_DURATION = 840

const REVIEW_STATES = Object.freeze([
  'initial',
  'stage',
  'core',
  'routes',
  'nodes',
  'windows',
  'labels',
  'terminal',
  'end',
])

const clamp = (value) => Math.max(0, Math.min(1, value))
const setProgress = (node, property, value) => node?.style.setProperty(property, String(clamp(value)))

function setSceneState(scene, { index = 0, axis = 0, signal = 0, complete = 0 } = {}) {
  setProgress(scene, '--archive-stage-progress', 1)
  setProgress(scene, '--archive-index-progress', index)
  setProgress(scene, '--archive-axis-progress', axis)
  setProgress(scene, '--archive-signal-progress', signal)
  setProgress(scene, '--archive-complete-progress', complete)
}

function setCardState(node, {
  frame = 0,
  number = 0,
  label = 0,
  utility = 0,
  secondary = 0,
  mobile = frame,
} = {}) {
  // The old route system still reads these variables. Keep the card itself
  // interactive from the first frame and animate only its editorial layers.
  setProgress(node, '--node-progress', 1)
  setProgress(node, '--anchor-progress', number)
  setProgress(node, '--leader-progress', frame)
  setProgress(node, '--frame-progress', frame)
  setProgress(node, '--image-progress', frame)
  setProgress(node, '--strip-progress', utility)
  setProgress(node, '--label-progress', label)
  setProgress(node, '--utility-progress', utility)
  setProgress(node, '--secondary-progress', secondary)
  setProgress(node, '--archive-mobile-item-progress', mobile)
}

function applyComplete(scene, nodes) {
  setSceneState(scene, { index: 1, axis: 1, signal: 1, complete: 1 })
  nodes.forEach((node) => setCardState(node, { frame: 1, number: 1, label: 1, utility: 1, secondary: 1, mobile: 1 }))
  scene.dataset.archivePhase = 'complete'
  scene.classList.add('is-archive-complete')
}

function applyReviewState(scene, nodes, state) {
  const order = REVIEW_STATES.indexOf(state)
  if (order <= 0) {
    setSceneState(scene)
    nodes.forEach((node) => setCardState(node))
    scene.dataset.archivePhase = 'initial'
    return
  }

  const number = order >= 2 ? 1 : 0
  const frame = order >= 4 ? 1 : order >= 3 ? 0.48 : 0
  const label = order >= 6 ? 1 : order >= 5 ? 0.5 : 0
  const utility = order >= 6 ? 1 : 0
  const secondary = order >= 7 ? 1 : 0
  setSceneState(scene, {
    index: order >= 1 ? 1 : 0,
    axis: order >= 3 ? 1 : 0,
    signal: order >= 8 ? 1 : 0,
    complete: order >= 8 ? 1 : 0,
  })
  nodes.forEach((node, index) => {
    const terminal = index === nodes.length - 1
    setCardState(node, {
      frame: terminal && order < 7 ? 0 : frame,
      number: terminal && order < 7 ? 0 : number,
      label: terminal && order < 7 ? 0 : label,
      utility: terminal && order < 7 ? 0 : utility,
      secondary: terminal && order < 7 ? 0 : secondary,
      mobile: terminal && order < 7 ? 0 : frame,
    })
  })
  scene.dataset.archivePhase = state
  if (order >= 8) scene.classList.add('is-archive-complete')
}

function setActiveNode(scene, chapter) {
  scene.querySelectorAll('.archive-selection-link.is-route-active').forEach((route) => route.classList.remove('is-route-active'))
  if (!chapter) {
    delete scene.dataset.archiveActive
    return
  }
  scene.dataset.archiveActive = chapter
  const activeRoutes = chapter === '08' || chapter === '09' ? ['08', '09'] : [chapter]
  activeRoutes.forEach((number) => scene.querySelector(`.archive-selection-link[data-route-chapter="${number}"]`)?.classList.add('is-route-active'))
}

export function initArchiveMotion(scene, { reducedMotion = false } = {}) {
  if (!scene) return () => {}

  const queryValue = new URLSearchParams(window.location.search).get('archiveMotion')
  const explicitReview = REVIEW_STATES.includes(queryValue)
  const nodes = Array.from(scene.querySelectorAll('.archive-route-node'))
  const mobile = window.matchMedia('(max-width: 900px)').matches
  const disposers = []
  const timers = new Set()
  let observer = null
  let played = false
  const navigationType = performance.getEntriesByType?.('navigation')?.[0]?.type
  const directContentsEntry = window.location.hash === '#contents'

  scene.dataset.archiveMotionReady = 'true'
  scene.dataset.archiveMotionDirection = 'archive-index'
  scene.dataset.archiveReview = explicitReview ? queryValue : ''

  const schedule = (callback, delay) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)
    timers.add(timer)
  }

  const playDesktop = () => {
    schedule(() => setSceneState(scene, { index: 1 }), 20)
    schedule(() => {
      setSceneState(scene, { index: 1, axis: 1 })
      nodes.forEach((node) => setCardState(node, { number: 1 }))
    }, 100)

    nodes.slice(0, 4).forEach((node, index) => {
      schedule(() => setCardState(node, { frame: 1, number: 1 }), 190 + index * 60)
      schedule(() => setCardState(node, { frame: 1, number: 1, label: 1, utility: 1 }), 420 + index * 50)
    })
    nodes.slice(4, 7).forEach((node, index) => {
      schedule(() => setCardState(node, { frame: 1, number: 1 }), 260 + index * 65)
      schedule(() => setCardState(node, { frame: 1, number: 1, label: 1, utility: 1 }), 530 + index * 55)
    })

    const identityCard = nodes.find((node) => node.dataset.chapter === '06')
    if (identityCard) schedule(() => setCardState(identityCard, { frame: 1, number: 1, label: 1, utility: 1, secondary: 1 }), 760)

    const terminal = nodes[nodes.length - 1]
    if (terminal) {
      schedule(() => setCardState(terminal, { frame: 1, number: 1 }), 680)
      schedule(() => setCardState(terminal, { frame: 1, number: 1, label: 1, utility: 1, secondary: 1 }), 760)
    }
    schedule(() => setSceneState(scene, { index: 1, axis: 1, signal: 1 }), 930)
    schedule(() => applyComplete(scene, nodes), DESKTOP_DURATION)
  }

  const playMobile = () => {
    schedule(() => setSceneState(scene, { index: 1, axis: 1 }), 20)
    nodes.forEach((node, index) => {
      const row = Math.floor(index / 2)
      schedule(() => setCardState(node, { frame: 1, number: 1, mobile: 1 }), 80 + row * 110)
      schedule(() => setCardState(node, { frame: 1, number: 1, label: 1, utility: 1, mobile: 1 }), 170 + row * 110)
    })
    const identityCard = nodes.find((node) => node.dataset.chapter === '06')
    if (identityCard) schedule(() => setCardState(identityCard, { frame: 1, number: 1, label: 1, utility: 1, secondary: 1, mobile: 1 }), 650)
    schedule(() => setSceneState(scene, { index: 1, axis: 1, signal: 1 }), 740)
    schedule(() => applyComplete(scene, nodes), MOBILE_DURATION)
  }

  const play = () => {
    if (played) return
    played = true
    observer?.disconnect()
    scene.dataset.archivePhase = 'reveal'
    mobile ? playMobile() : playDesktop()
  }

  if (reducedMotion || queryValue === 'end') {
    if (reducedMotion) scene.dataset.archiveReduced = 'true'
    applyComplete(scene, nodes)
  } else if (explicitReview) {
    applyReviewState(scene, nodes, queryValue)
  } else if (directContentsEntry || navigationType === 'back_forward') {
    // Direct deep links and browser-history restoration must never paint a
    // completed frame and then reset. Resolve them directly to the final state.
    played = true
    applyComplete(scene, nodes)
  } else {
    setSceneState(scene)
    nodes.forEach((node) => setCardState(node))
    scene.dataset.archivePhase = 'initial'

    observer = new IntersectionObserver((entries) => {
      const entry = entries.find((candidate) => candidate.target === scene)
      if (!entry) return
      if (entry.isIntersecting && (entry.intersectionRatio >= 0.16 || entry.boundingClientRect.top < window.innerHeight * 0.72)) play()
      if (!played && entry.boundingClientRect.bottom < 0) {
        played = true
        applyComplete(scene, nodes)
        observer?.disconnect()
      }
    }, { threshold: [0, 0.16], rootMargin: '0px 0px -6% 0px' })
    observer.observe(scene)

    window.requestAnimationFrame(() => {
      const rect = scene.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) play()
    })
  }

  nodes.forEach((node) => {
    const chapter = node.dataset.chapter
    const onEnter = () => setActiveNode(scene, chapter)
    const onLeave = () => {
      if (!node.matches(':focus-within')) setActiveNode(scene, null)
    }
    const onFocusOut = (event) => {
      if (!node.contains(event.relatedTarget)) setActiveNode(scene, null)
    }
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
    observer?.disconnect()
    timers.forEach((timer) => window.clearTimeout(timer))
    timers.clear()
    disposers.forEach((dispose) => dispose())
    setActiveNode(scene, null)
    scene.classList.remove('is-archive-complete')
    // data-archive-motion-ready is part of the rendered initial contract. Do
    // not remove it during an effect cleanup and briefly expose fallback UI.
    delete scene.dataset.archiveMotionDirection
    delete scene.dataset.archiveReview
    delete scene.dataset.archiveReduced
    delete scene.dataset.archivePhase
  }
}

export const archiveMotionReviewStates = Object.freeze(REVIEW_STATES.concat('replay'))
export const archiveMotionDurations = Object.freeze({ desktop: DESKTOP_DURATION, mobile: MOBILE_DURATION })
