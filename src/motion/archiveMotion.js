const DESKTOP_DURATION = 600
const MOBILE_DURATION = 500
const CARD_STAGGER = 35
const CARD_DURATION = 280

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

const setProgress = (node, property, value) => node?.style.setProperty(property, String(value))

function setSceneProgress(scene, progress) {
  const value = Math.max(0, Math.min(1, progress))
  setProgress(scene, '--archive-stage-progress', value)
  setProgress(scene, '--archive-core-progress', value)
  setProgress(scene, '--archive-axis-progress', value)
  setProgress(scene, '--archive-timeline-progress', value)

  scene.querySelectorAll('.archive-selection-link, .archive-selection-core-ring, .archive-selection-hub').forEach((node) => {
    setProgress(node, '--route-progress', value)
  })
}

function setCardProgress(node, value) {
  setProgress(node, '--node-progress', value)
  setProgress(node, '--anchor-progress', value)
  setProgress(node, '--leader-progress', value)
  setProgress(node, '--frame-progress', value)
  setProgress(node, '--image-progress', value)
  setProgress(node, '--strip-progress', value)
  setProgress(node, '--label-progress', value)
  setProgress(node, '--utility-progress', value)
  setProgress(node, '--archive-mobile-item-progress', value)
}

function applyComplete(scene, nodes) {
  setSceneProgress(scene, 1)
  nodes.forEach((node) => setCardProgress(node, 1))
  scene.dataset.archivePhase = 'complete'
  scene.classList.add('is-archive-complete')
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
  const disposers = []
  const timers = new Set()
  let observer = null
  let played = false

  scene.dataset.archiveMotionReady = 'true'
  scene.dataset.archiveReview = explicitReview ? queryValue : ''

  const schedule = (callback, delay) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)
    timers.add(timer)
  }

  const play = () => {
    if (played) return
    played = true
    observer?.disconnect()
    scene.dataset.archivePhase = 'reveal'
    setSceneProgress(scene, 0)
    nodes.forEach((node) => setCardProgress(node, 0))

    window.requestAnimationFrame(() => {
      setSceneProgress(scene, 1)
      nodes.forEach((node, index) => schedule(() => setCardProgress(node, 1), index * CARD_STAGGER))
      schedule(() => applyComplete(scene, nodes), Math.max(DESKTOP_DURATION, (nodes.length - 1) * CARD_STAGGER + CARD_DURATION))
    })
  }

  if (reducedMotion || queryValue === 'end') {
    if (reducedMotion) scene.dataset.archiveReduced = 'true'
    applyComplete(scene, nodes)
  } else if (explicitReview && queryValue === 'initial') {
    setSceneProgress(scene, 0)
    nodes.forEach((node) => setCardProgress(node, 0))
    scene.dataset.archivePhase = 'initial'
  } else if (explicitReview) {
    applyComplete(scene, nodes)
    scene.dataset.archiveReview = queryValue
  } else {
    setSceneProgress(scene, 0)
    nodes.forEach((node) => setCardProgress(node, 0))
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
    delete scene.dataset.archiveMotionReady
    delete scene.dataset.archiveReview
    delete scene.dataset.archiveReduced
    delete scene.dataset.archivePhase
  }
}

export const archiveMotionReviewStates = Object.freeze(REVIEW_STATES.concat('replay'))
export const archiveMotionDurations = Object.freeze({ desktop: DESKTOP_DURATION, mobile: MOBILE_DURATION })
