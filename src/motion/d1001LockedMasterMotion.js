import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TITLE_CLIP = 'inset(38% 66.6% 44.8% 2.65%)'
const TITLE_CLIP_CLOSED = 'inset(38% 97.8% 44.8% 2.65%)'
const CLEAR_REVEAL_PROPS = 'transform,transformOrigin,opacity,visibility,clipPath,willChange'

function compact(nodes) {
  return nodes.flat(Infinity).filter(Boolean)
}

function queryAll(root, selector) {
  return gsap.utils.toArray(selector, root)
}

function clearRevealProps(nodes) {
  const targets = compact(nodes)
  if (targets.length) gsap.set(targets, { clearProps: CLEAR_REVEAL_PROPS })
}

function timelineFor(root, mobile, onComplete) {
  return gsap.timeline({
    defaults: { ease: 'power4.out', force3D: true },
    onComplete,
    scrollTrigger: {
      trigger: root,
      start: mobile ? 'top 88%' : 'top 76%',
      once: true,
      invalidateOnRefresh: true,
    },
  })
}

function buildDirectoryMotion(root, mobile) {
  const titleZh = root.querySelector('.d1001-directory-copy h3')
  const titleEn = root.querySelector('.d1001-directory-copy h2')
  const headingMeta = compact([
    root.querySelector('.d1001-directory-copy > p'),
    root.querySelector('.d1001-directory-copy > strong'),
    root.querySelector('.d1001-directory-copy > small'),
  ])
  const cards = queryAll(root, '.d1001-directory-card')
  const symbols = queryAll(root, '.d1001-directory-symbol')
  const peripheral = compact([
    root.querySelector('.d1001-directory-brand'),
    root.querySelector('.d1001-directory-projects'),
    root.querySelector('.d1001-directory-top'),
    root.querySelector('.d1001-directory-scroll'),
    root.querySelector('.d1001-directory-index'),
    root.querySelector('.d1001-directory-total'),
  ])
  const revealTargets = compact([titleZh, titleEn, headingMeta, cards, symbols, peripheral])

  gsap.set(titleZh, {
    opacity: 0,
    x: mobile ? -46 : -112,
    scaleX: mobile ? 0.82 : 0.68,
    clipPath: 'inset(0 100% 0 0)',
    transformOrigin: 'left center',
    willChange: 'transform,opacity,clip-path',
  })
  gsap.set(titleEn, {
    opacity: 0,
    x: mobile ? -28 : -72,
    scaleX: mobile ? 0.9 : 0.82,
    clipPath: 'inset(0 100% 0 0)',
    transformOrigin: 'left center',
    willChange: 'transform,opacity,clip-path',
  })
  gsap.set(headingMeta, { opacity: 0, y: mobile ? 18 : 28, willChange: 'transform,opacity' })
  gsap.set(cards, {
    opacity: 0,
    y: mobile ? 44 : 78,
    scale: mobile ? 0.985 : 0.965,
    transformOrigin: '50% 100%',
    willChange: 'transform,opacity',
  })
  gsap.set(symbols, {
    clipPath: 'inset(100% 0 0 0)',
    y: mobile ? 14 : 24,
    willChange: 'transform,clip-path',
  })
  gsap.set(peripheral, { opacity: 0, y: mobile ? 12 : 20, willChange: 'transform,opacity' })

  const timeline = timelineFor(root, mobile, () => clearRevealProps(revealTargets))
  timeline
    .to(titleZh, {
      opacity: 1,
      x: 0,
      scaleX: 1,
      clipPath: 'inset(0 0% 0 0)',
      duration: mobile ? 0.9 : 1.22,
      ease: 'expo.out',
    }, 0)
    .to(titleEn, {
      opacity: 1,
      x: 0,
      scaleX: 1,
      clipPath: 'inset(0 0% 0 0)',
      duration: mobile ? 0.88 : 1.14,
      ease: 'expo.out',
    }, mobile ? 0.08 : 0.14)
    .to(headingMeta, {
      opacity: 1,
      y: 0,
      duration: mobile ? 0.68 : 0.9,
      stagger: mobile ? 0.045 : 0.07,
    }, mobile ? 0.24 : 0.36)
    .to(peripheral, {
      opacity: 1,
      y: 0,
      duration: mobile ? 0.62 : 0.86,
      stagger: mobile ? 0.035 : 0.055,
    }, mobile ? 0.34 : 0.48)
    .to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: mobile ? 0.74 : 1.02,
      stagger: mobile ? 0.085 : 0.13,
      ease: 'power4.out',
    }, mobile ? 0.42 : 0.62)
    .to(symbols, {
      clipPath: 'inset(0% 0 0 0)',
      y: 0,
      duration: mobile ? 0.65 : 0.92,
      stagger: mobile ? 0.075 : 0.11,
      ease: 'power3.out',
    }, mobile ? 0.54 : 0.78)

  return timeline
}

function buildProfileMotion(root, mobile) {
  const titleZh = root.querySelector('.d1001-profile-identity h3')
  const titleEn = root.querySelector('.d1001-profile-header h2')
  const headerMeta = root.querySelector('.d1001-profile-header > p')
  const intro = root.querySelector('.d1001-profile-intro')
  const identityDetails = compact([
    root.querySelector('.d1001-profile-identity > p'),
    root.querySelector('.d1001-profile-identity dl'),
  ])
  const panels = queryAll(root, '.d1001-profile-panel')
  const lowerBlocks = compact([
    root.querySelector('.d1001-profile-strengths'),
    root.querySelector('.d1001-profile-tools'),
  ])
  const lowerCards = queryAll(root, '.d1001-profile-strengths article, .d1001-profile-tools article')
  const footer = root.querySelector('.d1001-profile-canvas > footer')
  const revealTargets = compact([
    titleZh,
    titleEn,
    headerMeta,
    intro,
    identityDetails,
    panels,
    lowerBlocks,
    lowerCards,
    footer,
  ])

  gsap.set(titleZh, {
    opacity: 0,
    x: mobile ? 44 : 96,
    scaleX: mobile ? 0.84 : 0.7,
    clipPath: 'inset(0 0 0 100%)',
    transformOrigin: 'right center',
    willChange: 'transform,opacity,clip-path',
  })
  gsap.set(titleEn, {
    opacity: 0,
    x: mobile ? -34 : -78,
    scaleX: mobile ? 0.88 : 0.76,
    clipPath: 'inset(0 100% 0 0)',
    transformOrigin: 'left center',
    willChange: 'transform,opacity,clip-path',
  })
  gsap.set(headerMeta, { opacity: 0, y: mobile ? 14 : 22, willChange: 'transform,opacity' })
  gsap.set([intro, ...identityDetails], { opacity: 0, y: mobile ? 24 : 38, willChange: 'transform,opacity' })
  gsap.set(panels, {
    opacity: 0,
    y: mobile ? 38 : 68,
    scale: mobile ? 0.99 : 0.975,
    transformOrigin: '50% 0%',
    willChange: 'transform,opacity',
  })
  gsap.set(lowerBlocks, { opacity: 0, y: mobile ? 34 : 58, willChange: 'transform,opacity' })
  gsap.set(lowerCards, { opacity: 0, y: mobile ? 18 : 30, willChange: 'transform,opacity' })
  gsap.set(footer, { opacity: 0, scaleX: 0.72, transformOrigin: 'left center', willChange: 'transform,opacity' })

  const timeline = timelineFor(root, mobile, () => clearRevealProps(revealTargets))
  timeline
    .to(titleZh, {
      opacity: 1,
      x: 0,
      scaleX: 1,
      clipPath: 'inset(0 0% 0 0)',
      duration: mobile ? 0.9 : 1.22,
      ease: 'expo.out',
    }, 0)
    .to(titleEn, {
      opacity: 1,
      x: 0,
      scaleX: 1,
      clipPath: 'inset(0 0% 0 0)',
      duration: mobile ? 0.88 : 1.16,
      ease: 'expo.out',
    }, mobile ? 0.08 : 0.16)
    .to(headerMeta, { opacity: 1, y: 0, duration: mobile ? 0.62 : 0.82 }, mobile ? 0.2 : 0.31)
    .to([intro, ...identityDetails], {
      opacity: 1,
      y: 0,
      duration: mobile ? 0.72 : 0.94,
      stagger: mobile ? 0.06 : 0.09,
    }, mobile ? 0.32 : 0.48)
    .to(panels, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: mobile ? 0.78 : 1.02,
      stagger: mobile ? 0.1 : 0.15,
      ease: 'power4.out',
    }, mobile ? 0.46 : 0.67)
    .to(lowerBlocks, {
      opacity: 1,
      y: 0,
      duration: mobile ? 0.76 : 0.96,
      stagger: mobile ? 0.1 : 0.15,
    }, mobile ? 0.7 : 0.96)
    .to(lowerCards, {
      opacity: 1,
      y: 0,
      duration: mobile ? 0.55 : 0.74,
      stagger: mobile ? 0.035 : 0.055,
    }, mobile ? 0.82 : 1.12)
    .to(footer, { opacity: 1, scaleX: 1, duration: mobile ? 0.62 : 0.86 }, mobile ? 0.96 : 1.36)

  return timeline
}

function buildAboutMotion(root, mobile) {
  const titleZh = root.querySelector('.d1001-about-copy h3')
  const titleEn = root.querySelector('.d1001-about-copy h2')
  const copyMeta = compact([
    root.querySelector('.d1001-about-copy > p:first-child'),
    root.querySelector('.d1001-about-copy > i'),
    root.querySelector('.d1001-about-copy > p:last-child'),
  ])
  const chrome = compact([
    root.querySelector('.d1001-about-brand'),
    root.querySelector('.d1001-about-top'),
    root.querySelector('.d1001-about-rule'),
  ])
  const hand = root.querySelector('.d1001-about-hand')
  const handImage = hand?.querySelector('img')
  const scan = root.querySelector('.d1001-about-scan')
  const profileWindow = root.querySelector('.d1001-about-window')
  const bottomMeta = compact([
    root.querySelector('.d1001-about-version'),
    root.querySelector('.d1001-about-return'),
    root.querySelector('.d1001-about-index'),
  ])
  const revealTargets = compact([titleZh, titleEn, copyMeta, chrome, hand, scan, profileWindow, bottomMeta])

  gsap.set(titleZh, {
    opacity: 0,
    x: mobile ? -44 : -104,
    scaleX: mobile ? 0.82 : 0.66,
    clipPath: 'inset(0 100% 0 0)',
    transformOrigin: 'left center',
    willChange: 'transform,opacity,clip-path',
  })
  gsap.set(titleEn, {
    opacity: 0,
    x: mobile ? -28 : -72,
    scaleX: mobile ? 0.9 : 0.8,
    clipPath: 'inset(0 100% 0 0)',
    transformOrigin: 'left center',
    willChange: 'transform,opacity,clip-path',
  })
  gsap.set(copyMeta, { opacity: 0, y: mobile ? 18 : 30, willChange: 'transform,opacity' })
  gsap.set(chrome, { opacity: 0, y: mobile ? -10 : -18, willChange: 'transform,opacity' })
  gsap.set(hand, {
    clipPath: 'inset(0 100% 0 0)',
    transformOrigin: 'left center',
    willChange: 'clip-path',
  })
  gsap.set(handImage, {
    xPercent: mobile ? -1.5 : -4,
    scale: mobile ? 1.015 : 1.04,
    transformOrigin: '50% 50%',
    willChange: 'transform',
  })
  gsap.set(scan, { scaleX: 0, transformOrigin: 'left center', willChange: 'transform' })
  gsap.set(profileWindow, {
    opacity: 0,
    y: mobile ? 44 : 76,
    scale: mobile ? 0.985 : 0.96,
    clipPath: 'inset(0 0 18% 0)',
    transformOrigin: '50% 100%',
    willChange: 'transform,opacity,clip-path',
  })
  gsap.set(bottomMeta, { opacity: 0, y: mobile ? 12 : 20, willChange: 'transform,opacity' })

  const timeline = timelineFor(root, mobile, () => {
    clearRevealProps(revealTargets)
    if (mobile) clearRevealProps(handImage)
  })
  timeline
    .to(titleZh, {
      opacity: 1,
      x: 0,
      scaleX: 1,
      clipPath: 'inset(0 0% 0 0)',
      duration: mobile ? 0.92 : 1.26,
      ease: 'expo.out',
    }, 0)
    .to(titleEn, {
      opacity: 1,
      x: 0,
      scaleX: 1,
      clipPath: 'inset(0 0% 0 0)',
      duration: mobile ? 0.9 : 1.2,
      ease: 'expo.out',
    }, mobile ? 0.1 : 0.16)
    .to(chrome, {
      opacity: 1,
      y: 0,
      duration: mobile ? 0.62 : 0.82,
      stagger: mobile ? 0.045 : 0.07,
    }, mobile ? 0.18 : 0.28)
    .to(copyMeta, {
      opacity: 1,
      y: 0,
      duration: mobile ? 0.68 : 0.92,
      stagger: mobile ? 0.055 : 0.08,
    }, mobile ? 0.3 : 0.43)
    .to(hand, {
      clipPath: 'inset(0 0% 0 0)',
      duration: mobile ? 1 : 1.4,
      ease: 'power4.inOut',
    }, mobile ? 0.38 : 0.54)
    .to(handImage, {
      xPercent: 0,
      duration: mobile ? 1.05 : 1.45,
      ease: 'power4.out',
    }, mobile ? 0.38 : 0.54)
    .to(profileWindow, {
      opacity: 1,
      y: 0,
      scale: 1,
      clipPath: 'inset(0 0 0% 0)',
      duration: mobile ? 0.92 : 1.18,
      ease: 'power4.out',
    }, mobile ? 0.62 : 0.88)
    .to(scan, { scaleX: 1, duration: mobile ? 0.76 : 1.02, ease: 'power3.inOut' }, mobile ? 0.78 : 1.08)
    .to(bottomMeta, {
      opacity: 1,
      y: 0,
      duration: mobile ? 0.62 : 0.82,
      stagger: mobile ? 0.055 : 0.08,
    }, mobile ? 0.88 : 1.22)

  if (!mobile && handImage) {
    gsap.fromTo(handImage,
      { yPercent: -2.5 },
      {
        yPercent: 3.5,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.85,
          invalidateOnRefresh: true,
        },
      })
  }

  return timeline
}

export function initD1101HomeMotion(root, { reducedMotion = false } = {}) {
  if (!(root instanceof HTMLElement)) return () => {}

  const pdfMode = document.documentElement.classList.contains('portfolio-pdf-mode')
  const rect = root.getBoundingClientRect()
  const startsInView = rect.top < window.innerHeight * 0.9 && rect.bottom > 0
  if (reducedMotion || pdfMode || !startsInView) {
    root.dataset.d1101Opening = 'static'
    return () => delete root.dataset.d1101Opening
  }

  const master = root.querySelector('.d1101-homepage-master')
  const titleBackdrop = root.querySelector('.d1101-homepage-title-backdrop')
  const titleClone = root.querySelector('.d1101-homepage-title-clone')
  const veil = root.querySelector('.d1101-homepage-opening-veil')
  if (!master || !titleBackdrop || !titleClone || !veil) return () => {}

  root.dataset.d1101Opening = 'armed'
  const context = gsap.context(() => {
    gsap.set(master, {
      xPercent: -1.4,
      scale: 1.035,
      transformOrigin: '50% 50%',
      willChange: 'transform',
    })
    gsap.set(veil, { display: 'block', autoAlpha: 1, xPercent: 0, willChange: 'transform' })
    gsap.set(titleBackdrop, { display: 'block', autoAlpha: 1 })
    gsap.set(titleClone, {
      display: 'block',
      autoAlpha: 1,
      x: -Math.min(window.innerWidth * 0.075, 126),
      scaleX: 0.68,
      clipPath: TITLE_CLIP_CLOSED,
      transformOrigin: '2.65% 46.6%',
      willChange: 'transform,clip-path',
    })

    gsap.timeline({
      defaults: { force3D: true },
      onComplete: () => {
        gsap.set(master, { clearProps: 'transform,transformOrigin,willChange' })
        gsap.set([titleBackdrop, titleClone, veil], { display: 'none', clearProps: 'transform,transformOrigin,opacity,visibility,clipPath,willChange' })
        root.dataset.d1101Opening = 'complete'
      },
    })
      .to(veil, { xPercent: 101, duration: 1.52, ease: 'power4.inOut' }, 0.12)
      .to(master, { xPercent: 0, scale: 1, duration: 2.05, ease: 'expo.out' }, 0.24)
      .to(titleClone, {
        x: 0,
        scaleX: 1,
        clipPath: TITLE_CLIP,
        duration: 1.3,
        ease: 'expo.out',
      }, 0.96)
      .set([titleBackdrop, titleClone, veil], { display: 'none' }, 2.3)
  }, root)

  return () => {
    context.revert()
    delete root.dataset.d1101Opening
  }
}

export function initD1001LockedMasterMotion(root) {
  if (!(root instanceof HTMLElement)) return () => {}

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pdfMode = document.documentElement.classList.contains('portfolio-pdf-mode')
  root.dataset.d1001Motion = reducedMotion || pdfMode ? 'reduced' : 'premium'
  if (reducedMotion || pdfMode) return () => delete root.dataset.d1001Motion

  const matchMedia = gsap.matchMedia()
  matchMedia.add({
    desktop: '(min-width: 901px) and (prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 900px) and (prefers-reduced-motion: no-preference)',
  }, (context) => {
    const mobile = Boolean(context.conditions?.mobile)
    if (root.classList.contains('d1001-directory')) buildDirectoryMotion(root, mobile)
    if (root.classList.contains('d1001-profile')) buildProfileMotion(root, mobile)
    if (root.classList.contains('d1001-about')) buildAboutMotion(root, mobile)
    return undefined
  })

  let refreshFrame = window.requestAnimationFrame(() => {
    ScrollTrigger.refresh()
    refreshFrame = 0
  })

  return () => {
    if (refreshFrame) window.cancelAnimationFrame(refreshFrame)
    matchMedia.revert()
    delete root.dataset.d1001Motion
  }
}

export default initD1001LockedMasterMotion
