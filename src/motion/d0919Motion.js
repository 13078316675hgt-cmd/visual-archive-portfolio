import { gsap } from 'gsap'

const REDUCED_MEDIA = '(prefers-reduced-motion: reduce)'
const MOBILE_MEDIA = '(max-width: 900px)'
const IMAGE_WAIT_MS = 1400

const waitForImages = async (root) => {
  const images = Array.from(root?.querySelectorAll('img') || [])
  if (!images.length) return true

  const decode = Promise.all(images.map((image) => {
    if (image.complete && image.naturalWidth > 0) return true
    if (typeof image.decode === 'function') return image.decode().then(() => true).catch(() => false)
    return new Promise((resolve) => {
      image.addEventListener('load', () => resolve(true), { once: true })
      image.addEventListener('error', () => resolve(false), { once: true })
    })
  }))

  return Promise.race([
    decode.then((results) => results.every(Boolean)),
    new Promise((resolve) => window.setTimeout(() => resolve(false), IMAGE_WAIT_MS)),
  ])
}

const runWhenVisible = (section, callback) => {
  const rect = section.getBoundingClientRect()
  if (rect.bottom > 0 && rect.top < window.innerHeight * .9) {
    callback()
    return () => {}
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    observer.disconnect()
    callback()
  }, { threshold: .1, rootMargin: '0px 0px -6% 0px' })

  observer.observe(section)
  return () => observer.disconnect()
}

export function initD0919DirectoryMotion(section) {
  if (!section) return () => {}

  const reduced = window.matchMedia(REDUCED_MEDIA).matches
  const mobile = window.matchMedia(MOBILE_MEDIA).matches
  const forceFinal = new URLSearchParams(window.location.search).get('archiveMotion') === 'end'
  const header = section.querySelector('[data-d0919-header]')
  const routes = Array.from(section.querySelectorAll('[data-d0919-route]'))
  const junctions = Array.from(section.querySelectorAll('[data-d0919-junction]'))
  const nodes = Array.from(section.querySelectorAll('[data-d0919-node]'))
  const frames = Array.from(section.querySelectorAll('[data-d0919-frame]'))
  const labels = Array.from(section.querySelectorAll('[data-d0919-label]'))
  const allTargets = [header, ...routes, ...junctions, ...nodes, ...frames, ...labels].filter(Boolean)
  let disposed = false
  let timeline = null

  const finish = () => {
    gsap.set(allTargets, { clearProps: 'transform,transformOrigin,opacity,clipPath,strokeDasharray,strokeDashoffset,willChange' })
    section.dataset.directoryPhase = 'complete'
  }

  if (reduced || forceFinal) {
    finish()
    return () => delete section.dataset.directoryPhase
  }

  if (mobile) {
    section.dataset.directoryPhase = 'prepared'
    gsap.set(nodes, { opacity: 0, y: 6 })

    const stopObserving = runWhenVisible(section, async () => {
      const ready = await waitForImages(section)
      if (disposed) return
      if (!ready) {
        finish()
        return
      }
      section.dataset.directoryPhase = 'running'
      timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish })
        .to(nodes, { opacity: 1, y: 0, duration: .38, stagger: .055 }, 0)
    })

    return () => {
      disposed = true
      stopObserving()
      timeline?.kill()
      finish()
    }
  }

  section.dataset.directoryPhase = 'prepared'
  gsap.set(header, { opacity: 1, y: 0 })
  gsap.set(routes, { strokeDasharray: 1, strokeDashoffset: 1 })
  gsap.set(junctions, { opacity: 0, scale: .6, transformOrigin: 'center' })
  gsap.set(nodes, { opacity: 0 })
  gsap.set(frames, { y: 6, scale: .98, transformOrigin: 'center' })
  gsap.set(labels, { clipPath: 'inset(0 100% 0 0)' })

  const stopObserving = runWhenVisible(section, async () => {
    const ready = await waitForImages(section)
    if (disposed) return
    if (!ready) {
      finish()
      section.dataset.directoryImageFallback = 'true'
      return
    }

    section.dataset.directoryPhase = 'running'
    const nodeById = (id) => section.querySelector(`[data-d0919-node="${id}"]`)
    timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: finish,
    })
      .to(routes.slice(0, 4), { strokeDashoffset: 0, duration: .46, stagger: .045, ease: 'power2.inOut' }, .05)
      .to(junctions, { opacity: 1, scale: 1, duration: .18, stagger: .09 }, .28)
      .to(nodeById('03'), { opacity: 1, duration: .18 }, .2)
      .to(nodeById('01'), { opacity: 1, x: 0, duration: .2 }, .3)
      .to(nodeById('02'), { opacity: 1, x: 0, duration: .2 }, .36)
      .to(nodeById('04'), { opacity: 1, x: 0, duration: .2 }, .42)
      .to(routes.slice(4), { strokeDashoffset: 0, duration: .42, stagger: .04, ease: 'power2.inOut' }, .48)
      .to(['05', '06', '07', 'END'].map(nodeById), { opacity: 1, duration: .22, stagger: .065 }, .58)
      .to(frames, { y: 0, scale: 1, duration: .34, stagger: .045 }, .31)
      .to(labels, { clipPath: 'inset(0 0% 0 0)', duration: .3, stagger: .055 }, .48)
  })

  return () => {
    disposed = true
    stopObserving()
    timeline?.kill()
    finish()
    delete section.dataset.directoryImageFallback
  }
}

export function initD0919Page01Motion(section) {
  if (!section) return () => {}

  const reduced = window.matchMedia(REDUCED_MEDIA).matches
  const mobile = window.matchMedia(MOBILE_MEDIA).matches
  const canvas = section.querySelector('.d0919-page01-canvas')
  const brand = section.querySelector('.d0919-page01-brand')
  const topnav = section.querySelector('.d0919-page01-topnav')
  const bottomNav = section.querySelector('.d0919-page01-bottom')
  const art = section.querySelector('[data-d0919-page01-art]')
  const copy = section.querySelector('[data-d0919-page01-copy]')
  const metadata = section.querySelector('[data-d0919-page01-meta]')
  const number = copy?.querySelector('.d0919-page01-number')
  const project = copy?.querySelector('.d0919-page01-project')
  const titleLines = Array.from(copy?.querySelectorAll('h2 span') || [])
  const facts = Array.from(copy?.querySelectorAll('.d0919-page01-facts p') || [])
  const allTargets = [
    canvas,
    brand,
    topnav,
    bottomNav,
    art,
    copy,
    metadata,
    number,
    project,
    ...titleLines,
    ...facts,
  ].filter(Boolean)
  let disposed = false
  let timeline = null

  const finish = () => {
    gsap.set(allTargets, { clearProps: 'transform,transformOrigin,opacity,clipPath,filter,willChange' })
    section.dataset.d0919Page01Phase = 'complete'
  }

  if (reduced) {
    finish()
    return () => delete section.dataset.d0919Page01Phase
  }

  section.dataset.d0919Page01Phase = 'prepared'
  gsap.set(canvas, { opacity: 1 })
  gsap.set(art, {
    opacity: 1,
    yPercent: mobile ? 1.2 : 2.2,
    scale: mobile ? 1.025 : 1.045,
    clipPath: mobile ? 'inset(0 0 3% 0)' : 'inset(0 0 6% 0)',
    transformOrigin: '50% 58%',
    willChange: 'transform,clip-path',
  })
  gsap.set(copy, { opacity: 1 })
  gsap.set([brand, topnav], { opacity: 0, y: -14 })
  gsap.set(number, {
    opacity: mobile ? 1 : 0,
    y: mobile ? 14 : 34,
    scaleY: mobile ? .72 : 1,
    transformOrigin: '50% 100%',
    clipPath: mobile ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)',
  })
  gsap.set(project, { opacity: 0, x: -14 })
  gsap.set(titleLines, {
    opacity: mobile ? 1 : 0,
    yPercent: mobile ? 20 : 85,
    scaleY: mobile ? .74 : 1,
    transformOrigin: '50% 100%',
    clipPath: mobile ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)',
  })
  gsap.set(facts, { opacity: 0, y: 16 })
  gsap.set(metadata, { opacity: 0, x: 12 })
  gsap.set(bottomNav, { opacity: 0, y: 14 })

  const stopObserving = runWhenVisible(section, async () => {
    const ready = await waitForImages(section)
    if (disposed) return
    if (!ready) {
      finish()
      section.dataset.d0919Page01ImageFallback = 'true'
      return
    }

    section.dataset.d0919Page01Phase = 'running'
    timeline = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: finish,
    })
      .to(art, {
        yPercent: 0,
        scale: 1,
        clipPath: 'inset(0 0 0% 0)',
        duration: mobile ? .78 : .92,
        ease: 'power3.inOut',
      }, 0)
      .to([brand, topnav], { opacity: 1, y: 0, duration: .46, stagger: .07 }, .08)
      .to(number, {
        opacity: 1,
        y: 0,
        scaleY: 1,
        clipPath: 'inset(0% 0 0 0)',
        duration: .62,
      }, mobile ? .02 : .18)
      .to(project, { opacity: 1, x: 0, duration: .38 }, .34)
      .to(titleLines, {
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        clipPath: 'inset(0% 0 0 0)',
        duration: .64,
        stagger: .1,
      }, mobile ? .1 : .36)
      .to(facts, { opacity: 1, y: 0, duration: .44, stagger: .09 }, .66)
      .to(metadata, { opacity: 1, x: 0, duration: .4 }, .72)
      .to(bottomNav, { opacity: 1, y: 0, duration: .46 }, .86)
  })

  return () => {
    disposed = true
    stopObserving()
    timeline?.kill()
    finish()
    delete section.dataset.d0919Page01ImageFallback
  }
}
