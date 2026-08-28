import { gsap } from 'gsap'

const FINAL_STATE = {
  art: { x: 0, y: 0, scale: 1 },
  visible: { autoAlpha: 1, x: 0, y: 0 },
}

export function initPage02PosterMotion(section) {
  if (!section || !window.matchMedia('(min-width: 901px)').matches) return () => {}

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const canvas = section.querySelector('.kv02-poster-canvas')
  if (!canvas) return () => {}

  const main = canvas.querySelector('.kv02-art-main')
  const upper = canvas.querySelector('.kv02-mask-upper')
  const left = canvas.querySelector('.kv02-mask-left')
  const right = canvas.querySelector('.kv02-mask-right')
  const masks = [upper, left, right]
  const paper = canvas.querySelector('.kv02-paper-plane')
  const blue = canvas.querySelector('.kv02-blue-field')
  const ghost = canvas.querySelector('.kv02-ghost-title')
  const copy = canvas.querySelector('.kv02-poster-copy')
  const metadata = canvas.querySelectorAll('.kv02-vertical-meta, .kv02-bottom-meta, .kv02-field-meta, .kv02-registration')
  const rule = canvas.querySelector('.kv02-bottom-rule')

  const setFinalState = () => {
    gsap.set(main, FINAL_STATE.art)
    gsap.set(masks, { ...FINAL_STATE.art, autoAlpha: 0 })
    gsap.set([paper, blue], { scaleX: 1 })
    gsap.set([ghost, copy, metadata], FINAL_STATE.visible)
    gsap.set(rule, { scaleX: 1 })
    section.dataset.page02Motion = 'complete'
  }

  if (reducedMotion) {
    setFinalState()
    return () => delete section.dataset.page02Motion
  }

  gsap.set(main, { scale: 1.075, x: 24, y: 12, transformOrigin: '52% 46%' })
  gsap.set(upper, { scale: 1.075, x: -18, y: -12, autoAlpha: 0.78, transformOrigin: '52% 46%' })
  gsap.set(left, { scale: 1.075, x: -22, y: 12, autoAlpha: 0.82, transformOrigin: '52% 46%' })
  gsap.set(right, { scale: 1.075, x: 24, y: 8, autoAlpha: 0.82, transformOrigin: '52% 46%' })
  gsap.set(paper, { scaleX: 0.7, transformOrigin: 'right center' })
  gsap.set(blue, { scaleX: 0.08, transformOrigin: 'right center' })
  gsap.set(ghost, { autoAlpha: 0, x: -36 })
  gsap.set(copy, { autoAlpha: 0, x: -28, clipPath: 'inset(0 100% 0 0)' })
  gsap.set(metadata, { autoAlpha: 0, y: 8 })
  gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' })
  section.dataset.page02Motion = 'prepared'

  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: 'power3.out' },
    onStart: () => { section.dataset.page02Motion = 'running' },
    onComplete: setFinalState,
  })

  timeline
    .to(main, { ...FINAL_STATE.art, duration: 0.55, ease: 'power3.inOut' }, 0)
    .to(upper, { ...FINAL_STATE.art, duration: 0.5 }, 0.05)
    .to(left, { ...FINAL_STATE.art, duration: 0.52 }, 0.08)
    .to(right, { ...FINAL_STATE.art, duration: 0.52 }, 0.1)
    .to(masks, { autoAlpha: 0, duration: 0.22, ease: 'power2.out' }, 0.5)
    .to(paper, { scaleX: 1, duration: 0.58 }, 0.45)
    .to(blue, { scaleX: 1, duration: 0.55 }, 0.55)
    .to(ghost, { autoAlpha: 1, x: 0, duration: 0.52 }, 0.8)
    .to(copy, { autoAlpha: 1, x: 0, clipPath: 'inset(0 0% 0 0)', duration: 0.56 }, 0.84)
    .to(rule, { scaleX: 1, duration: 0.36 }, 1.15)
    .to(metadata, { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.035 }, 1.18)

  let observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    observer.disconnect()
    timeline.play(0)
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })

  observer.observe(section)

  return () => {
    observer?.disconnect()
    observer = null
    timeline.kill()
    gsap.set([main, masks, paper, blue, ghost, copy, metadata, rule], { clearProps: 'all' })
    delete section.dataset.page02Motion
  }
}

