export function initD1001LockedMasterMotion(root) {
  if (!(root instanceof HTMLElement)) return () => {}

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let frame = window.requestAnimationFrame(() => {
    root.dataset.d1001Motion = reducedMotion ? 'reduced' : 'ready'
    frame = 0
  })

  return () => {
    if (frame) window.cancelAnimationFrame(frame)
    delete root.dataset.d1001Motion
  }
}

export default initD1001LockedMasterMotion

