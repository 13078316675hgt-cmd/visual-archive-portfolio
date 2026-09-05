import { gsap } from 'gsap'

const DESKTOP_MEDIA = '(min-width: 1025px)'
const REDUCED_MEDIA = '(prefers-reduced-motion: reduce)'
const IMAGE_WAIT_MS = 1200

const waitForImages = async (section) => {
  const images = [...section.querySelectorAll('.d06-desktop-layout img, .d07-page01-desktop img, .d08-page01-desktop img')]
  const decoded = Promise.all(images.map((image) => {
    if (image.complete && image.naturalWidth > 0) return true
    return image.decode?.().then(() => true).catch(() => false) || Promise.resolve(false)
  }))
  const result = await Promise.race([
    decoded.then((values) => values.every(Boolean)),
    new Promise((resolve) => window.setTimeout(() => resolve(false), IMAGE_WAIT_MS)),
  ])
  return result
}

const createOneShotMotion = (section, pageName, buildTimeline, finalTargets) => {
  if (!section || !window.matchMedia(DESKTOP_MEDIA).matches) return () => {}
  const reduced = window.matchMedia(REDUCED_MEDIA).matches
  let disposed = false
  let observer = null
  let timeline = null

  const finish = () => {
    gsap.set(finalTargets(), { clearProps: 'all' })
    section.dataset.d06Motion = 'complete'
  }

  if (reduced) {
    finish()
    return () => delete section.dataset.d06Motion
  }

  section.dataset.d06Motion = 'prepared'
  timeline = buildTimeline(finish)

  const start = async () => {
    section.dataset.d06Motion = 'waiting-images'
    const ready = await waitForImages(section)
    if (disposed) return
    if (!ready) {
      timeline?.kill()
      finish()
      section.dataset.d06ImageFallback = 'true'
      return
    }
    section.dataset.d06Motion = 'running'
    timeline.play(0)
  }

  observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    observer.disconnect()
    start()
  }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' })
  observer.observe(section)

  return () => {
    disposed = true
    observer?.disconnect()
    timeline?.kill()
    gsap.set(finalTargets(), { clearProps: 'all' })
    delete section.dataset.d06Motion
    delete section.dataset.d06ImageFallback
  }
}

export function initD07Page01Motion(section) {
  if (!section) return () => {}
  const q = (selector) => section.querySelector(selector)
  const qa = (selector) => [...section.querySelectorAll(selector)]
  const art = q('.d08-page01-art')
  const reveals = qa('.d08-page01-reveal')
  const plane = q('.d08-page01-color-plane')
  const heading = q('.d08-page01-heading')
  const titleWords = qa('.d08-page01-heading h2 span')
  const headingMeta = qa('.d08-page01-heading p, .d08-page01-heading small')
  const index = q('.d08-page01-index')
  const sideMeta = q('.d08-page01-side-meta')
  const axes = qa('.d08-page01-cross-axis')
  const targets = () => [art, ...reveals, plane, heading, ...titleWords, ...headingMeta, index, sideMeta, ...axes].filter(Boolean)

  return createOneShotMotion(section, '01', (finish) => {
    gsap.set(art, { x: 8, y: -6, force3D: true, willChange: 'transform' })
    gsap.set(reveals[0], { scaleY: 1, transformOrigin: 'top center' })
    gsap.set(reveals[1], { scaleY: 1, transformOrigin: 'bottom center' })
    gsap.set(plane, { clipPath: 'polygon(0 52%, 92% 31%, 72% 100%, 0 100%)', opacity: .62 })
    gsap.set(titleWords, { clipPath: 'inset(0 100% 0 0)', x: -28, opacity: 0 })
    gsap.set(headingMeta, { opacity: 0, y: 9 })
    gsap.set(index, { clipPath: 'inset(0 0 100% 0)', y: 20, opacity: 0 })
    gsap.set(sideMeta, { opacity: 0, y: -10 })
    gsap.set(axes, { scaleX: 0, scaleY: 0, transformOrigin: 'left top' })
    return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: finish })
      .to(reveals[0], { scaleY: 0, duration: .66, ease: 'power3.inOut' }, 0)
      .to(reveals[1], { scaleY: 0, duration: .7, ease: 'power3.inOut' }, .16)
      .to(art, { x: 0, y: 0, duration: .9, ease: 'power3.inOut' }, .08)
      .to(plane, { clipPath: 'polygon(0 26%, 92% 0, 72% 100%, 0 100%)', opacity: 1, duration: .68 }, .38)
      .to(axes, { scaleX: 1, scaleY: 1, duration: .48, stagger: .08 }, .58)
      .to(titleWords, { clipPath: 'inset(0 0% 0 0)', x: 0, opacity: 1, duration: .58, stagger: .08 }, .76)
      .to(headingMeta, { opacity: 1, y: 0, duration: .38, stagger: .08 }, 1.02)
      .to(index, { clipPath: 'inset(0 0 0% 0)', y: 0, opacity: 1, duration: .52 }, .94)
      .to(sideMeta, { opacity: 1, y: 0, duration: .34 }, 1.2)
      .to({}, { duration: .9 }, 1.55)
  }, targets)
}

export function initD06Page03Motion(section) {
  if (!section) return () => {}
  const q = (selector) => section.querySelector(selector)
  const qa = (selector) => [...section.querySelectorAll(selector)]
  const art = q('.d08-page03-art')
  const field = q('.d08-page03-green-field')
  const orbits = qa('.d08-page03-orbit')
  const ribbons = qa('.d08-page03-ribbon')
  const wave = q('.d08-page03-lower-wave')
  const copy = q('.d08-page03-copy')
  const titleWords = qa('.d08-page03-copy h2 span')
  const index = q('.d08-page03-index')
  const side = q('.d08-page03-side')
  const targets = () => [art, field, ...orbits, ...ribbons, wave, copy, ...titleWords, index, side].filter(Boolean)

  return createOneShotMotion(section, '03', (finish) => {
    gsap.set(field, { clipPath: 'polygon(0 0, 46% 0, 38% 19%, 59% 42%, 45% 67%, 56% 100%, 0 100%)' })
    gsap.set(art, { opacity: .82, y: 12, filter: 'saturate(.9)', force3D: true })
    gsap.set(orbits, { opacity: 0, scale: .94, transformOrigin: 'center' })
    gsap.set(ribbons, { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(wave, { yPercent: 24, opacity: .28 })
    gsap.set(copy, { opacity: 0 })
    gsap.set(titleWords, { clipPath: 'inset(0 100% 0 0)', x: 18 })
    gsap.set(index, { opacity: 0, y: -12 })
    gsap.set(side, { opacity: 0, y: 10 })
    return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: finish })
      .to(field, { clipPath: 'polygon(0 0, 81% 0, 65% 19%, 92% 42%, 72% 67%, 88% 100%, 0 100%)', duration: .82, ease: 'power3.inOut' }, 0)
      .to(art, { opacity: 1, y: 0, filter: 'saturate(1)', duration: .88, ease: 'power3.out' }, .12)
      .to(orbits, { opacity: 1, scale: 1, duration: .58, stagger: .1 }, .34)
      .to(ribbons, { scaleX: 1, duration: .58, stagger: .12 }, .48)
      .to(wave, { yPercent: 0, opacity: .76, duration: .76, ease: 'power3.inOut' }, .58)
      .to(copy, { opacity: 1, duration: .16 }, .78)
      .to(titleWords, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: .56, stagger: .08 }, .82)
      .to(index, { opacity: 1, y: 0, duration: .46 }, .98)
      .to(side, { opacity: 1, y: 0, duration: .34 }, 1.18)
      .to({}, { duration: .85 }, 1.55)
  }, targets)
}

export function initD06Page04Motion(section) {
  if (!section) return () => {}
  const q = (selector) => section.querySelector(selector)
  const qa = (selector) => [...section.querySelectorAll(selector)]
  const primary = q('.d06-sheet-primary')
  const supports = qa('.d06-sheet-support')
  const heading = q('.d06-sheet-heading')
  const order = q('.d06-sheet-order')
  const axis = q('.d06-sheet-axis')
  const targets = () => [primary, ...supports, heading, order, axis].filter(Boolean)

  return createOneShotMotion(section, '04', (finish) => {
    gsap.set(primary, { scale: 1.035, x: -12, transformOrigin: 'left center' })
    gsap.set(supports, { clipPath: 'inset(0 100% 0 0)', x: 16 })
    gsap.set(heading, { clipPath: 'inset(0 0 100% 0)', y: -14 })
    gsap.set(order, { clipPath: 'inset(0 100% 0 0)' })
    gsap.set(axis, { scaleY: 0, transformOrigin: 'top center' })
    return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: finish })
      .to(primary, { scale: 1, x: 0, duration: .9, ease: 'power3.inOut' }, 0)
      .to(axis, { scaleY: 1, duration: .72 }, .18)
      .to(supports, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: .7, stagger: .13 }, .34)
      .to(heading, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: .7 }, .96)
      .to(order, { clipPath: 'inset(0 0% 0 0)', duration: .5 }, 1.28)
      .to({}, { duration: .65 }, 1.65)
  }, targets)
}

export function initD06Page05Motion(section) {
  if (!section) return () => {}
  const q = (selector) => section.querySelector(selector)
  const qa = (selector) => [...section.querySelectorAll(selector)]
  const sheet = q('.d06-costume-sheet')
  const crops = qa('.d06-costume-crop')
  const heading = q('.d06-costume-heading')
  const markers = qa('.d06-costume-marker')
  const interfaceLayer = q('.d06-costume-interface')
  const targets = () => [sheet, ...crops, heading, ...markers, interfaceLayer].filter(Boolean)

  if (sheet && !heading && crops.length === 0 && markers.length === 0) {
    return createOneShotMotion(section, '05', (finish) => {
      gsap.set(sheet, { opacity: 0, scale: 1.012, transformOrigin: 'center' })
      gsap.set(interfaceLayer, { opacity: 0, y: -8 })
      return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: finish })
        .to(sheet, { opacity: 1, scale: 1, duration: .82, ease: 'power3.inOut' }, 0)
        .to(interfaceLayer, { opacity: 1, y: 0, duration: .68 }, .22)
        .to({}, { duration: .42 }, .82)
    }, targets)
  }

  return createOneShotMotion(section, '05', (finish) => {
    gsap.set(sheet, { scale: 1.04, xPercent: 2, transformOrigin: '62% 48%' })
    gsap.set(crops, { clipPath: 'inset(100% 0 0 0)', y: 14 })
    gsap.set(heading, { clipPath: 'inset(0 100% 0 0)', x: -18 })
    gsap.set(markers, { scaleY: 0, scaleX: 0, transformOrigin: 'left top' })
    return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: finish })
      .to(sheet, { scale: 1, xPercent: 0, duration: .92, ease: 'power3.inOut' }, 0)
      .to(crops, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: .68, stagger: .16 }, .32)
      .to(markers, { scaleY: 1, scaleX: 1, duration: .52, stagger: .12 }, .72)
      .to(heading, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: .76 }, .92)
      .to({}, { duration: .7 }, 1.62)
  }, targets)
}

export function initD06Page06PrimaryMotion(section) {
  if (!section) return () => {}
  const q = (selector) => section.querySelector(selector)
  const qa = (selector) => [...section.querySelectorAll(selector)]
  const anchor = q('.d06-identity-anchor')
  const supports = qa('.d06-identity-light, .d06-identity-strip')
  const heading = q('.d06-identity-heading')
  const vertical = q('.d06-identity-vertical')
  const targets = () => [anchor, ...supports, heading, vertical].filter(Boolean)

  return createOneShotMotion(section, '06-primary', (finish) => {
    gsap.set(anchor, { scale: 1.06, xPercent: -2, transformOrigin: '36% 42%' })
    gsap.set(supports, { clipPath: 'inset(0 100% 0 0)', x: 18 })
    gsap.set(heading, { clipPath: 'inset(0 0 100% 0)', y: 20 })
    gsap.set(vertical, { clipPath: 'inset(100% 0 0 0)' })
    return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: finish })
      .to(anchor, { scale: 1, xPercent: 0, duration: 1.05, ease: 'power3.inOut' }, 0)
      .to(supports, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: .66, stagger: .14 }, .34)
      .to(heading, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: .72 }, .92)
      .to(vertical, { clipPath: 'inset(0% 0 0 0)', duration: .46 }, 1.28)
      .to({}, { duration: .7 }, 1.64)
  }, targets)
}

export function initD06Page06SecondaryMotion(section) {
  if (!section) return () => {}
  const q = (selector) => section.querySelector(selector)
  const art = q('.d06-presentation-art')
  const heading = q('.d06-presentation-heading')
  const ghost = q('.d06-presentation-ghost')
  const rule = q('.d06-presentation-rule')
  const index = q('.d06-presentation-index')
  const targets = () => [art, heading, ghost, rule, index].filter(Boolean)

  return createOneShotMotion(section, '06-secondary', (finish) => {
    gsap.set(art, { scale: 1.05, xPercent: 2, transformOrigin: '58% 44%' })
    gsap.set(heading, { clipPath: 'inset(0 100% 0 0)', x: -20 })
    gsap.set(ghost, { clipPath: 'inset(100% 0 0 0)', y: 22 })
    gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(index, { clipPath: 'inset(0 0 100% 0)', y: 14 })
    return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: finish })
      .to(art, { scale: 1, xPercent: 0, duration: 1.02, ease: 'power3.inOut' }, 0)
      .to(rule, { scaleX: 1, duration: .58 }, .42)
      .to(heading, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: .76 }, .72)
      .to(index, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: .5 }, 1.08)
      .to(ghost, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: .66 }, 1.14)
      .to({}, { duration: .6 }, 1.72)
  }, targets)
}

export function initD06Page07Motion(section) {
  if (!section) return () => {}
  const q = (selector) => section.querySelector(selector)
  const qa = (selector) => [...section.querySelectorAll(selector)]
  const supports = qa('.d06-archive-support')
  const heading = q('.d06-archive-heading')
  const ghost = q('.d06-archive-ghost')
  const outro = q('.d06-archive-outro')
  const axis = q('.d06-archive-axis')
  const targets = () => [...supports, heading, ghost, outro, axis].filter(Boolean)

  return createOneShotMotion(section, '07', (finish) => {
    gsap.set(supports, { clipPath: 'inset(0 100% 0 0)', x: 18 })
    gsap.set(heading, { clipPath: 'inset(0 0 100% 0)', y: -12 })
    gsap.set(ghost, { clipPath: 'inset(100% 0 0 0)', y: 24 })
    gsap.set(outro, { clipPath: 'inset(0 100% 0 0)' })
    gsap.set(axis, { scaleX: 0, transformOrigin: 'left center' })
    return gsap.timeline({ paused: true, defaults: { ease: 'power3.out' }, onComplete: finish })
      .to(axis, { scaleX: 1, duration: .64 }, .12)
      .to(supports, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: .7, stagger: .14 }, .28)
      .to(heading, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: .68 }, .96)
      .to(ghost, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: .62 }, 1.16)
      .to(outro, { clipPath: 'inset(0 0% 0 0)', duration: .42 }, 1.34)
      .to({}, { duration: .62 }, 1.7)
  }, targets)
}
