import { gsap } from 'gsap'

const TITLE_CLIP = 'inset(38% 66.6% 44.8% 2.65%)'
const TITLE_CLIP_CLOSED = 'inset(38% 97.8% 44.8% 2.65%)'

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

export default initD1101HomeMotion
