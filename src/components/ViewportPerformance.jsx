import { useEffect } from 'react'

// Keep mounted pages and their navigation geometry; suspend only offscreen
// decorative work. IntersectionObserver avoids scroll-time layout reads.
export default function ViewportPerformance() {
  useEffect(() => {
    const site = document.querySelector('.marlsa-site')
    if (!site) return
    const tracked = new Set()
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.dataset.viewportActive = String(entry.isIntersecting)
    }, { rootMargin: '120px 0px', threshold: 0 })
    const register = () => {
      for (const section of site.children) {
        if (tracked.has(section)) continue
        tracked.add(section)
        observer.observe(section)
      }
      for (const section of tracked) if (!section.isConnected) { observer.unobserve(section); tracked.delete(section) }
    }
    const mutations = new MutationObserver(register)
    mutations.observe(site, { childList: true })
    const visibility = () => site.classList.toggle('is-document-hidden', document.hidden)
    document.addEventListener('visibilitychange', visibility)
    register(); visibility()
    return () => {
      observer.disconnect(); mutations.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      site.classList.remove('is-document-hidden')
      for (const section of tracked) delete section.dataset.viewportActive
    }
  }, [])
  return null
}
