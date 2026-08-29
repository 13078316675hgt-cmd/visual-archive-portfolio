import React from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './styles.css'
import './gallery.css'
import './content-layout.css'
import './d02-production-fix.css'
import './d03-spread-edge-fix.css'
import './d03-1-directory-motion.css'
import './d03-3-static-integration-motion.css'
import './end-page-responsive.css'
import './d04-motion-art-direction.css'
import './d05-page02-poster.css'
import './d06-inner-pages.css'
import './d07-desktop-art-direction.css'
import './d08-reference-rebuild.css'
import './approved-motion.css'
import './d09-17r-home-end-restoration.css'
import './d09-19-locked-implementation.css'
import './d09-20-home-static.css'
import './portfolio-pdf.css'
import './performance-loading.css'
import './d10-01-r2-master-integration.css'
import { initArchiveMotion } from './motion/archiveMotion.js'
import { initPage02PosterMotion } from './motion/page02PosterMotion.js'
import { initD06Page03Motion, initD07Page01Motion } from './motion/innerPagesMotion.js'
import { initHomeMotion } from './motion/homeMotion.js'
import {
  AdditionalCharacterDesigns,
  CharacterSheets,
  CostumeDetail,
  PortraitStudies,
  SelectedWorks,
} from './components/ContentPortfolioPages.jsx'
import {
  ApprovedDirectoryMotion,
  ApprovedEndMotion,
  ApprovedPage03Motion,
} from './components/ApprovedMotionPages.jsx'
import { D0919Page01 } from './components/D0919Pages.jsx'
import {
  D1001AboutCreator,
  D1001Directory,
  D1001ProcessWorkflow,
  D1001ProfessionalProfile,
} from './components/D1001LockedMasterPages.jsx'
import {
  PerformancePicture,
  performanceImageAttrs,
} from './components/PerformancePicture.jsx'
import {
  artworkManifest,
  artworkOne,
  artworkThree,
  artworkTwo,
  contentsChapters,
  directoryMasterIntegrated,
  endPageIntegrated,
} from './data/artworkManifest.js'
import resumeContent from './data/resumeContent.js'
import softwareLogoAssets from './data/softwareLogoAssets.js'

const PORTFOLIO_URL_ROUTES = Object.freeze([
  { id: 'title', hash: '', aliases: ['#title'] },
  { id: 'contents', hash: '#contents', aliases: [] },
  { id: 'key-visual-01', hash: '#key-visual-01', aliases: [] },
  { id: 'key-visual-02', hash: '#key-visual-02', aliases: ['#page-02'] },
  { id: 'key-visual-03', hash: '#key-visual-03', aliases: [] },
  { id: 'process-workflow', hash: '#process-workflow', aliases: [] },
  { id: 'character-sheets', hash: '#character-sheets', aliases: [] },
  { id: 'costume-detail', hash: '#costume-detail', aliases: [] },
  { id: 'portrait-studies', hash: '#portrait-studies', aliases: [] },
  { id: 'selected-works', hash: '#selected-works', aliases: [] },
  { id: 'additional-designs', hash: '#additional-designs', aliases: [] },
  { id: 'professional-profile', hash: '#professional-profile', aliases: ['#resume-contact-resume'] },
  { id: 'about-the-creator', hash: '#about-the-creator', aliases: ['#end', '#resume-contact-contact'] },
])

const getPortfolioRouteForHash = (hash) => PORTFOLIO_URL_ROUTES.find((route) => (
  route.hash === hash || route.aliases.includes(hash)
)) || null

function PageMeta({ number, label }) {
  return <div className="page-meta"><span>{label}</span><b>{number}</b></div>
}

function Nav() {
  return <nav className="top-nav" aria-label="作品集章节导航">
    <a href="#title" className="nav-name">SELECTED WORKS</a>
    <div className="nav-links">
      <a href="#contents">CONTENTS</a>
      <a href="#character-sheets">CHARACTER DESIGN</a>
      <a href="#professional-profile">RESUME</a>
      <a href="#about-the-creator">CONTACT</a>
    </div>
  </nav>
}

function usePortfolioMotion() {
  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement
    const mobileMotion = window.matchMedia('(max-width: 900px)').matches

    root.classList.toggle('motion-reduced', reduceMotion)

    const resolveAnchorTarget = (hash) => {
      if (!hash || hash === '#') return false

      let targetId
      try {
        targetId = decodeURIComponent(hash.slice(1))
      } catch {
        return null
      }

      return document.getElementById(targetId)
    }

    const navigateToAnchorOnce = (hash, target = resolveAnchorTarget(hash)) => {
      if (!target) return false

      // Deferred sections replace a fixed-height placeholder after the click.
      // Wait for that commit and then calculate the final document position;
      // otherwise scrollIntoView can land on the old placeholder geometry.
      const settle = (attempt = 0) => {
        const resolved = resolveAnchorTarget(hash) || target
        const isPlaceholder = resolved instanceof Element
          && resolved.classList.contains('performance-section-placeholder')
        if (isPlaceholder && attempt < 8) {
          window.requestAnimationFrame(() => settle(attempt + 1))
          return
        }
        resolved.scrollIntoView({
          block: 'start',
          behavior: 'instant',
        })
        if (resolved instanceof HTMLElement) resolved.focus({ preventScroll: true })
      }

      window.requestAnimationFrame(() => window.requestAnimationFrame(() => settle()))
      return true
    }

    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const requestedHash = window.location.hash
    const requestedRoute = getPortfolioRouteForHash(requestedHash)
    const requestedTarget = requestedHash ? resolveAnchorTarget(requestedHash) : document.getElementById('title')

    if (requestedHash && (!requestedRoute || !requestedTarget)) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
    } else if (requestedHash && requestedTarget) {
      navigateToAnchorOnce(requestedHash, requestedTarget)
    }

    const cleanupArchiveMotion = mobileMotion
      ? initArchiveMotion(document.querySelector('.archive-selection-scene'), { reducedMotion: reduceMotion })
      : () => {}
    const cleanupHomeMotion = initHomeMotion(document.querySelector('#title.home-v9-preview'), { reducedMotion: reduceMotion })

    let routeSyncFrame = 0
    let routeSyncUnlockFrame = 0
    let routeSyncSuspended = Boolean(requestedHash && requestedRoute && requestedTarget)
    const findViewportRoute = () => {
      const probeY = Math.min(window.innerHeight * 0.38, 360)
      return PORTFOLIO_URL_ROUTES.find((route) => {
        const element = document.getElementById(route.id)
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return rect.top <= probeY && rect.bottom > probeY
      }) || null
    }

    const syncViewportRouteToUrl = () => {
      routeSyncFrame = 0
      if (routeSyncSuspended || directoryTransitionFrame) return
      const viewportRoute = findViewportRoute()
      if (!viewportRoute) return
      const currentRoute = getPortfolioRouteForHash(window.location.hash)
      if (currentRoute?.id === viewportRoute.id) return

      const nextUrl = viewportRoute.id === 'title'
        ? `${window.location.pathname}${window.location.search}`
        : `${window.location.pathname}${window.location.search}${viewportRoute.hash}`
      window.history.replaceState(window.history.state, '', nextUrl)
    }

    const scheduleViewportRouteSync = () => {
      window.cancelAnimationFrame(routeSyncFrame)
      routeSyncFrame = window.requestAnimationFrame(syncViewportRouteToUrl)
    }

    const releaseRouteSync = () => {
      window.cancelAnimationFrame(routeSyncUnlockFrame)
      routeSyncUnlockFrame = window.requestAnimationFrame(() => {
        routeSyncSuspended = false
        scheduleViewportRouteSync()
      })
    }

    const navigateHome = (target) => {
      routeSyncSuspended = true
      const shouldReplayHome = Boolean(window.location.hash || window.scrollY > window.innerHeight * 0.6)
      const cleanHomeUrl = window.location.pathname || '/'
      if (window.location.hash || window.location.search) {
        window.history.pushState(null, '', cleanHomeUrl)
      }
      target.scrollIntoView({
        block: 'start',
        behavior: 'instant',
      })
      if (target instanceof HTMLElement) target.focus({ preventScroll: true })
      document.querySelectorAll('.top-nav a[href^="#"]').forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === '#title')
      })
      if (shouldReplayHome) {
        window.dispatchEvent(new CustomEvent('portfolio:home-enter', { detail: { intentional: true } }))
      }
      releaseRouteSync()
      return true
    }

    let directoryTransitionFrame = 0
    const notifyDirectoryTransition = (phase, detail = {}) => {
      window.dispatchEvent(new CustomEvent(`portfolio:directory-transition-${phase}`, { detail }))
    }

    const cancelDirectoryTransition = () => {
      if (!directoryTransitionFrame) return
      window.cancelAnimationFrame(directoryTransitionFrame)
      directoryTransitionFrame = 0
      document.getElementById('title')?.classList.remove('is-directory-transitioning')
      routeSyncSuspended = false
      scheduleViewportRouteSync()
    }

    const navigateToDirectory = (target, { fromHome = false } = {}) => {
      routeSyncSuspended = true
      window.cancelAnimationFrame(directoryTransitionFrame)
      notifyDirectoryTransition('start', { fromHome, reducedMotion: reduceMotion })

      const home = document.getElementById('title')
      const homeRect = home?.getBoundingClientRect()
      const homeIsVisible = Boolean(homeRect && homeRect.bottom > 0 && homeRect.top < window.innerHeight * .4)
      const shouldTransition = fromHome && homeIsVisible && !reduceMotion

      if (!shouldTransition) {
        target.scrollIntoView({ block: 'start', behavior: 'instant' })
        target.focus?.({ preventScroll: true })
        notifyDirectoryTransition('settled', { fromHome: false, reducedMotion: reduceMotion })
        releaseRouteSync()
        return true
      }

      home.classList.add('is-directory-transitioning')
      const startY = window.scrollY
      const scrollMargin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
      const destinationY = Math.max(0, target.getBoundingClientRect().top + startY - scrollMargin)
      const duration = 520
      let startTime = 0

      const finish = () => {
        directoryTransitionFrame = 0
        window.scrollTo({ top: destinationY, left: 0, behavior: 'instant' })
        home.classList.remove('is-directory-transitioning')
        target.focus?.({ preventScroll: true })
        notifyDirectoryTransition('settled', { fromHome: true, duration })
        releaseRouteSync()
      }

      const step = (now) => {
        if (!startTime) startTime = now
        const progress = Math.min(1, (now - startTime) / duration)
        const eased = 1 - ((1 - progress) ** 4)
        window.scrollTo(0, startY + (destinationY - startY) * eased)
        if (progress < 1) directoryTransitionFrame = window.requestAnimationFrame(step)
        else finish()
      }

      directoryTransitionFrame = window.requestAnimationFrame(step)
      return true
    }

    const handleAnchorClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return

      const hash = anchor.getAttribute('href')
      const route = getPortfolioRouteForHash(hash)
      if (route && route.id !== 'title') window.__portfolioEnsureSection?.(route.id)
      const target = resolveAnchorTarget(hash)
      if (!hash || !target) return

      event.preventDefault()
      if (hash !== '#contents') cancelDirectoryTransition()
      if (hash === '#title') {
        navigateHome(target)
        return
      }
      if (window.location.hash !== hash) {
        window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash}`)
      }
      if (hash === '#contents') {
        const home = document.getElementById('title')
        const homeRect = home?.getBoundingClientRect()
        const fromHome = Boolean(anchor.closest('#title') && homeRect && homeRect.bottom > 0 && homeRect.top < window.innerHeight * .4)
        void navigateToDirectory(target, { fromHome })
        return
      }
      routeSyncSuspended = true
      void navigateToAnchorOnce(hash, target)
      releaseRouteSync()
    }

    let historyNavigationFrame = 0
    const handleHistoryNavigation = () => {
      routeSyncSuspended = true
      window.cancelAnimationFrame(historyNavigationFrame)
      historyNavigationFrame = window.requestAnimationFrame(() => {
        historyNavigationFrame = 0
        if (window.location.hash) {
          const route = getPortfolioRouteForHash(window.location.hash)
          if (route && route.id !== 'title') window.__portfolioEnsureSection?.(route.id)
          if (window.location.hash === '#contents') {
            window.dispatchEvent(new CustomEvent('portfolio:directory-history-enter'))
          }
          void navigateToAnchorOnce(window.location.hash)
          if (window.location.hash === '#contents') {
            window.requestAnimationFrame(() => notifyDirectoryTransition('settled', { history: true }))
          }
          releaseRouteSync()
          return
        }
        const home = document.getElementById('title')
        if (home) {
          navigateToAnchorOnce('#title', home)
          window.dispatchEvent(new CustomEvent('portfolio:home-enter', { detail: { history: true } }))
        }
        releaseRouteSync()
      })
    }

    document.addEventListener('click', handleAnchorClick)
    window.addEventListener('popstate', handleHistoryNavigation)
    window.addEventListener('scroll', scheduleViewportRouteSync, { passive: true })
    window.addEventListener('resize', scheduleViewportRouteSync)
    const initialHashFrame = window.requestAnimationFrame(() => {
      releaseRouteSync()
    })

    if (reduceMotion) {
      return () => {
        window.cancelAnimationFrame(initialHashFrame)
        window.cancelAnimationFrame(historyNavigationFrame)
        window.cancelAnimationFrame(directoryTransitionFrame)
        window.cancelAnimationFrame(routeSyncFrame)
        window.cancelAnimationFrame(routeSyncUnlockFrame)
        document.removeEventListener('click', handleAnchorClick)
        window.removeEventListener('popstate', handleHistoryNavigation)
        window.removeEventListener('scroll', scheduleViewportRouteSync)
        window.removeEventListener('resize', scheduleViewportRouteSync)
        window.history.scrollRestoration = previousScrollRestoration
        root.classList.remove('motion-reduced')
        cleanupArchiveMotion()
        cleanupHomeMotion()
      }
    }

    root.classList.add('motion-enabled')

    const touchedNodes = new Set()
    const scenes = []
    const completionTimers = new Set()
    let sceneObserver = null

    const touch = (node) => {
      if (node) touchedNodes.add(node)
      return node
    }

    const scene = (target, name, pattern, duration) => {
      const node = typeof target === 'string' ? document.querySelector(target) : target
      if (!node) return null
      node.setAttribute('data-motion-scene', name)
      node.setAttribute('data-motion-pattern', pattern)
      node.style.setProperty('--scene-duration', `var(${duration})`)
      if (!scenes.includes(node)) scenes.push(node)
      return touch(node)
    }

    const setMotion = (selector, type, options = {}, scope = document) => {
      const nodes = Array.from(scope.querySelectorAll(selector))
      nodes.forEach((node, index) => {
        node.setAttribute('data-motion', type)
        if (options.variant) node.setAttribute('data-motion-variant', options.variant)
        if (options.delay != null || options.stagger || options.mobileDelay != null || options.mobileStagger) {
          const baseDelay = mobileMotion && options.mobileDelay != null ? options.mobileDelay : (options.delay || 0)
          const stagger = mobileMotion && options.mobileStagger != null ? options.mobileStagger : (options.stagger || 0)
          const delay = baseDelay + stagger * index
          const requestedMax = mobileMotion
            ? (options.mobileMaxDelay ?? options.maxDelay ?? 110)
            : (options.maxDelay ?? 140)
          const maxDelay = Math.min(requestedMax, mobileMotion ? 110 : 140)
          node.style.setProperty('--motion-delay', `${Math.min(delay, maxDelay)}ms`)
        }
        touch(node)
      })
      return nodes
    }

    scene('#key-visual-01', 'kv01', 'artwork-sequence', '--motion-section')
    scene('#key-visual-03', 'kv03', 'artwork-static-first', '--motion-standard')
    scene('#process-workflow', 'process', 'section-intro', '--motion-standard')
    scene('#character-sheets', 'sheets', 'artwork-sequence', '--motion-section')
    scene('#costume-detail', 'detail', 'artwork-sequence', '--motion-section')
    scene('#portrait-studies', 'portraits', 'artwork-sequence', '--motion-section')
    scene('#selected-works', 'selected', 'artwork-sequence', '--motion-section')
    scene('#additional-designs', 'additional', 'section-intro', '--motion-section')
    scene('#about-the-creator', 'final', 'contact-ending', '--motion-standard')

    setMotion('.title-rule-a, .title-rule-b', 'registration-rule', { stagger: 40, maxDelay: 80 })
    setMotion('.title-lockup h1 span', 'intro-title', { delay: 80, stagger: 60, maxDelay: 200 })
    setMotion('.title-lockup h2, .title-lockup p, .title-contact a, .title-contact p, .title-meta span', 'intro-meta', { delay: 220, stagger: 40, maxDelay: 240 })
    setMotion('.title-cobalt-field', 'intro-field')
    setMotion('.title-scan', 'intro-panel', { stagger: 40, maxDelay: 120 })
    setMotion('.key-visual-page:not(.key-visual-two) .kv-number-row', 'section-title')
    setMotion('.key-visual-page:not(.key-visual-two) .kv-title-rule', 'registration-rule', { delay: 40 })
    setMotion('.key-visual-page:not(.key-visual-two) .kv-title-copy', 'section-copy', { delay: 80 })
    setMotion('.key-visual-one .kv-main', 'artwork-primary', { variant: 'diagonal', delay: 40 })
    setMotion('.key-visual-one .kv-red-shape, .key-visual-one .kv-local-plane, .key-visual-one .kv-rule, .key-visual-one .kv-mark', 'registration-detail', { delay: 160, stagger: 40, maxDelay: 240 })
    setMotion('.key-visual-three .kv-red-shape, .key-visual-three .kv-local-plane, .key-visual-three .kv-rule, .key-visual-three .kv-mark', 'registration-detail', { delay: 80, stagger: 40, maxDelay: 140 })

    setMotion('.editorial-head span, .editorial-head h2', 'section-title', { stagger: 40, maxDelay: 80 })
    setMotion('.editorial-head p', 'section-copy', { delay: 80 })
    setMotion('.sheet-main', 'artwork-primary', { delay: 40 })
    setMotion('.sheet-support', 'artwork-support', { delay: 100, stagger: 40, maxDelay: 220 })
    setMotion('.costume-primary', 'artwork-primary', { delay: 40 })
    setMotion('.detail-crop', 'artwork-support', { delay: 120, stagger: 50, maxDelay: 220 })
    setMotion('.portrait-item', 'artwork-support', { delay: 40, stagger: 70, maxDelay: 120 })
    setMotion('.selected-primary img', 'artwork-primary', { delay: 80, mobileDelay: 40 })
    setMotion('.selected-primary figcaption', 'section-copy', { delay: 160, mobileDelay: 100 })
    setMotion('.selected-support img', 'artwork-support', { delay: 240, stagger: 80, maxDelay: 320, mobileDelay: 160, mobileStagger: 60, mobileMaxDelay: 220 })
    setMotion('.selected-support figcaption', 'section-copy', { delay: 340, stagger: 60, maxDelay: 400, mobileDelay: 200, mobileStagger: 40, mobileMaxDelay: 240 })
    setMotion('.additional-item', 'artwork-support', { delay: 60, stagger: 40, maxDelay: 220 })

    setMotion('.end-page-image', 'end-page-field')
    setMotion('.end-page-hotspot-anchor', 'end-page-control', { delay: 680, stagger: 90, maxDelay: 770, mobileDelay: 520, mobileStagger: 70, mobileMaxDelay: 590 })
    setMotion('.page-meta', 'micro-copy', { delay: 160 })
    setMotion('.selected .page-meta', 'micro-copy', { delay: 400, mobileDelay: 240, mobileMaxDelay: 240 })

    const activateScene = (node) => {
      if (node.classList.contains('is-inview')) return
      node.classList.add('is-inview')
      const completionDelay = window.matchMedia('(max-width: 900px)').matches ? 460 : 520
      const timer = window.setTimeout(() => {
        node.classList.add('is-complete')
        completionTimers.delete(timer)
      }, completionDelay)
      completionTimers.add(timer)
    }

    sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        activateScene(entry.target)
        sceneObserver.unobserve(entry.target)
      })
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' })

    const armScene = (node) => {
      if (!node || node.classList.contains('is-inview')) return
      sceneObserver.observe(node)
      const rect = node.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        activateScene(node)
        sceneObserver.unobserve(node)
      }
    }

    scenes.forEach((node) => sceneObserver.observe(node))

    requestAnimationFrame(() => {
      scenes.forEach((node) => {
        armScene(node)
      })
    })

    const registerMountedSectionMotion = (section) => {
      if (!(section instanceof HTMLElement)) return
      const id = section.id
      let mountedScene = null

      if (id === 'key-visual-01') {
        mountedScene = scene(section, 'kv01', 'artwork-sequence', '--motion-section')
        setMotion('.kv-number-row', 'section-title', {}, section)
        setMotion('.kv-title-rule', 'registration-rule', { delay: 40 }, section)
        setMotion('.kv-title-copy', 'section-copy', { delay: 80 }, section)
        setMotion('.kv-main', 'artwork-primary', { variant: 'diagonal', delay: 40 }, section)
        setMotion('.kv-red-shape, .kv-local-plane, .kv-rule, .kv-mark', 'registration-detail', {
          delay: 160,
          stagger: 40,
          maxDelay: 240,
        }, section)
      } else if (id === 'key-visual-03') {
        mountedScene = scene(section, 'kv03', 'artwork-static-first', '--motion-standard')
        setMotion('.kv-number-row', 'section-title', {}, section)
        setMotion('.kv-title-rule', 'registration-rule', { delay: 40 }, section)
        setMotion('.kv-title-copy', 'section-copy', { delay: 80 }, section)
        setMotion('.kv-red-shape, .kv-local-plane, .kv-rule, .kv-mark', 'registration-detail', {
          delay: 80,
          stagger: 40,
          maxDelay: 140,
        }, section)
      } else if (id === 'character-sheets') {
        mountedScene = scene(section, 'sheets', 'artwork-sequence', '--motion-section')
        setMotion('.editorial-head span, .editorial-head h2', 'section-title', { stagger: 40, maxDelay: 80 }, section)
        setMotion('.editorial-head p', 'section-copy', { delay: 80 }, section)
        setMotion('.sheet-main', 'artwork-primary', { delay: 40 }, section)
        setMotion('.sheet-support', 'artwork-support', { delay: 100, stagger: 40, maxDelay: 220 }, section)
      } else if (id === 'costume-detail') {
        mountedScene = scene(section, 'detail', 'artwork-sequence', '--motion-section')
        setMotion('.editorial-head span, .editorial-head h2', 'section-title', { stagger: 40, maxDelay: 80 }, section)
        setMotion('.editorial-head p', 'section-copy', { delay: 80 }, section)
        setMotion('.costume-primary', 'artwork-primary', { delay: 40 }, section)
        setMotion('.detail-crop', 'artwork-support', { delay: 120, stagger: 50, maxDelay: 220 }, section)
      } else if (id === 'portrait-studies') {
        mountedScene = scene(section, 'portraits', 'artwork-sequence', '--motion-section')
        setMotion('.editorial-head span, .editorial-head h2', 'section-title', { stagger: 40, maxDelay: 80 }, section)
        setMotion('.editorial-head p', 'section-copy', { delay: 80 }, section)
        setMotion('.portrait-item', 'artwork-support', { delay: 40, stagger: 70, maxDelay: 120 }, section)
      } else if (id === 'selected-works') {
        mountedScene = scene(section, 'selected', 'artwork-sequence', '--motion-section')
        setMotion('.editorial-head span, .editorial-head h2', 'section-title', { stagger: 40, maxDelay: 80 }, section)
        setMotion('.editorial-head p', 'section-copy', { delay: 80 }, section)
        setMotion('.selected-primary img', 'artwork-primary', { delay: 80, mobileDelay: 40 }, section)
        setMotion('.selected-primary figcaption', 'section-copy', { delay: 160, mobileDelay: 100 }, section)
        setMotion('.selected-support img', 'artwork-support', {
          delay: 240,
          stagger: 80,
          maxDelay: 320,
          mobileDelay: 160,
          mobileStagger: 60,
          mobileMaxDelay: 220,
        }, section)
        setMotion('.selected-support figcaption', 'section-copy', {
          delay: 340,
          stagger: 60,
          maxDelay: 400,
          mobileDelay: 200,
          mobileStagger: 40,
          mobileMaxDelay: 240,
        }, section)
      } else if (id === 'additional-designs') {
        mountedScene = scene(section, 'additional', 'section-intro', '--motion-section')
        setMotion('.editorial-head span, .editorial-head h2', 'section-title', { stagger: 40, maxDelay: 80 }, section)
        setMotion('.editorial-head p', 'section-copy', { delay: 80 }, section)
        setMotion('.additional-item', 'artwork-support', { delay: 60, stagger: 40, maxDelay: 220 }, section)
      } else if (id === 'professional-profile') {
        mountedScene = scene(section, 'profile', 'section-intro', '--motion-standard')
      } else if (id === 'about-the-creator') {
        mountedScene = scene(section, 'final', 'contact-ending', '--motion-standard')
      }

      setMotion('.page-meta', 'micro-copy', { delay: 160 }, section)
      if (mountedScene) armScene(mountedScene)
    }

    const handleDeferredSectionMounted = (event) => {
      const section = event.detail?.section || document.getElementById(event.detail?.id)
      registerMountedSectionMotion(section)
    }

    window.__portfolioRegisterMountedSection = registerMountedSectionMotion
    window.addEventListener('portfolio:section-mounted', handleDeferredSectionMounted)

    const navLinks = Array.from(document.querySelectorAll('.top-nav a[href^="#"]'))
    const navMap = new Map(navLinks.map((link) => [link.getAttribute('href'), link]))
    const setActiveNav = (href) => {
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === href)
      })
    }

    const activeTargets = [
      ['#title', '#title'],
      ['#contents', '#contents'],
      ['#character-sheets', '#character-sheets'],
      ['#costume-detail', '#character-sheets'],
      ['#portrait-studies', '#character-sheets'],
      ['#selected-works', '#character-sheets'],
      ['#additional-designs', '#character-sheets'],
      ['#professional-profile', '#professional-profile'],
      ['#about-the-creator', '#about-the-creator'],
    ].map(([selector, href]) => {
      const node = document.querySelector(selector)
      return node && navMap.has(href) ? { node, href } : null
    }).filter(Boolean)

    const navObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0]
      const match = activeTargets.find((target) => target.node === visible?.target)
      if (match) setActiveNav(match.href)
    }, { threshold: 0.18, rootMargin: '-18% 0px -58% 0px' })

    activeTargets.forEach(({ node }) => navObserver.observe(node))
    setActiveNav('#title')

    return () => {
      window.cancelAnimationFrame(initialHashFrame)
      window.cancelAnimationFrame(historyNavigationFrame)
      window.cancelAnimationFrame(directoryTransitionFrame)
      window.cancelAnimationFrame(routeSyncFrame)
      window.cancelAnimationFrame(routeSyncUnlockFrame)
      document.removeEventListener('click', handleAnchorClick)
      window.removeEventListener('popstate', handleHistoryNavigation)
      window.removeEventListener('scroll', scheduleViewportRouteSync)
      window.removeEventListener('resize', scheduleViewportRouteSync)
      window.removeEventListener('portfolio:section-mounted', handleDeferredSectionMounted)
      if (window.__portfolioRegisterMountedSection === registerMountedSectionMotion) {
        delete window.__portfolioRegisterMountedSection
      }
      window.history.scrollRestoration = previousScrollRestoration
      sceneObserver.disconnect()
      navObserver.disconnect()
      completionTimers.forEach((timer) => window.clearTimeout(timer))
      completionTimers.clear()
      root.classList.remove('motion-enabled')
      root.classList.remove('motion-reduced')
      navLinks.forEach((link) => link.classList.remove('is-active'))
      cleanupArchiveMotion()
      cleanupHomeMotion()
      scenes.forEach((node) => {
        node.classList.remove('is-inview', 'is-complete')
        node.removeAttribute('data-motion-scene')
        node.removeAttribute('data-motion-pattern')
        node.style.removeProperty('--scene-duration')
      })
      touchedNodes.forEach((node) => {
        node.removeAttribute('data-motion')
        node.removeAttribute('data-motion-variant')
        node.style.removeProperty('--motion-delay')
      })
    }
  }, [])
}

function TitleSection() {
  const { width, height } = getAssetDimensions(artworkManifest.titleBackground)
  return <section id="title" className="title-page">
    <Nav />
    <i className="title-cobalt-field" aria-hidden="true" />
    <i className="title-checker title-print-orb title-print-orb-a" aria-hidden="true" />
    <i className="title-print-orb title-print-orb-b" aria-hidden="true" />
    <div className="title-band title-collage" aria-hidden="true">
      <i className="title-art title-art-main title-scan title-scan-a"><img src={artworkManifest.titleBackground.src} alt="" loading="eager" decoding="async" fetchPriority="high" width={width} height={height} /></i>
      <i className="title-art title-art-side title-scan title-scan-b"><img src={artworkManifest.titleBackground.src} alt="" loading="eager" decoding="async" width={width} height={height} /></i>
      <i className="title-art title-art-tertiary title-scan title-scan-c"><img src={artworkManifest.titleBackground.src} alt="" loading="eager" decoding="async" width={width} height={height} /></i>
      <i className="title-art title-art-quaternary title-scan title-scan-d"><img src={artworkManifest.titleBackground.src} alt="" loading="eager" decoding="async" width={width} height={height} /></i>
    </div>
    <i className="title-rule title-rule-a" aria-hidden="true" />
    <i className="title-rule title-rule-b" aria-hidden="true" />
    <i className="title-rule title-rule-c" aria-hidden="true" />
    <i className="title-signal" aria-hidden="true" />
    <i className="title-strokes" aria-hidden="true"><b /><b /><b /><b /></i>
    <div className="title-lockup">
      <h1><span>SELECTED</span><span>WORKS</span><span>2026</span></h1>
      <h2>CHARACTER CONCEPT ARTIST</h2>
      <p>CHARACTER ART PORTFOLIO</p>
    </div>
    <div className="title-meta" aria-label="Title metadata">
      <span>01 / TITLE</span>
      <span>PORTFOLIO INDEX</span>
      <span>CHARACTER ART</span>
      <span>X 23.47 / Y 06.12</span>
    </div>
  </section>
}

function HomeV9Preview() {
  const base = import.meta.env.BASE_URL
  const homeAsset = `${base}assets/home-v9/home-v9-blue-archive-master.png`

  return <section id="title" className="home-v9-preview d0920-home-static" data-home-visual="v9master" tabIndex={-1}>
    <div className="d0920-home-canvas">
      <div className="d0920-home-art home-v9-artwork" aria-hidden="true">
        <div className="home-v9-mother-base" data-home-base>
          <img src={homeAsset} alt="" width="2000" height="1125" loading="eager" decoding="async" fetchPriority="high" draggable="false" />
        </div>
        <i className="home-v9-layer-environment" aria-hidden="true" />
        <i className="home-v9-layer-subject" aria-hidden="true" />
        <i className="home-v9-layer-foreground" aria-hidden="true" />
        <i className="home-v9-blue-wipe" aria-hidden="true" />
      </div>

      <a className="d0920-home-brand" href="#contents" aria-label="Open portfolio directory">
        <svg viewBox="0 0 64 56" aria-hidden="true">
          <g>
            <rect x="28" y="0" width="8" height="8" />
            <rect x="20" y="8" width="8" height="8" />
            <rect x="36" y="8" width="8" height="8" />
            <rect x="16" y="16" width="8" height="8" />
            <rect x="40" y="16" width="8" height="8" />
            <rect x="12" y="24" width="8" height="8" />
            <rect x="44" y="24" width="8" height="8" />
            <rect x="8" y="32" width="8" height="8" />
            <rect x="48" y="32" width="8" height="8" />
            <rect x="4" y="40" width="8" height="8" />
            <rect x="52" y="40" width="8" height="8" />
            <rect x="4" y="48" width="56" height="8" />
            <rect x="28" y="18" width="8" height="18" />
            <rect x="28" y="40" width="8" height="8" />
          </g>
        </svg>
        <strong>ARCHIVE STUDIO</strong>
        <span>VISUAL DESIGN &amp; ART DIRECTION</span>
      </a>

      <header className="d0920-home-copy home-v9-copy">
        <h1 lang="zh-CN">个人作品集</h1>
        <p className="d1001-home-copy-zh" lang="zh-CN">视觉设计 · 插画创作 · 艺术指导</p>
        <p className="d1001-home-copy-en">VISUAL DESIGN&nbsp;&nbsp;/&nbsp;&nbsp;ILLUSTRATION&nbsp;&nbsp;/&nbsp;&nbsp;ART DIRECTION</p>
      </header>

      <div className="d0920-home-projects">
        <h2><span aria-hidden="true">+</span> SELECTED WORKS</h2>
        <strong>SELECTED WORKS</strong>
        <p lang="zh-CN">整理思绪，记录灵感。<br />用视觉语言，探索无限可能。</p>
      </div>

      <a className="d0920-home-top-link" href="#contents">
        <span>PORTFOLIO</span>
        <strong>SELECTED WORKS</strong>
        <i aria-hidden="true" />
      </a>
      <p className="d0920-home-discipline" aria-hidden="true">DESIGN&nbsp;&nbsp;/&nbsp;&nbsp;ILLUSTRATION&nbsp;&nbsp;/&nbsp;&nbsp;ART DIRECTION</p>
      <a className="d0920-home-scroll home-v9-scroll" href="#contents"><i aria-hidden="true" /><span>SCROLL TO EXPLORE</span><b aria-hidden="true" /></a>
      <p className="d0920-home-page-index home-v9-index"><b>01</b><i>/</i><span>PORTFOLIO</span></p>
      <p className="d0920-home-total home-v9-coordinate"><b>01</b><i>/ 12</i><span aria-hidden="true" /></p>
    </div>
  </section>
}


const DIRECTORY_CARDS = Object.freeze([
  { number: '01', title: 'KEY VISUALS', href: contentsChapters[0].href, position: 'left-01' },
  { number: '02', title: 'CHARACTERS', href: contentsChapters[1].href, position: 'left-02' },
  { number: '03', title: 'CONCEPT ART', href: contentsChapters[2].href, position: 'left-03' },
  { number: '04', title: 'CHARACTER SHEETS', href: contentsChapters[3].href, position: 'left-04' },
  { number: '05', title: 'COSTUME CONSTRUCTION', titleLines: ['COSTUME', 'CONSTRUCTION'], href: contentsChapters[4].href, position: 'right-05' },
  { number: '06', title: 'IDENTITY & EXPRESSION', titleLines: ['IDENTITY &', 'EXPRESSION'], href: contentsChapters[5].href, secondaryTitle: 'Character Presentation', secondaryHref: '#selected-works', position: 'right-06' },
  { number: '07', title: 'CHARACTER DESIGN ARCHIVE', titleLines: ['CHARACTER DESIGN', 'ARCHIVE'], href: contentsChapters[6].href, position: 'right-07' },
  { number: 'END', title: 'ABOUT / CONTACT', href: '#end', position: 'right-end', motionChapter: '09' },
])

function DirectoryCardContent({ card }) {
  return <span className="directory-card-content">
    <span className="archive-route-anchor directory-card-hit" aria-hidden="true" />
    <span className="directory-card-number">{card.number}</span>
    <span className="directory-card-marks" aria-hidden="true"><i /><i /><i /><i /></span>
    <strong className="directory-card-title">
      {(card.titleLines || [card.title]).map((line) => <span className="directory-card-title-line" key={line}>{line}</span>)}
    </strong>
    <span className="directory-card-arrow" aria-hidden="true">→</span>
    <span className="directory-card-corner" aria-hidden="true" />
    <span className="directory-card-confirm-rule" aria-hidden="true" />
  </span>
}

function DirectoryCard({ card }) {
  const className = `directory-card directory-card-${card.position} archive-route-node`
  if (card.secondaryHref) {
    return <article className={`${className} directory-card-dual`} data-chapter={card.number}>
      <a className="directory-card-primary" href={card.href} aria-label={`${card.number} ${card.title}`}>
        <DirectoryCardContent card={card} />
      </a>
      <a className="directory-card-secondary" href={card.secondaryHref}>Character Presentation <span aria-hidden="true">→</span></a>
    </article>
  }

  return <a className={className} href={card.href} data-chapter={card.motionChapter || card.number} aria-label={`${card.number} ${card.title}`}>
    <DirectoryCardContent card={card} />
  </a>
}

function ContentsSection() {
  const { width, height } = getAssetDimensions(directoryMasterIntegrated)
  const directoryImageProps = {
    src: directoryMasterIntegrated.src,
    width,
    height,
    loading: 'eager',
    decoding: 'async',
  }

  return <section
    id="contents"
    className="contents archive-route archive-selection-scene d01-directory page"
    data-contents-visual="d04-locked-mother-image"
    data-directory-motion="d08-local-editorial-assembly"
    data-archive-motion-ready="true"
    data-archive-phase="initial"
  >
    <ApprovedDirectoryMotion />
    <div className="directory-stage">
      <div className="directory-motion-parent">
        <div className="directory-d08-visual" aria-hidden="true">
          <figure className="directory-d08-image-field">
            <img {...directoryImageProps} alt="" />
            <span className="directory-d08-reveal directory-d08-reveal-cube" />
            <span className="directory-d08-reveal directory-d08-reveal-membrane" />
            <span className="directory-d08-reveal directory-d08-reveal-platform" />
          </figure>
          <i className="directory-d08-axis directory-d08-axis-x" />
          <i className="directory-d08-axis directory-d08-axis-y" />
          <div className="directory-d08-caption">
            <span>ARCHIVE PLATE / 01—END</span>
            <b>SELECTED<br />WORKS</b>
          </div>
        </div>
        <div className="directory-image-frame">
          <img
            className="directory-master-image"
            src={directoryMasterIntegrated.src}
            alt={directoryMasterIntegrated.alt}
            width={width}
            height={height}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <nav className="directory-card-layer" aria-label="作品集目录">
          {DIRECTORY_CARDS.map((card) => <DirectoryCard card={card} key={card.number} />)}
        </nav>
      </div>
      <header className="directory-heading">
        <span>CONTENTS</span>
        <strong><span>VISUAL</span>{' '}<span>ARCHIVE</span></strong>
        <small>SELECT YOUR DESTINATION</small>
      </header>
      <div className="directory-d08-index" aria-hidden="true">
        <b>01—07</b>
        <span>SELECTED WORKS / DIRECTORY</span>
      </div>
      <div className="directory-d08-registration" aria-hidden="true"><i /><i /><i /></div>
      <a className="directory-return" href="#title">RETURN / TITLE</a>
    </div>
  </section>
}

function KeyVisualPage({ id, number, title, asset, variant }) {
  return <section id={id} className={`key-visual-page key-visual-${variant} page`}>
    {variant === 'two' ? <span id="page-02" className="page-deep-link-alias" aria-hidden="true" /> : null}
    <div className="kv-meta kv-title-module">
      <div className="kv-number-row">
        <b>{number}</b>
        <i className="kv-title-rule" aria-hidden="true" />
      </div>
      <div className="kv-title-copy">
        <h2>{title}</h2>
        <p>CHARACTER ILLUSTRATION</p>
      </div>
    </div>
    <figure className="kv-main">
      <img
        {...imageAttrs(asset)}
        alt={asset.alt}
        loading={id === 'key-visual-01' ? 'eager' : 'lazy'}
        decoding="async"
      />
      {variant !== 'three' ? <span className="motion-curtain" aria-hidden="true" /> : null}
    </figure>
    <div className="kv-red-shape" aria-hidden="true" />
    <div className="kv-local-plane" aria-hidden="true" />
    <div className="kv-rule kv-rule-a" aria-hidden="true" />
    <div className="kv-rule kv-rule-b" aria-hidden="true" />
    <div className="kv-mark kv-mark-a" aria-hidden="true">+</div>
    <div className="kv-mark kv-mark-b" aria-hidden="true">{number}</div>
    <PageMeta number={number} label={title} />
  </section>
}

function getAssetDimensions(asset) {
  const [width, height] = asset.resolution.split(/\s*[x脳]\s*/).map(Number)
  return { width, height }
}

function KeyVisualOne() {
  const sectionRef = useRef(null)
  useLayoutEffect(() => initD07Page01Motion(sectionRef.current), [])

  return <section ref={sectionRef} id="key-visual-01" className="key-visual-page key-visual-one page d07-page01 d08-page01" data-d07-page="01" data-d08-page="01">
    <div className="d08-page01-desktop">
      <div className="d08-page01-color-plane" aria-hidden="true" />
      <figure className="d08-page01-art">
        <img {...imageAttrs(artworkOne)} alt={artworkOne.alt} loading="eager" decoding="async" fetchPriority="high" />
        <span className="d08-page01-reveal d08-page01-reveal-upper" aria-hidden="true" />
        <span className="d08-page01-reveal d08-page01-reveal-lower" aria-hidden="true" />
      </figure>
      <header className="d08-page01-heading">
        <p>VISUAL ARCHIVE / OPENING PLATE</p>
        <h2><span>KEY</span><span>VISUAL</span></h2>
        <small>CHARACTER ILLUSTRATION / SINGLE WORK</small>
      </header>
      <div className="d08-page01-index" aria-label="01 / KEY VISUAL"><span>01</span><i /></div>
      <p className="d08-page01-side-meta">DRAGON / ARCHITECTURE / CHARACTER</p>
      <i className="d08-page01-cross-axis d08-page01-cross-axis-x" aria-hidden="true" />
      <i className="d08-page01-cross-axis d08-page01-cross-axis-y" aria-hidden="true" />
    </div>
    <div className="d07-page01-legacy">
      <div className="kv-meta kv-title-module">
        <div className="kv-number-row"><b>01</b><i className="kv-title-rule" aria-hidden="true" /></div>
        <div className="kv-title-copy"><h2>KEY VISUAL 01</h2><p>CHARACTER ILLUSTRATION</p></div>
      </div>
      <figure className="kv-main">
        <img {...imageAttrs(artworkOne)} alt={artworkOne.alt} loading="eager" decoding="async" />
        <span className="motion-curtain" aria-hidden="true" />
      </figure>
      <div className="kv-red-shape" aria-hidden="true" />
      <div className="kv-local-plane" aria-hidden="true" />
      <div className="kv-rule kv-rule-a" aria-hidden="true" />
      <div className="kv-rule kv-rule-b" aria-hidden="true" />
      <div className="kv-mark kv-mark-a" aria-hidden="true">+</div>
      <div className="kv-mark kv-mark-b" aria-hidden="true">01</div>
      <PageMeta number="01" label="KEY VISUAL 01" />
    </div>
  </section>
}

function KeyVisualThree() {
  const sectionRef = useRef(null)
  const asset = artworkThree

  useLayoutEffect(() => initD06Page03Motion(sectionRef.current), [])

  return <section ref={sectionRef} id="key-visual-03" className="key-visual-page key-visual-three page d06-page03 d08-page03" data-d06-page="03" data-d08-page="03">
    <ApprovedPage03Motion />
    <div className="d06-desktop-layout d08-page03-canvas">
      <div className="d08-page03-green-field" aria-hidden="true" />
      <div className="d08-page03-orbit d08-page03-orbit-a" aria-hidden="true" />
      <div className="d08-page03-orbit d08-page03-orbit-b" aria-hidden="true" />
      <figure className="d08-page03-art">
        <img {...imageAttrs(asset)} alt={asset.alt} loading="eager" decoding="async" className="d06-critical-art" />
      </figure>
      <div className="d08-page03-ribbon d08-page03-ribbon-a" aria-hidden="true" />
      <div className="d08-page03-ribbon d08-page03-ribbon-b" aria-hidden="true" />
      <div className="d08-page03-lower-wave" aria-hidden="true" />
      <header className="d08-page03-copy">
        <span>03 / CHARACTER ILLUSTRATION</span>
        <h2><span>KEY</span><span>VISUAL</span></h2>
        <p>GREEN DRAGON / CHARACTER STUDY</p>
      </header>
      <div className="d08-page03-index"><b>03</b><span>ARTWORK 03 / 1800 × 1996</span></div>
      <p className="d08-page03-side">FORM / RIBBON / SILHOUETTE</p>
    </div>

    <div className="d06-mobile-legacy">
      <div className="kv-meta kv-title-module">
        <div className="kv-number-row"><b>03</b><i className="kv-title-rule" aria-hidden="true" /></div>
        <div className="kv-title-copy"><h2>KEY VISUAL 03</h2><p>CHARACTER ILLUSTRATION</p></div>
      </div>
      <figure className="kv-main"><img {...imageAttrs(asset)} alt={asset.alt} loading="lazy" decoding="async" /></figure>
      <div className="kv-red-shape" aria-hidden="true" />
      <div className="kv-local-plane" aria-hidden="true" />
      <div className="kv-rule kv-rule-a" aria-hidden="true" />
      <div className="kv-rule kv-rule-b" aria-hidden="true" />
      <div className="kv-mark kv-mark-a" aria-hidden="true">+</div>
      <div className="kv-mark kv-mark-b" aria-hidden="true">03</div>
      <PageMeta number="03" label="KEY VISUAL 03" />
    </div>
  </section>
}

function Page02Poster() {
  const sectionRef = useRef(null)
  const asset = artworkTwo

  useLayoutEffect(() => initPage02PosterMotion(sectionRef.current), [])

  return <section ref={sectionRef} id="key-visual-02" className="key-visual-page key-visual-two kv02-poster page">
    <span id="page-02" className="page-deep-link-alias" aria-hidden="true" />

    <div className="kv02-poster-canvas">
      <div className="kv02-blue-field" aria-hidden="true" />
      <div className="kv02-paper-plane" aria-hidden="true" />
      <div className="kv02-ghost-title" aria-hidden="true">
        <span>CHARACTER</span>
        <span>ARCHIVE</span>
      </div>

      <div className="kv02-art-field">
        <img
          className="kv02-art kv02-art-main"
          {...imageAttrs(asset)}
          alt={asset.alt}
          loading="eager"
          decoding="async"
        />
        <div className="kv02-art-mask kv02-mask-upper" aria-hidden="true">
          <img className="kv02-art" {...imageAttrs(asset)} alt="" loading="eager" decoding="async" />
        </div>
        <div className="kv02-art-mask kv02-mask-left" aria-hidden="true">
          <img className="kv02-art" {...imageAttrs(asset)} alt="" loading="eager" decoding="async" />
        </div>
        <div className="kv02-art-mask kv02-mask-right" aria-hidden="true">
          <img className="kv02-art" {...imageAttrs(asset)} alt="" loading="eager" decoding="async" />
        </div>
      </div>

      <header className="kv02-poster-copy">
        <p className="kv02-poster-index">02 / POSTER PLATE <i aria-hidden="true" /></p>
        <h2><span>KEY VISUAL</span><span>NO. 02</span></h2>
        <p className="kv02-poster-subtitle">CHARACTER ILLUSTRATION / SINGLE WORK<br />BLACK · WHITE · BLUE · SIGNAL RED</p>
      </header>

      <p className="kv02-vertical-meta">VISUAL ARCHIVE / CHARACTER CONCEPT</p>
      <p className="kv02-bottom-meta">ARTWORK 02 / 1800 × 2326</p>
      <p className="kv02-field-meta">FIELD 02 / FINAL POSTER</p>
      <i className="kv02-bottom-rule" aria-hidden="true" />
      <i className="kv02-registration" aria-hidden="true" />
    </div>

    <div className="kv02-mobile-legacy">
      <div className="kv-meta kv-title-module">
        <div className="kv-number-row">
          <b>02</b>
          <i className="kv-title-rule" aria-hidden="true" />
        </div>
        <div className="kv-title-copy">
          <h2>KEY VISUAL 02</h2>
          <p>CHARACTER ILLUSTRATION</p>
        </div>
      </div>
      <figure className="kv-main">
        <img {...imageAttrs(asset)} alt={asset.alt} loading="lazy" decoding="async" />
        <span className="motion-curtain" aria-hidden="true" />
      </figure>
      <div className="kv-red-shape" aria-hidden="true" />
      <div className="kv-local-plane" aria-hidden="true" />
      <div className="kv-rule kv-rule-a" aria-hidden="true" />
      <div className="kv-rule kv-rule-b" aria-hidden="true" />
      <div className="kv-mark kv-mark-a" aria-hidden="true">+</div>
      <div className="kv-mark kv-mark-b" aria-hidden="true">02</div>
      <PageMeta number="02" label="KEY VISUAL 02" />
    </div>
  </section>
}

function imageAttrs(asset) {
  const { width, height } = getAssetDimensions(asset)
  return {
    ...performanceImageAttrs(asset, {
      disabled: document.documentElement.classList.contains('portfolio-pdf-mode'),
    }),
    width,
    height,
  }
}

const END_PAGE_HOTSPOTS = Object.freeze({
  returnToBeginning: { left: '92.34%', top: '76.73%', width: '3.23%', height: '5.74%' },
})

function EndPageSection() {
  const { width, height } = getAssetDimensions(endPageIntegrated)
  const { contact, identity, website } = resumeContent

  return <section id="end" className="end-page page d08-end d09-17r-end-restored" aria-label="Portfolio ending">
    <div className="end-page-stage">
      <div className="end-page-artwork-field">
        <PerformancePicture
          sourceKey="end-page-integrated"
          widths={[960, 1600, 2560]}
          fallback={endPageIntegrated.src}
          sizes="100vw"
          disabled={document.documentElement.classList.contains('portfolio-pdf-mode')}
          className="end-page-image"
          alt={endPageIntegrated.alt}
          width={width}
          height={height}
          loading="eager"
          decoding="async"
        />

        <div className="d09-17r-end-visual-stage" aria-hidden="true" inert>
          <ApprovedEndMotion />
        </div>

        <div className="end-d08-hand-motion" aria-hidden="true">
          <span className="end-d08-hand-veil end-d08-hand-veil-upper" />
          <span className="end-d08-hand-veil end-d08-hand-veil-lower" />
          <span className="end-d08-hand-scan end-d08-hand-scan-upper" />
          <span className="end-d08-hand-scan end-d08-hand-scan-lower" />
          <i className="end-d08-signal-bridge" />
          <i className="end-d08-signal-core" />
        </div>

        <div className="end-d08-cleanup" aria-hidden="true">
          <i className="end-d08-clean end-d08-clean-e" />
          <i className="end-d08-clean end-d08-clean-n" />
          <i className="end-d08-clean end-d08-clean-t" />
          <i className="end-d08-clean end-d08-clean-d" />
        </div>

        <span className="end-page-hotspot-anchor end-page-return-anchor" style={END_PAGE_HOTSPOTS.returnToBeginning}>
          <a className="end-page-hotspot end-page-return-hotspot" href="#title" aria-label="Return to beginning">
            <span>RETURN TO BEGINNING</span>
          </a>
        </span>
      </div>

      <div className="d09-17r-end-content">
        <div className="d09-17r-final-chapter-label" aria-label="Final chapter">
          <span>09 / FINAL CONTACT</span>
          <span>RESUME + CONTACT</span>
        </div>

        <div className="d09-17r-final-identity">
          <h2>{identity.name}</h2>
          <p>{identity.title}</p>
        </div>

        <div id="resume-contact-resume" className="d09-17r-resume resume-anchor">
          <p className="d09-17r-resume-profile">{website.profile}</p>
          <div className="d09-17r-resume-facts">
            <p><span>LOCATION</span>{website.facts.location}</p>
            <p><span>EDUCATION</span>{website.facts.education.school}<br />{website.facts.education.major}</p>
            <p><span>FOCUS</span>{website.facts.focus}</p>
          </div>
          <div className="d09-17r-resume-experience">
            <h3>EXPERIENCE</h3>
            {website.experience.map((item) => <article key={`${item.company}-${item.period}`}>
              <time>{item.period}</time>
              <h4>{item.company}<br />{item.role}</h4>
              <p>{item.summary}</p>
            </article>)}
          </div>
        </div>
      </div>

      <aside id="resume-contact-contact" className="end-page-system-log contact-anchor" aria-labelledby="end-page-system-log-title">
        <header><span><i aria-hidden="true" />THE END / PROFILE</span></header>
        <div className="end-page-system-log-body">
          <h2 id="end-page-system-log-title">{identity.name}</h2>
          <p>{identity.title}</p>
          <dl>
            <div><dt>EMAIL</dt><dd><a href={`mailto:${contact.email}`}>{contact.email}</a></dd></div>
            <div><dt>PORTFOLIO</dt><dd><a href={contact.portfolioUrl} target="_blank" rel="noreferrer">{contact.portfolio}</a></dd></div>
            <div><dt>WECHAT</dt><dd>{contact.wechat}</dd></div>
          </dl>
        </div>
        <footer>
          <span>// CONNECTION / COMPLETE</span>
          <a href="#title">BACK TO TOP</a>
          <i aria-hidden="true" />
        </footer>
      </aside>
    </div>

  </section>
}

function PortfolioResumeDetails() {
  const {
    contact,
    coreCapabilities,
    identity,
    profile,
    software,
    strengths,
    workflow,
  } = resumeContent

  return <section
    id="pdf-resume-details"
    className="pdf-resume-details page"
    aria-labelledby="pdf-resume-details-title"
  >
    <div className="pdf-resume-atmosphere" aria-hidden="true">
      <i className="pdf-resume-axis pdf-resume-axis-x" />
      <i className="pdf-resume-axis pdf-resume-axis-y" />
      <i className="pdf-resume-corner pdf-resume-corner-a" />
      <i className="pdf-resume-corner pdf-resume-corner-b" />
      <i className="pdf-resume-register pdf-resume-register-a" />
      <i className="pdf-resume-register pdf-resume-register-b" />
    </div>

    <header className="pdf-resume-header">
      <div className="pdf-resume-index">
        <span>11 / FULL RESUME DETAILS</span>
        <span>VISUAL ARCHIVE / PROFESSIONAL PROFILE</span>
      </div>
      <div className="pdf-resume-title">
        <p>CHARACTER CONCEPT ARTIST</p>
        <h2 id="pdf-resume-details-title">PROFESSIONAL<br />PROFILE</h2>
      </div>
      <div className="pdf-resume-identity">
        <strong>{identity.name}</strong>
        <span>{identity.title}</span>
      </div>
    </header>

    <div className="pdf-resume-columns">
      <div className="pdf-resume-column pdf-resume-profile-column">
        <section className="pdf-resume-block">
          <h3><span>01</span>PROFILE</h3>
          <div className="pdf-resume-profile-copy">
            {profile.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>

        <section className="pdf-resume-block pdf-resume-software">
          <h3><span aria-hidden="true"></span>SOFTWARE / TOOLS</h3>
          <div className="pdf-resume-software-list">
            {software.map((item) => <article key={item.name}>
              <img className="pdf-resume-software-logo" src={softwareLogoAssets[item.name]} alt="" width="36" height="36" decoding="async" />
              <div><h4>{item.name}</h4><p>{item.usage}</p></div>
            </article>)}
          </div>
        </section>
      </div>

      <section className="pdf-resume-column pdf-resume-block pdf-resume-capabilities">
        <h3><span>02</span>CORE CAPABILITIES</h3>
        <div className="pdf-resume-capability-list">
          {coreCapabilities.map((item, index) => <article key={item.title}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            <div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          </article>)}
        </div>
      </section>

      <section className="pdf-resume-column pdf-resume-block pdf-resume-workflow">
        <h3><span>03</span>DESIGN WORKFLOW</h3>
        <ol>
          {workflow.map((item) => <li key={item.number}>
            <b>{item.number}</b>
            <div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          </li>)}
        </ol>
      </section>
    </div>

    <section className="pdf-resume-strengths pdf-resume-block">
      <h3><span>04</span>PROFESSIONAL STRENGTHS</h3>
      <ul>
        {strengths.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>

    <footer className="pdf-resume-footer">
      <span>PROFILE RECORD / 11 OF 12</span>
      <span>{identity.name} / {identity.title}</span>
      <span>WECHAT / {contact.wechat}</span>
    </footer>
  </section>
}

const WEBSITE_DEFERRED_SECTIONS = Object.freeze([
  { id: 'contents', Component: D1001Directory, aliases: [] },
  { id: 'key-visual-01', Component: D0919Page01, aliases: [] },
  { id: 'key-visual-02', Component: Page02Poster, aliases: ['page-02'] },
  { id: 'key-visual-03', Component: KeyVisualThree, aliases: [] },
  { id: 'process-workflow', Component: D1001ProcessWorkflow, aliases: [] },
  { id: 'character-sheets', Component: CharacterSheets, aliases: [] },
  { id: 'costume-detail', Component: CostumeDetail, aliases: [] },
  { id: 'portrait-studies', Component: PortraitStudies, aliases: [] },
  { id: 'selected-works', Component: SelectedWorks, aliases: [] },
  { id: 'additional-designs', Component: AdditionalCharacterDesigns, aliases: [] },
  { id: 'professional-profile', Component: D1001ProfessionalProfile, aliases: ['resume-contact-resume'] },
  { id: 'about-the-creator', Component: D1001AboutCreator, aliases: ['end', 'resume-contact-contact'] },
])

function DeferredPortfolioSection({ definition, enabled, mounted, ensureMounted }) {
  const placeholderRef = useRef(null)

  useEffect(() => {
    if (!mounted) return undefined
    let frame = 0
    let disposed = false
    let attempts = 0
    const register = () => {
      if (disposed) return
      const section = document.getElementById(definition.id)
      if (!section || section.classList.contains('performance-section-placeholder')) return
      if (typeof window.__portfolioRegisterMountedSection === 'function') {
        window.__portfolioRegisterMountedSection(section)
        return
      }
      attempts += 1
      if (attempts < 4) {
        frame = window.requestAnimationFrame(register)
        return
      }
      window.dispatchEvent(new CustomEvent('portfolio:section-mounted', {
        detail: { id: definition.id, section },
      }))
    }
    frame = window.requestAnimationFrame(register)
    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
    }
  }, [definition.id, mounted])

  useEffect(() => {
    if (!enabled || mounted) return undefined
    const placeholder = placeholderRef.current
    if (!placeholder) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      ensureMounted(definition.id)
      observer.disconnect()
    }, {
      threshold: 0,
      rootMargin: `${Math.round(window.innerHeight * 0.9)}px 0px ${Math.round(window.innerHeight * 0.9)}px 0px`,
    })
    observer.observe(placeholder)
    return () => observer.disconnect()
  }, [definition.id, enabled, ensureMounted, mounted])

  if (mounted) return <definition.Component />

  return <section
    ref={placeholderRef}
    id={definition.id}
    className="performance-section-placeholder page"
    data-performance-placeholder={definition.id}
    aria-label={`${definition.id} loading boundary`}
    tabIndex={-1}
  >
    {definition.aliases.map((alias) =>
      <span id={alias} className="page-deep-link-alias" aria-hidden="true" key={alias} />,
    )}
    <span className="performance-section-placeholder-mark" aria-hidden="true" />
  </section>
}

function WebsitePortfolioPageSequence({ className, forceContents = false }) {
  const initialRoute = getPortfolioRouteForHash(window.location.hash)
  const initialMounted = initialRoute && initialRoute.id !== 'title'
    ? [initialRoute.id]
    : (forceContents ? ['contents'] : [])
  const [mountedSections, setMountedSections] = useState(() => new Set(initialMounted))
  const [observerEnabled, setObserverEnabled] = useState(Boolean(initialMounted.length))

  const ensureMounted = useCallback((id) => {
    setMountedSections((current) => {
      if (current.has(id)) return current
      const next = new Set(current)
      next.add(id)
      return next
    })
  }, [])

  useLayoutEffect(() => {
    const ensureSection = (value) => {
      const normalized = String(value || '')
      const hash = normalized.startsWith('#') ? normalized : `#${normalized}`
      const route = getPortfolioRouteForHash(hash)
        || PORTFOLIO_URL_ROUTES.find((candidate) => candidate.id === normalized)
      if (!route || route.id === 'title') return document.getElementById('title')
      flushSync(() => {
        setObserverEnabled(true)
        ensureMounted(route.id)
      })
      return document.getElementById(route.id)
    }
    window.__portfolioEnsureSection = ensureSection
    return () => {
      if (window.__portfolioEnsureSection === ensureSection) {
        delete window.__portfolioEnsureSection
      }
    }
  }, [ensureMounted])

  useEffect(() => {
    if (observerEnabled) return undefined
    const enable = () => setObserverEnabled(true)
    const enableFromKeyboard = (event) => {
      if (['ArrowDown', 'PageDown', 'End', ' ', 'Space'].includes(event.key)) enable()
    }
    window.addEventListener('wheel', enable, { passive: true, once: true })
    window.addEventListener('touchmove', enable, { passive: true, once: true })
    window.addEventListener('keydown', enableFromKeyboard)
    return () => {
      window.removeEventListener('wheel', enable)
      window.removeEventListener('touchmove', enable)
      window.removeEventListener('keydown', enableFromKeyboard)
    }
  }, [observerEnabled])

  return <main className={className}>
    <HomeV9Preview />
    {WEBSITE_DEFERRED_SECTIONS.map((definition) =>
      <DeferredPortfolioSection
        definition={definition}
        enabled={observerEnabled}
        ensureMounted={ensureMounted}
        mounted={mountedSections.has(definition.id)}
        key={definition.id}
      />,
    )}
  </main>
}

function PortfolioPageSequence({ className, includeResumeDetails = false }) {
  return <main className={className}>
    <HomeV9Preview />
    <D1001Directory />
    <D0919Page01 />
    <Page02Poster />
    <KeyVisualThree />
    <D1001ProcessWorkflow />
    <CharacterSheets />
    <CostumeDetail />
    <PortraitStudies />
    <SelectedWorks />
    <AdditionalCharacterDesigns />
    {includeResumeDetails ? <PortfolioResumeDetails /> : <D1001ProfessionalProfile />}
    <D1001AboutCreator />
  </main>
}

function App() {
  usePortfolioMotion()
  const query = new URLSearchParams(window.location.search)
  const directContentsCapture = query.get('contentsCapture') === '1'

  return <WebsitePortfolioPageSequence
    className={[directContentsCapture ? 'contents-capture-direct' : '', 'home-v9-preview-mode'].filter(Boolean).join(' ') || undefined}
    forceContents={directContentsCapture}
  />
}

function PortfolioPdfApp() {
  usePortfolioMotion()
  return <PortfolioPageSequence
    className="home-v9-preview-mode portfolio-pdf-root"
    includeResumeDetails
  />
}

const portfolioPdfRoute = /\/portfolio-pdf\/?$/.test(window.location.pathname)

if (portfolioPdfRoute) {
  document.documentElement.classList.add('portfolio-pdf-mode', 'motion-reduced')
}

createRoot(document.getElementById('root')).render(portfolioPdfRoute ? <PortfolioPdfApp /> : <App />)
