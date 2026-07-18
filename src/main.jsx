import React from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect, useLayoutEffect, useRef } from 'react'
import './styles.css'
import './gallery.css'
import './content-layout.css'
import './d02-production-fix.css'
import './d03-spread-edge-fix.css'
import './d03-1-directory-motion.css'
import './d03-3-static-integration-motion.css'
import './d03-3-end-dvd-window.css'
import './d04-motion-art-direction.css'
import './d05-page02-poster.css'
import { initArchiveMotion } from './motion/archiveMotion.js'
import { initEndPageDvdMotion } from './motion/endPageDvdMotion.js'
import { initHomeMotion } from './motion/homeMotion.js'
import { initPage02PosterMotion } from './motion/page02PosterMotion.js'
import {
  AdditionalCharacterDesigns,
  CharacterSheets,
  CostumeDetail,
  PortraitStudies,
  SelectedWorks,
} from './components/ContentPortfolioPages.jsx'
import {
  artworkManifest,
  artworkOne,
  artworkThree,
  artworkTwo,
  contentsChapters,
  directoryMasterIntegrated,
  endPageIntegrated,
  homeV9Artwork,
} from './data/artworkManifest.js'

const PORTFOLIO_URL_ROUTES = Object.freeze([
  { id: 'title', hash: '', aliases: ['#title'] },
  { id: 'contents', hash: '#contents', aliases: [] },
  { id: 'key-visual-01', hash: '#key-visual-01', aliases: [] },
  { id: 'key-visual-02', hash: '#key-visual-02', aliases: ['#page-02'] },
  { id: 'key-visual-03', hash: '#key-visual-03', aliases: [] },
  { id: 'character-sheets', hash: '#character-sheets', aliases: [] },
  { id: 'costume-detail', hash: '#costume-detail', aliases: [] },
  { id: 'portrait-studies', hash: '#portrait-studies', aliases: [] },
  { id: 'selected-works', hash: '#selected-works', aliases: [] },
  { id: 'additional-designs', hash: '#additional-designs', aliases: [] },
  { id: 'end', hash: '#end', aliases: ['#resume-contact-resume', '#resume-contact-contact'] },
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
      <a href="#resume-contact-resume">RESUME</a>
      <a href="#resume-contact-contact">CONTACT</a>
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
      target.scrollIntoView({
        block: 'start',
        behavior: 'instant',
      })
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

    const cleanupArchiveMotion = initArchiveMotion(document.querySelector('.archive-selection-scene'), { reducedMotion: reduceMotion })
    const cleanupHomeMotion = initHomeMotion(document.querySelector('.home-v9-preview'), { reducedMotion: reduceMotion })

    let routeSyncFrame = 0
    let routeSyncUnlockFrame = 0
    let routeSyncSuspended = Boolean(requestedHash && requestedRoute && requestedTarget)
    const routeElements = PORTFOLIO_URL_ROUTES.map((route) => ({
      route,
      element: document.getElementById(route.id),
    })).filter(({ element }) => Boolean(element))

    const findViewportRoute = () => {
      const probeY = Math.min(window.innerHeight * 0.38, 360)
      return routeElements.find(({ element }) => {
        const rect = element.getBoundingClientRect()
        return rect.top <= probeY && rect.bottom > probeY
      })?.route || null
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

    const touch = (node) => {
      if (node) touchedNodes.add(node)
      return node
    }

    const scene = (selector, name, pattern, duration) => {
      const node = document.querySelector(selector)
      if (!node) return null
      node.setAttribute('data-motion-scene', name)
      node.setAttribute('data-motion-pattern', pattern)
      node.style.setProperty('--scene-duration', `var(${duration})`)
      scenes.push(node)
      return touch(node)
    }

    const setMotion = (selector, type, options = {}) => {
      const nodes = Array.from(document.querySelectorAll(selector))
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
    scene('#character-sheets', 'sheets', 'artwork-sequence', '--motion-section')
    scene('#costume-detail', 'detail', 'artwork-sequence', '--motion-section')
    scene('#portrait-studies', 'portraits', 'artwork-sequence', '--motion-section')
    scene('#selected-works', 'selected', 'artwork-sequence', '--motion-section')
    scene('#additional-designs', 'additional', 'section-intro', '--motion-section')
    scene('#end', 'final', 'contact-ending', '--motion-slow')

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

    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        activateScene(entry.target)
        sceneObserver.unobserve(entry.target)
      })
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' })

    scenes.forEach((node) => sceneObserver.observe(node))

    requestAnimationFrame(() => {
      scenes.forEach((node) => {
        const rect = node.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          activateScene(node)
          sceneObserver.unobserve(node)
        }
      })
    })

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
      ['#resume-contact-resume', '#resume-contact-resume'],
      ['#resume-contact-contact', '#resume-contact-contact'],
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
  const { width, height } = getAssetDimensions(homeV9Artwork)

  const artworkPicture = (className, { decorative = false } = {}) => <picture className={className} aria-hidden={decorative || undefined}>
    <source type="image/webp" srcSet={homeV9Artwork.srcSet} sizes={homeV9Artwork.sizes} />
    <img
      src={homeV9Artwork.src}
      alt={decorative ? '' : homeV9Artwork.alt}
      width={width}
      height={height}
      loading="eager"
      decoding="async"
      fetchPriority={decorative ? 'auto' : 'high'}
    />
  </picture>

  return <section id="title" className="home-v9-preview" data-home-visual="v9master" data-home-motion="mother-image-pullback" tabIndex={-1}>
    <Nav />
    <div className="home-v9-artwork">
      {artworkPicture('home-v9-mother home-v9-mother-base')}
      <div className="home-v9-depth-layers" aria-hidden="true">
        {artworkPicture('home-v9-mother home-v9-layer home-v9-layer-environment', { decorative: true })}
        {artworkPicture('home-v9-mother home-v9-layer home-v9-layer-subject', { decorative: true })}
        {artworkPicture('home-v9-mother home-v9-layer home-v9-layer-foreground', { decorative: true })}
      </div>
    </div>
    <div className="home-v9-copy">
      <p className="home-v9-eyebrow">SELECTED WORKS / 2026</p>
      <h1 className="home-v9-title"><span>VISUAL</span><span>ARCHIVE</span></h1>
      <p className="home-v9-subheading">CONCEPT ART PORTFOLIO</p>
      <p className="home-v9-description">Character design, key visuals,<br />and visual development.</p>
      <a className="home-v9-enter" href="#contents">
        <span>ENTER ARCHIVE</span>
        <svg viewBox="0 0 56 12" aria-hidden="true"><path d="M0 6h52M47 1l5 5-5 5" /></svg>
      </a>
    </div>
    <div className="home-v9-index" aria-hidden="true"><span>00</span><b>HOME / MASTER</b></div>
    <p className="home-v9-coordinate" aria-hidden="true">ARCHIVE FIELD / X 35.8 / Y 06.2</p>
    <i className="home-v9-rule home-v9-rule-a" aria-hidden="true" />
    <i className="home-v9-rule home-v9-rule-b" aria-hidden="true" />
    <a className="home-v9-scroll" href="#contents"><span>SCROLL</span><i aria-hidden="true" /></a>
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

  return <section
    id="contents"
    className="contents archive-route archive-selection-scene d01-directory page"
    data-contents-visual="d04-locked-mother-image"
    data-directory-motion="mother-image-pullback"
    data-archive-motion-ready="true"
    data-archive-phase="initial"
  >
    <div className="directory-stage">
      <div className="directory-motion-parent">
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
        <strong>VISUAL ARCHIVE</strong>
        <small>SELECT YOUR DESTINATION</small>
      </header>
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

function Page02Poster() {
  const sectionRef = useRef(null)
  const asset = artworkTwo

  useLayoutEffect(() => initPage02PosterMotion(sectionRef.current), [])

  return <section ref={sectionRef} id="key-visual-02" className="key-visual-page key-visual-two kv02-poster page">
    <span id="page-02" className="page-deep-link-alias" aria-hidden="true" />
    <link rel="preload" as="image" href={asset.src} />

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
          fetchPriority="high"
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
    src: asset.src,
    srcSet: asset.srcSet,
    sizes: asset.sizes,
    width,
    height,
  }
}

const END_PAGE_HOTSPOTS = Object.freeze({
  returnToBeginning: { left: '92.34%', top: '76.73%', width: '3.23%', height: '5.74%' },
})

function EndPageSection() {
  const { width, height } = getAssetDimensions(endPageIntegrated)
  const sectionRef = useRef(null)
  const panelRef = useRef(null)

  useLayoutEffect(() => initEndPageDvdMotion(sectionRef.current, panelRef.current), [])

  return <section ref={sectionRef} id="end" className="end-page page" aria-label="Portfolio ending">
    <span id="resume-contact-resume" className="end-page-legacy-anchor" aria-hidden="true" />
    <span id="resume-contact-contact" className="end-page-legacy-anchor" aria-hidden="true" />
    <link rel="prefetch" as="image" href={endPageIntegrated.src} />

    <div className="end-page-stage">
      <div className="end-page-artwork-field">
        <img
          className="end-page-image"
          src={endPageIntegrated.src}
          alt={endPageIntegrated.alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
        />

        <span className="end-page-hotspot-anchor end-page-return-anchor" style={END_PAGE_HOTSPOTS.returnToBeginning}>
          <a className="end-page-hotspot end-page-return-hotspot" href="#title" aria-label="Return to beginning">
            <span>RETURN TO BEGINNING</span>
          </a>
        </span>
      </div>

      <aside ref={panelRef} className="end-page-system-log" aria-labelledby="end-page-system-log-title">
        <header><span><i aria-hidden="true" />SYSTEM PROFILE</span></header>
        <div className="end-page-system-log-body">
          <h2 id="end-page-system-log-title">{`\u9EC4\u56FD\u6CF0`}</h2>
          <p>CONCEPT ARTIST / CHARACTER DESIGNER</p>
          <dl>
            <div><dt>EMAIL</dt><dd><a href="mailto:2488731102@qq.com">2488731102@qq.com</a></dd></div>
            <div><dt>PORTFOLIO</dt><dd><a href="https://www.marlsa.cc.cd/" target="_blank" rel="noreferrer">www.marlsa.cc.cd</a></dd></div>
            <div><dt>WECHAT</dt><dd>Veiko_9029</dd></div>
          </dl>
        </div>
        <footer><span>// SYSTEM LOG / ACTIVE</span><i aria-hidden="true" /></footer>
      </aside>
    </div>

  </section>
}

function App() {
  usePortfolioMotion()
  const query = new URLSearchParams(window.location.search)
  const directContentsCapture = query.get('contentsCapture') === '1'

  return <main className={[directContentsCapture ? 'contents-capture-direct' : '', 'home-v9-preview-mode'].filter(Boolean).join(' ') || undefined}>
    <HomeV9Preview />
    <ContentsSection />
    <KeyVisualPage id="key-visual-01" number="01" title="KEY VISUAL 01" asset={artworkOne} variant="one" />
    <Page02Poster />
    <KeyVisualPage id="key-visual-03" number="03" title="KEY VISUAL 03" asset={artworkThree} variant="three" />
    <CharacterSheets />
    <CostumeDetail />
    <PortraitStudies />
    <SelectedWorks />
    <AdditionalCharacterDesigns />
    <EndPageSection />
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
