import gsap from 'gsap'

const setLayerFinal = (root) => {
  root.dataset.motionState = 'complete'
  if (root.dataset.approvedMotion === 'directory') {
    const section = root.closest('#contents')
    if (section) section.dataset.archivePhase = 'complete'
  }
  const approvedRoots = [...document.querySelectorAll('[data-approved-motion]')]
  const nextRoot = approvedRoots[approvedRoots.indexOf(root) + 1]
  nextRoot?.querySelectorAll('img[data-approved-src]').forEach((image) => {
    if (image.src !== image.dataset.approvedSrc) {
      image.loading = 'eager'
      image.src = image.dataset.approvedSrc
    }
  })
}

export function createApprovedHomeTimeline(root) {
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'power3.out' },
    onComplete: () => setLayerFinal(root),
  })

  tl.fromTo('[data-home-focus]', { '--radius': '27%', x: 8, y: 5, transformOrigin: '62% 39%' }, {
    '--radius': '120%', x: 0, y: 0, duration: 0.52, ease: 'power3.inOut',
  }, 0)
    .fromTo('[data-home-rocks]', { '--edge': '29%', x: -7, y: 7 }, {
      '--edge': '108%', x: 0, y: 0, duration: 0.58, ease: 'power3.inOut',
    }, 0.14)
    .fromTo('[data-home-frame]', { '--edge': '-8%', x: -6, y: 5 }, {
      '--edge': '108%', x: 0, y: 0, duration: 0.47, ease: 'power2.inOut',
    }, 0.35)
    .fromTo('[data-home-blue]', { '--edge': '-8%', y: 5 }, {
      '--edge': '108%', y: 0, duration: 0.5, ease: 'power2.inOut',
    }, 0.58)
    .fromTo('[data-home-birds]', { '--edge': '-8%', x: -7 }, {
      '--edge': '108%', x: 0, duration: 0.44, ease: 'power2.out',
    }, 0.86)
    .fromTo('[data-home-fine]', { '--edge': '-8%' }, {
      '--edge': '108%', duration: 0.4, ease: 'power2.out',
    }, 0.9)
    .addLabel('complete', 1.3)
    .to({}, { duration: 1.3 }, 1.3)

  return tl
}

export function createApprovedDirectoryTimeline(root) {
  const routes = [...root.querySelectorAll('[data-directory-route]')]
  const labels = [...root.querySelectorAll('[data-directory-label]')]
  const nodes = [...root.querySelectorAll('[data-directory-node]')]

  routes.forEach((route) => {
    const length = route.getTotalLength()
    gsap.set(route, { strokeDasharray: length, strokeDashoffset: length })
  })
  gsap.set(nodes, { opacity: 0, scale: 0.68, transformOrigin: '50% 50%' })
  gsap.set(labels, { opacity: 0, clipPath: 'inset(0 100% 0 0)' })
  gsap.set('[data-directory-title]', { opacity: 1, x: 0 })

  const nodeForLabel = [0, 1, 2, 3, null, 4, 6, 7]
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'power2.out' },
    onComplete: () => setLayerFinal(root),
  })

  tl.to(nodes[0], { opacity: 1, scale: 1, duration: 0.1 }, 0.02)
    .to(labels[0], { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.16 }, 0.07)

  let cursor = 0.24
  for (let index = 1; index < 8; index += 1) {
    tl.to(routes[index - 1], { strokeDashoffset: 0, duration: 0.18, ease: 'none' }, cursor)
    const nodeIndex = nodeForLabel[index]
    if (nodeIndex !== null) {
      tl.to(nodes[nodeIndex], { opacity: 1, scale: 1, duration: 0.1 }, cursor + 0.18)
    }
    if (index === 6) {
      tl.to(nodes[5], { opacity: 1, scale: 1, duration: 0.08 }, cursor + 0.18)
    }
    tl.to(labels[index], {
      opacity: 1,
      clipPath: 'inset(0 0% 0 0)',
      duration: 0.15,
    }, cursor + 0.26)
    cursor += 0.29
  }

  tl.addLabel('complete', 2.32).to({}, { duration: 0.18 }, 2.32)
  return tl
}

export function createApprovedPage03Timeline(root) {
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'power3.out' },
    onComplete: () => setLayerFinal(root),
  })

  tl.fromTo('[data-p3-opening]', { x: 6, y: 3 }, {
    x: 0, y: 0, duration: 0.58, ease: 'power3.inOut',
  }, 0)
    .fromTo('[data-p3-snake-rear]', { '--edge': '3%', x: 7, y: -2 }, {
      '--edge': '108%', x: 0, y: 0, duration: 0.66, ease: 'power2.inOut',
    }, 0.1)
    .fromTo('[data-p3-ribbons]', { '--edge': '1%', x: -6 }, {
      '--edge': '108%', x: 0, duration: 0.58, ease: 'power2.inOut',
    }, 0.28)
    .fromTo('[data-p3-energy]', { '--edge': '0%', x: 7 }, {
      '--edge': '108%', x: 0, duration: 0.58, ease: 'power2.out',
    }, 0.4)
    .fromTo('[data-p3-waves]', { '--edge': '0%', y: 7 }, {
      '--edge': '108%', y: 0, duration: 0.54, ease: 'power2.out',
    }, 0.56)
    .fromTo('[data-p3-remainder]', { '--edge': '0%', x: 4 }, {
      '--edge': '108%', x: 0, duration: 0.5, ease: 'power2.out',
    }, 0.64)
    .fromTo('[data-p3-gold]', { clipPath: 'inset(0 100% 0 0)' }, {
      clipPath: 'inset(0 0% 0 0)', duration: 0.42,
    }, 0.76)
    .fromTo('[data-p3-ui-left]', { clipPath: 'inset(0 100% 0 0)', x: -6 }, {
      clipPath: 'inset(0 0% 0 0)', x: 0, duration: 0.42,
    }, 0.88)
    .fromTo(['[data-p3-ui-top]', '[data-p3-ui-right]'], { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0 0 0% 0)', duration: 0.36,
    }, 1)
    .fromTo('[data-p3-ui-bottom]', { clipPath: 'inset(100% 0 0 0)', y: 6 }, {
      clipPath: 'inset(0% 0 0 0)', y: 0, duration: 0.38,
    }, 1.08)
    .addLabel('complete', 1.5)
    .to({}, { duration: 1.1 }, 1.5)

  return tl
}

export function createApprovedEndTimeline(root) {
  gsap.set('[data-end-upper]', {
    '--edge': '13%', x: -8, y: -3, rotation: -0.22, transformOrigin: '22% 18%', opacity: 1,
  })
  gsap.set('[data-end-lower]', {
    '--edge': '0%', x: 12, y: 4, rotation: 0.28, transformOrigin: '82% 58%', opacity: 0,
  })
  gsap.set(['[data-end-blue]', '[data-end-cloud]', '[data-end-log]'], { opacity: 0 })
  gsap.set('[data-end-title-fragment]', { opacity: 0, clipPath: 'inset(0 100% 0 0)' })

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'power3.inOut' },
    onComplete: () => setLayerFinal(root),
  })

  tl.to('[data-end-upper]', {
    '--edge': '108%', x: 0, y: 0, rotation: 0, duration: 0.58,
  }, 0)
    .to('[data-end-lower]', { opacity: 1, duration: 0.01 }, 0.34)
    .to('[data-end-lower]', {
      '--edge': '108%', x: 0, y: 0, rotation: 0, duration: 0.68,
    }, 0.34)
    .to('[data-end-blue]', { opacity: 1, duration: 0.34 }, 0.78)
    .to('[data-end-cloud]', { opacity: 1, duration: 0.3 }, 0.83)
    .to('[data-end-log]', { opacity: 1, duration: 0.26 }, 0.91)
    .to('[data-end-letter="e"]', { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.18 }, 0.8)
    .to('[data-end-letter="n"]', { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.18 }, 0.86)
    .to('[data-end-letter="d"]', { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.18 }, 0.92)
    .to('[data-end-letter="t"]', { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.18 }, 0.98)
    .to('[data-end-letter="l"]', { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.18 }, 1.04)
    .to('[data-end-letter="the-end"]', {
      opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.2,
    }, 1.06)
    .addLabel('complete', 1.26)
    .to({}, { duration: 1.39 }, 1.26)

  return tl
}
