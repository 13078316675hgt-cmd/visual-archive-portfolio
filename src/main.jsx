import React from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect, useLayoutEffect } from 'react'
import './styles.css'
import './gallery.css'
import './content-layout.css'
import { initArchiveMotion } from './motion/archiveMotion.js'
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
  contentsV6CleanAtmosphere,
  contentsChapters,
  endPageArtwork,
  homeV9Artwork,
} from './data/artworkManifest.js'

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
    const cleanupArchiveMotion = initArchiveMotion(document.querySelector('.archive-selection-scene'), { reducedMotion: reduceMotion })

    let navigationToken = 0
    let navigationSettleTimer = 0
    let navigationScrollEndHandler = null

    const releaseAnchorNavigation = (token) => {
      if (token !== navigationToken) return
      if (navigationScrollEndHandler) {
        window.removeEventListener('scrollend', navigationScrollEndHandler)
        navigationScrollEndHandler = null
      }
      window.clearTimeout(navigationSettleTimer)
      navigationSettleTimer = 0
    }

    const cancelPendingAnchorNavigation = () => {
      navigationToken += 1
      if (navigationScrollEndHandler) {
        window.removeEventListener('scrollend', navigationScrollEndHandler)
        navigationScrollEndHandler = null
      }
      window.clearTimeout(navigationSettleTimer)
      navigationSettleTimer = 0
    }

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

    const waitForAnchorLayout = async (target) => {
      await document.fonts?.ready
      const targetSection = target.closest('section.page') || target
      const layoutImages = Array.from(document.images).filter((image) => {
        if (targetSection.contains(image)) return true
        const section = image.closest('section.page')
        if (!section || section.matches('#title, #contents')) return false
        return Boolean(image.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)
      })
      const loadingModes = layoutImages.map((image) => image.getAttribute('loading'))
      layoutImages.forEach((image) => { image.loading = 'eager' })
      await Promise.allSettled(layoutImages.map((image) => image.decode()))
      layoutImages.forEach((image, index) => {
        const loading = loadingModes[index]
        if (loading == null) image.removeAttribute('loading')
        else image.setAttribute('loading', loading)
      })
      await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)))
    }

    const navigateToAnchorOnce = async (hash, target = resolveAnchorTarget(hash)) => {
      if (!target) return false

      cancelPendingAnchorNavigation()
      const token = navigationToken
      await waitForAnchorLayout(target)
      if (token !== navigationToken) return false

      target.scrollIntoView({
        block: 'start',
        behavior: reduceMotion ? 'auto' : 'smooth',
      })

      navigationScrollEndHandler = () => releaseAnchorNavigation(token)
      if ('onscrollend' in window) {
        window.addEventListener('scrollend', navigationScrollEndHandler, { once: true })
      }
      navigationSettleTimer = window.setTimeout(() => releaseAnchorNavigation(token), reduceMotion ? 100 : 1400)
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
      if (window.location.hash !== hash) {
        window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash}`)
      }
      void navigateToAnchorOnce(hash, target)
    }

    document.addEventListener('click', handleAnchorClick)
    const initialHashFrame = window.requestAnimationFrame(() => {
      if (window.location.hash) void navigateToAnchorOnce(window.location.hash)
    })

    if (reduceMotion) {
      return () => {
        window.cancelAnimationFrame(initialHashFrame)
        cancelPendingAnchorNavigation()
        document.removeEventListener('click', handleAnchorClick)
        root.classList.remove('motion-reduced')
        cleanupArchiveMotion()
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
          const maxDelay = mobileMotion
            ? (options.mobileMaxDelay ?? Math.min(options.maxDelay || 240, 180))
            : (options.maxDelay || 240)
          node.style.setProperty('--motion-delay', `${Math.min(delay, maxDelay)}ms`)
        }
        touch(node)
      })
      return nodes
    }

    scene('#title', 'title', 'section-intro', '--motion-section')
    scene('#key-visual-01', 'kv01', 'artwork-sequence', '--motion-section')
    scene('#key-visual-02', 'kv02', 'artwork-sequence', '--motion-section')
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
    setMotion('.home-v9-artwork', 'home-v9-artwork', { delay: 120, mobileDelay: 260 })
    setMotion('.home-v9-title span', 'home-v9-title', { delay: 360, stagger: 60, maxDelay: 440, mobileDelay: 80, mobileStagger: 50, mobileMaxDelay: 130 })
    setMotion('.home-v9-eyebrow, .home-v9-subheading, .home-v9-description, .home-v9-coordinate', 'home-v9-copy', { delay: 580, stagger: 55, maxDelay: 720, mobileDelay: 180, mobileStagger: 45, mobileMaxDelay: 290 })
    setMotion('.home-v9-enter, .home-v9-scroll', 'home-v9-action', { delay: 760, stagger: 80, maxDelay: 840, mobileDelay: 310, mobileStagger: 55, mobileMaxDelay: 365 })
    setMotion('.home-v9-rule', 'registration-rule', { delay: 640, stagger: 50, maxDelay: 700, mobileDelay: 220, mobileStagger: 40, mobileMaxDelay: 260 })

    setMotion('.key-visual-page .kv-number-row', 'section-title')
    setMotion('.key-visual-page .kv-title-rule', 'registration-rule', { delay: 40 })
    setMotion('.key-visual-page .kv-title-copy', 'section-copy', { delay: 80 })
    setMotion('.key-visual-one .kv-main', 'artwork-primary', { variant: 'diagonal', delay: 40 })
    setMotion('.key-visual-two .kv-main', 'artwork-primary', { variant: 'horizontal', delay: 40 })
    setMotion('.key-visual-one .kv-red-shape, .key-visual-one .kv-local-plane, .key-visual-one .kv-rule, .key-visual-one .kv-mark', 'registration-detail', { delay: 160, stagger: 40, maxDelay: 240 })
    setMotion('.key-visual-two .kv-red-shape, .key-visual-two .kv-local-plane, .key-visual-two .kv-rule, .key-visual-two .kv-mark', 'registration-detail', { delay: 120, stagger: 40, maxDelay: 240 })
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
      const completionDelay = window.matchMedia('(max-width: 900px)').matches ? 620 : 900
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
      cancelPendingAnchorNavigation()
      document.removeEventListener('click', handleAnchorClick)
      sceneObserver.disconnect()
      navObserver.disconnect()
      completionTimers.forEach((timer) => window.clearTimeout(timer))
      completionTimers.clear()
      root.classList.remove('motion-enabled')
      root.classList.remove('motion-reduced')
      navLinks.forEach((link) => link.classList.remove('is-active'))
      cleanupArchiveMotion()
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

  return <section id="title" className="home-v9-preview" data-home-visual="v9master">
    <Nav />
    <div className="home-v9-artwork">
      <picture>
        <source type="image/webp" srcSet={homeV9Artwork.srcSet} sizes={homeV9Artwork.sizes} />
        <img
          src={homeV9Artwork.src}
          alt={homeV9Artwork.alt}
          width={width}
          height={height}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </picture>
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


const ARCHIVE_SCENE_WIDTH = 1920
const ARCHIVE_SCENE_HEIGHT = 1080

const CONTENTS_V6_MASTER_SAFE_AREA = Object.freeze({ left: 48, right: 48, top: 34, bottom: 34 })

const CONTENTS_V6_MASTER_LAYOUT = Object.freeze([
  { number: '01', title: 'HERO WORKS', descriptor: 'KEY VISUAL 01', marker: { x: 88, y: 530 }, window: { x: 112, y: 503, width: 94, height: 57 }, label: { x: 80, y: 468 }, route: 'M -20 520 C 18 509, 51 511, 88 530' },
  { number: '02', title: 'CHARACTER DESIGN', descriptor: 'KEY VISUAL 02', marker: { x: 352, y: 610 }, window: { x: 365, y: 575, width: 92, height: 58 }, label: { x: 349, y: 537 }, route: 'M 88 530 C 164 515, 221 482, 274 521 C 314 550, 286 586, 352 610' },
  { number: '03', title: 'STYLE EXPLORATION', descriptor: 'KEY VISUAL 03', marker: { x: 520, y: 711 }, window: { x: 537, y: 688, width: 96, height: 59 }, label: { x: 464, y: 751 }, route: 'M 352 610 C 395 649, 470 720, 520 711' },
  { number: '04', title: 'CHARACTER SHEETS', descriptor: 'TURNAROUND DESIGN', marker: { x: 700, y: 555 }, window: { x: 659, y: 467, width: 110, height: 68 }, label: { x: 663, y: 430 }, route: 'M 520 711 C 570 702, 620 565, 700 555' },
  { number: '05', title: 'PROP DESIGN', descriptor: 'LAYER / ORNAMENT', marker: { x: 946, y: 710 }, window: { x: 884, y: 724, width: 97, height: 56 }, label: { x: 850, y: 789 }, route: 'M 700 555 C 790 540, 830 690, 946 710' },
  { number: '06', title: 'UI TRANSITION', descriptor: 'IDENTITY / EXPRESSION', marker: { x: 1070, y: 628 }, window: { x: 1058, y: 540, width: 96, height: 59 }, label: { x: 1134, y: 500 }, route: 'M 946 710 C 985 720, 1024 635, 1070 628' },
  { number: '07', title: 'PROCESS ARCHIVE', descriptor: 'TECHNICAL SHEETS', marker: { x: 1360, y: 562 }, window: { x: 1368, y: 508, width: 96, height: 59 }, label: { x: 1354, y: 468 }, route: 'M 1070 628 C 1120 620, 1205 630, 1262 614 C 1296 604, 1322 558, 1360 562' },
  { number: '08', title: 'RESUME', descriptor: 'CHARACTER CONCEPT ARTIST', marker: { x: 1488, y: 710 }, window: { x: 1440, y: 696, width: 84, height: 51 }, label: { x: 1496, y: 674 }, route: 'M 1360 562 C 1412 580, 1433 700, 1488 710' },
  { number: '09', title: 'CONTACT', descriptor: 'EMAIL / WECHAT', marker: { x: 1678, y: 678 }, window: { x: 1645, y: 640, width: 84, height: 53 }, label: { x: 1660, y: 632 }, route: 'M 1488 710 C 1543 720, 1616 660, 1678 678' },
])

function toStagePercent(value, axis) {
  return `${(value / (axis === 'x' ? ARCHIVE_SCENE_WIDTH : ARCHIVE_SCENE_HEIGHT)) * 100}%`
}

function MasterContentsSection() {
  const chapterMap = new Map(contentsChapters.map((chapter) => [chapter.number, chapter]))
  const { width, height } = getAssetDimensions(contentsV6CleanAtmosphere)

  return <section id="contents" className="contents archive-route archive-selection-scene v6-master-contents page paper-page" data-contents-visual="v6master">
    <div className="archive-selection-frame">
      <div className="archive-selection-viewport">
        <div className="archive-selection-map v6-master-map" style={{ '--selection-width': `${ARCHIVE_SCENE_WIDTH}px`, '--selection-height': `${ARCHIVE_SCENE_HEIGHT}px`, '--v6-safe-left': `${CONTENTS_V6_MASTER_SAFE_AREA.left}px`, '--v6-safe-right': `${CONTENTS_V6_MASTER_SAFE_AREA.right}px` }}>
          <img className="archive-selection-core v6-master-plate" src={contentsV6CleanAtmosphere.src} alt="" aria-hidden="true" loading="eager" decoding="async" fetchPriority="high" width={width} height={height} />
          <div className="v6-master-atmosphere-veil" aria-hidden="true" />
          <header className="v6-master-title">
            <span>ARCHIVE SYSTEM // KEY VISUAL INDEX</span>
            <h2>CONTENTS</h2>
            <b>EXPLORE THE ARCHIVE</b>
            <p>Browse concept art, key visuals,<br />and design notes from selected works.<br />Thank you for visiting.</p>
          </header>
          <div className="v6-master-side-meta" aria-hidden="true"><span>PRJ</span><span>NO.</span><span>2.1.4</span><i /></div>

          <svg className="archive-selection-lines v6-master-route" viewBox={`0 0 ${ARCHIVE_SCENE_WIDTH} ${ARCHIVE_SCENE_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
            {CONTENTS_V6_MASTER_LAYOUT.map((item) => <path className={`archive-selection-link archive-selection-link-${item.number}`} d={item.route} data-route-chapter={item.number} key={item.number} pathLength="1" />)}
          </svg>

          <nav className="archive-route-nodes v6-master-nodes" aria-label="作品集路线目录">
            {CONTENTS_V6_MASTER_LAYOUT.map((item) => {
              const chapter = chapterMap.get(item.number)
              const isImage = chapter?.type === 'image'
              return <a
                className={`archive-route-node archive-selection-node v6-master-node ${isImage ? 'v6-master-node-image' : 'archive-route-node-utility v6-master-node-terminal'}`}
                href={chapter?.href}
                key={item.number}
                data-chapter={item.number}
                aria-label={`${item.number} ${item.title} ${item.descriptor}`}
                style={{
                  '--v6-marker-x': toStagePercent(item.marker.x, 'x'),
                  '--v6-marker-y': toStagePercent(item.marker.y, 'y'),
                  '--v6-window-x': toStagePercent(item.window.x, 'x'),
                  '--v6-window-y': toStagePercent(item.window.y, 'y'),
                  '--v6-window-w': toStagePercent(item.window.width, 'x'),
                  '--v6-window-h': toStagePercent(item.window.height, 'y'),
                  '--v6-label-x': toStagePercent(item.label.x, 'x'),
                  '--v6-label-y': toStagePercent(item.label.y, 'y'),
                }}
              >
                <span className="archive-route-anchor v6-master-marker" aria-hidden="true"><span className="archive-route-index">{item.number}</span></span>
                {isImage
                  ? <figure className="archive-route-window v6-master-window">
                      <img {...imageAttrs(chapter.asset)} alt={`${chapter.asset.alt}目录检索裁切`} loading="eager" decoding="async" fetchPriority="low" />
                      <span className="v6-master-window-corners" aria-hidden="true" />
                    </figure>
                  : null}
                {isImage
                  ? <span className="archive-route-label v6-master-label"><b>{item.number}</b><strong>{item.title}</strong><small>{item.descriptor}</small></span>
                  : <span className="archive-route-utility v6-master-terminal"><b>{item.number}</b><strong>{item.title}</strong><small>{item.descriptor}</small></span>}
              </a>
            })}
          </nav>
          <div className="v6-master-footer-meta"><span>PROTOCOL SYSTEM</span><span>DISPLAY MODE: INDEX-LINE // FULL / ENGAGE</span></div>
        </div>
      </div>
    </div>
  </section>
}

function MobileContentsSection() {
  const routeChapters = contentsChapters.filter((chapter) => chapter.number !== '10')
  return <section id="contents" className="contents archive-route archive-selection-scene mobile-contents page paper-page" data-contents-visual="v6master-mobile">
    <div className="archive-selection-frame">
      <header className="archive-route-head">
        <div className="archive-route-kicker">INDEX / 04</div>
        <h2>ARCHIVE ROUTE · SELECTION MATRIX</h2>
        <p>MAP 09 · ROUTE STATUS / LIVE</p>
        <a className="archive-route-return" href="#title">RETURN / TITLE</a>
      </header>

      <div className="archive-selection-viewport">
        <div className="archive-selection-map" style={{ '--selection-width': `${ARCHIVE_SCENE_WIDTH}px`, '--selection-height': `${ARCHIVE_SCENE_HEIGHT}px` }}>
          <div className="archive-route-nodes" aria-label="作品集路线目录">
            {routeChapters.map((chapter) => {
              const windowX = chapter.desktopMapX - chapter.routeX
              const windowY = chapter.desktopMapY - chapter.routeY
              return <a
                className={[
                  'archive-route-node',
                  'archive-selection-node',
                  `archive-route-node-${chapter.mapType}`,
                  `archive-route-size-${chapter.mapSize}`,
                  `archive-route-place-${chapter.mapPlacement}`,
                  `archive-route-side-${chapter.mapSide}`,
                  `archive-selection-zone-${chapter.mapZone}`,
                ].join(' ')}
                href={chapter.href}
                key={chapter.number}
                data-chapter={chapter.number}
                data-reveal-start={chapter.revealStart}
                data-reveal-end={chapter.revealEnd}
                style={{
                  '--map-x': `${(chapter.routeX / ARCHIVE_SCENE_WIDTH) * 100}%`,
                  '--map-y': `${(chapter.routeY / ARCHIVE_SCENE_HEIGHT) * 100}%`,
                  '--node-w': `${chapter.hitWidth || chapter.windowWidth || 176}px`,
                  '--window-w': chapter.windowWidth ? `${chapter.windowWidth}px` : undefined,
                  '--window-h': chapter.windowHeight ? `${chapter.windowHeight}px` : undefined,
                  '--window-x': `${windowX}px`,
                  '--window-y': `${windowY}px`,
                  '--anchor-x': '0px',
                  '--anchor-y': '0px',
                  '--label-x': `${windowX + (chapter.labelOffsetX || 0)}px`,
                  '--label-y': `${windowY + (chapter.labelOffsetY || 0)}px`,
                  '--label-w': chapter.labelWidth ? `${chapter.labelWidth}px` : undefined,
                  '--label-h': chapter.labelHeight ? `${chapter.labelHeight}px` : undefined,
                  '--crop-position': chapter.cropPosition || chapter.objectPosition || '50% 50%',
                  '--crop-scale': chapter.cropScale || 1,
                }}
                aria-label={`${chapter.number} ${chapter.title} ${chapter.archiveSubtitle || chapter.subtitle}`}
              >
                <span className="archive-route-anchor" aria-hidden="true">
                  <span className="archive-route-index">{chapter.number}</span>
                </span>
                <span className="archive-selection-leader" aria-hidden="true" />
                {chapter.mapType === 'image'
                  ? <figure className="archive-route-window">
                      <span className="archive-route-strip">ARCHIVE / FILE {chapter.number}</span>
                      {chapter.number === '04' ? <span className="archive-route-corners" aria-hidden="true" /> : null}
                      <img {...imageAttrs(chapter.asset)} alt={`${chapter.asset.alt}目录路线裁切预览`} loading="lazy" decoding="async" fetchPriority="low" />
                    </figure>
                  : <div className="archive-route-utility">
                      <span>ARCHIVE / ENDPOINT {chapter.number}</span>
                  <strong>{chapter.number} / {chapter.archiveTitle || chapter.lines[0]}</strong>
                      <small>{chapter.lines[1]}</small>
                    </div>}
                <span className="archive-route-label">
                  <b>ARCHIVE / {chapter.number}</b>
                  <strong>{chapter.number} / {chapter.archiveTitle || chapter.title}</strong>
                  <small>{chapter.archiveSubtitle || chapter.subtitle}</small>
                </span>
              </a>
            })}
          </div>
        </div>
      </div>
    </div>
  </section>
}

function ContentsSection() {
  const mobile = window.matchMedia('(max-width: 1100px)').matches
  return mobile ? <MobileContentsSection /> : <MasterContentsSection />
}

function KeyVisualPage({ id, number, title, asset, variant }) {
  return <section id={id} className={`key-visual-page key-visual-${variant} page`}>
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
      <img {...imageAttrs(asset)} alt={asset.alt} loading={id === 'key-visual-01' ? 'eager' : 'lazy'} decoding="async" />
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
  const { width, height } = getAssetDimensions(endPageArtwork)

  return <section id="end" className="end-page page" aria-label="Portfolio ending">
    <span id="resume-contact-resume" className="end-page-legacy-anchor" aria-hidden="true" />
    <span id="resume-contact-contact" className="end-page-legacy-anchor" aria-hidden="true" />
    <link rel="prefetch" as="image" href={endPageArtwork.src} />

    <div className="end-page-stage">
      <img
        className="end-page-image"
        src={endPageArtwork.src}
        alt={endPageArtwork.alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />

      <aside className="end-page-system-log" aria-labelledby="end-page-system-log-title">
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

      <span className="end-page-hotspot-anchor end-page-return-anchor" style={END_PAGE_HOTSPOTS.returnToBeginning}>
        <a className="end-page-hotspot end-page-return-hotspot" href="#title" aria-label="Return to beginning">
          <span>RETURN TO BEGINNING</span>
        </a>
      </span>
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
    <KeyVisualPage id="key-visual-02" number="02" title="KEY VISUAL 02" asset={artworkTwo} variant="two" />
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
