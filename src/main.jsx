import React from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect, useLayoutEffect } from 'react'
import './styles.css'
import './gallery.css'
import { initArchiveMotion } from './motion/archiveMotion.js'
import {
  additionalCharacterDesigns,
  artworkManifest,
  artworkOne,
  artworkThree,
  artworkTwo,
  characterSheets,
  contactHandsTech,
  contentsV6CleanAtmosphere,
  contentsChapters,
  costumeDetailAsset,
  portraitStudies,
  selectedWorks,
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
      const precedingImages = Array.from(document.images).filter((image) => {
        const section = image.closest('section.page')
        if (!section || section.matches('#title, #contents')) return false
        return Boolean(image.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)
      })
      const loadingModes = precedingImages.map((image) => image.getAttribute('loading'))
      precedingImages.forEach((image) => { image.loading = 'eager' })
      await Promise.allSettled(precedingImages.map((image) => image.decode()))
      precedingImages.forEach((image, index) => {
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
    scene('#resume-contact', 'final', 'contact-ending', '--motion-section')

    setMotion('.title-rule-a, .title-rule-b', 'registration-rule', { stagger: 40, maxDelay: 80 })
    setMotion('.title-lockup h1 span', 'intro-title', { delay: 80, stagger: 60, maxDelay: 200 })
    setMotion('.title-lockup h2, .title-lockup p, .title-contact a, .title-contact p, .title-meta span', 'intro-meta', { delay: 220, stagger: 40, maxDelay: 240 })
    setMotion('.title-cobalt-field', 'intro-field')
    setMotion('.title-scan', 'intro-panel', { stagger: 40, maxDelay: 120 })

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
    setMotion('.detail-main', 'artwork-primary', { delay: 40 })
    setMotion('.detail-crop', 'artwork-support', { delay: 120, stagger: 50, maxDelay: 220 })
    setMotion('.portrait-item', 'artwork-support', { delay: 40, stagger: 70, maxDelay: 120 })
    setMotion('.selected-primary img', 'artwork-primary', { delay: 80, mobileDelay: 40 })
    setMotion('.selected-primary figcaption', 'section-copy', { delay: 160, mobileDelay: 100 })
    setMotion('.selected-support img', 'artwork-support', { delay: 240, stagger: 80, maxDelay: 320, mobileDelay: 160, mobileStagger: 60, mobileMaxDelay: 220 })
    setMotion('.selected-support figcaption', 'section-copy', { delay: 340, stagger: 60, maxDelay: 400, mobileDelay: 200, mobileStagger: 40, mobileMaxDelay: 240 })
    setMotion('.additional-item', 'artwork-support', { delay: 60, stagger: 40, maxDelay: 220 })

    setMotion('.final-hands', 'contact-field')
    setMotion('.final-chapter-label, .final-identity, .final-resume-panel', 'contact-copy', { delay: 80, stagger: 50, maxDelay: 180 })
    setMotion('.final-contact-panel', 'contact-copy', { delay: 220 })
    setMotion('.hand-study-overlay .study-axis, .hand-study-overlay .study-measure, .hand-study-overlay .study-cross', 'contact-guide', { delay: 40, stagger: 50, maxDelay: 140 })
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
      <img {...imageAttrs(asset)} alt={asset.alt} loading="lazy" decoding="async" />
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

function SheetFigure({ asset, index, className }) {
  return <figure className={`sheet ${className}`}>
    <img {...imageAttrs(asset)} alt={asset.alt} loading="lazy" decoding="async" />
    <figcaption><b>{String(index + 1).padStart(2, '0')}</b><span>{asset.label}</span></figcaption>
  </figure>
}

function CharacterSheets() {
  const [primary, ...supporting] = characterSheets
  return <section id="character-sheets" className="sheets page white-page">
    <header className="editorial-head compact"><div><span>CHARACTER SHEETS</span><h2>TECHNICAL READABILITY</h2></div><p>正面 / 侧面 / 背面，保留设定图的完整信息。</p></header>
    <div className="sheet-list">
      <SheetFigure asset={primary} index={0} className="sheet-main" />
      <div className="sheet-supporting">
        {supporting.map((asset, index) => <SheetFigure asset={asset} index={index + 1} className={`sheet-support sheet-support-${index + 2}`} key={asset.id} />)}
      </div>
    </div>
    <PageMeta number="04" label="CHARACTER SHEETS" />
  </section>
}

function CostumeDetail() {
  return <section id="costume-detail" className="detail page paper-page">
    <header className="editorial-head"><div><span>COSTUME DETAIL</span><h2>FORM, LAYER<br />AND ORNAMENT</h2></div><p>局部展示仅放大原图中可辨认的衣装结构，不补绘、不拆分隐藏部件。</p></header>
    <div className="detail-grid">
      <figure className="detail-main"><img {...imageAttrs(costumeDetailAsset)} alt={`${costumeDetailAsset.alt}整体视图`} loading="lazy" decoding="async" /><figcaption>COSTUME REFERENCE</figcaption></figure>
      <figure className="detail-crop detail-upper"><div><img {...imageAttrs(costumeDetailAsset)} alt="角色上身兜帽、胸前装饰与腰部配件细节" loading="lazy" decoding="async" /></div><figcaption>UPPER BODY / ORNAMENT</figcaption></figure>
      <figure className="detail-crop detail-back"><div><img {...imageAttrs(costumeDetailAsset)} alt="角色背部兜帽与十字纹样细节" loading="lazy" decoding="async" /></div><figcaption>BACK / SILHOUETTE</figcaption></figure>
    </div>
    <PageMeta number="05" label="COSTUME DETAIL" />
  </section>
}

function PortraitStudies() {
  return <section id="portrait-studies" className="portraits page white-page">
    <header className="editorial-head compact"><div><span>PORTRAIT STUDY</span><h2>IDENTITY & EXPRESSION</h2></div><p>保留两张肖像，形成深色与浅色的双页关系。</p></header>
    <div className="portrait-pair">
      {portraitStudies.map((asset, index) => <figure className={`portrait-item portrait-${index + 1}`} key={asset.id}>
        <img {...imageAttrs(asset)} alt={asset.alt} loading="lazy" decoding="async" />
        <figcaption>{asset.label}</figcaption>
      </figure>)}
    </div>
    <PageMeta number="06" label="PORTRAIT STUDIES" />
  </section>
}

function SelectedWorks() {
  const [principal, ...supporting] = selectedWorks
  return <section id="selected-works" className="selected page paper-page">
    <header className="editorial-head compact"><div><span>CHARACTER PRESENTATION / IMAGE STUDIES</span><h2>SELECTED WORKS</h2></div><p>保留非 Key Visual 的展示页与横向图像研究，不重复 01–03 的独立作品页。</p></header>
    <div className="selected-layout">
      <figure className="selected-item selected-primary selected-1">
        <img {...imageAttrs(principal)} alt={principal.alt} loading="lazy" decoding="async" />
        <figcaption>{principal.label}</figcaption>
      </figure>
      <div className="selected-supporting">
        {supporting.map((asset, index) => <figure className={`selected-item selected-support selected-${index + 2}`} key={asset.id}>
          <img {...imageAttrs(asset)} alt={asset.alt} loading="lazy" decoding="async" />
          <figcaption>{asset.label}</figcaption>
        </figure>)}
      </div>
    </div>
    <PageMeta number="07" label="SELECTED WORKS" />
  </section>
}

function AdditionalCharacterDesigns() {
  return <section id="additional-designs" className="additional page white-page">
    <header className="editorial-head compact"><div><span>TECHNICAL SHEETS / CHARACTER RANGE</span><h2>ADDITIONAL CHARACTER DESIGNS</h2></div><p>更多角色三视图设定，仅保留完整技术表可读性。</p></header>
    <div className="additional-grid">
      {additionalCharacterDesigns.map((asset) => {
        return <figure className="additional-item" key={asset.id}>
          <img {...imageAttrs(asset)} alt={asset.alt} loading="lazy" decoding="async" />
          <figcaption>{asset.label}</figcaption>
        </figure>
      })}
    </div>
    <PageMeta number="08" label="ADDITIONAL CHARACTER DESIGNS" />
  </section>
}

function ResumeContactSection() {
  return <section id="resume-contact" className="resume-contact final-chapter final-anatomy page">
    <div className="final-chapter-label" aria-label="Final chapter">
      <span>09 / FINAL CONTACT</span>
      <span>RESUME + CONTACT</span>
    </div>

    <figure className="contact-hands final-hands" style={{ '--contact-image': `url(${contactHandsTech.src})` }}>
      <img {...imageAttrs(contactHandsTech)} alt={contactHandsTech.alt} loading="lazy" decoding="async" />
      <svg className="hand-study-overlay" viewBox="0 0 1440 760" preserveAspectRatio="none" aria-hidden="true">
        <path className="study-arc study-arc-a" d="M318 588 C470 276 912 222 1104 546" />
        <path className="study-arc study-arc-b" d="M408 640 C560 404 838 370 1004 612" />
        <path className="study-guide study-axis" d="M720 204 L720 568" />
        <path className="study-guide" d="M474 392 L676 380" />
        <path className="study-guide" d="M764 380 L968 398" />
        <path className="study-guide study-guide-secondary" d="M544 444 L672 402" />
        <path className="study-guide study-guide-secondary" d="M768 402 L902 448" />
        <path className="study-dotline study-dotline-secondary" d="M604 330 L676 360" />
        <path className="study-dotline study-dotline-secondary" d="M764 360 L842 330" />
        <g className="study-cross">
          <path d="M704 382 H736" />
          <path d="M720 366 V398" />
        </g>
        <path className="study-measure" d="M740 382 H806" />
        <text className="study-number" x="812" y="386">C-09</text>
        <circle className="study-joint" cx="388" cy="372" r="16" />
        <circle className="study-joint" cx="456" cy="342" r="12" />
        <circle className="study-joint" cx="526" cy="358" r="10" />
        <circle className="study-joint" cx="592" cy="392" r="13" />
        <circle className="study-joint" cx="650" cy="380" r="8" />
        <circle className="study-joint" cx="790" cy="380" r="8" />
        <circle className="study-joint" cx="854" cy="394" r="13" />
        <circle className="study-joint" cx="916" cy="356" r="10" />
        <circle className="study-joint" cx="988" cy="342" r="12" />
        <circle className="study-joint" cx="1054" cy="374" r="16" />
        <circle className="study-marker" cx="720" cy="382" r="4" />
        <circle className="study-marker" cx="456" cy="342" r="3" />
        <circle className="study-marker" cx="650" cy="380" r="3" />
        <circle className="study-marker" cx="790" cy="380" r="3" />
        <circle className="study-marker" cx="988" cy="342" r="3" />
      </svg>
    </figure>

    <div className="final-identity">
      <h2>{'\u9EC4\u56FD\u6CF0'}</h2>
      <p>CHARACTER CONCEPT ARTIST</p>
    </div>

    <div id="resume-contact-resume" className="resume-contact-resume resume-anchor final-resume-panel">
      <p className="resume-profile">中国广东，角色原画师 / 角色概念设计。动漫制作技术专业背景，曾负责手游角色设定设计，并参与素材建模与贴图绘制。</p>
      <div className="resume-compact-facts">
        <p><span>LOCATION</span>中国广东</p>
        <p><span>EDUCATION</span>广东文理职业学院 / 动漫制作技术</p>
        <p><span>INTENTION</span>角色原画师 / 角色概念设计</p>
      </div>
      <div className="resume-compact-experience">
        <h3>EXPERIENCE</h3>
        <article><time>2021.11 – 2024.11</time><h4>深圳市知返科技有限公司</h4><p>手游角色设定设计；根据世界观与策划文案完成角色概念、造型、服饰与道具设计。</p></article>
        <article><time>2021.01 – 2021.06</time><h4>茂名风采品牌策划有限公司 / 美术实习生</h4><p>参与素材建模与贴图绘制，根据反馈协作迭代设计，并将成果应用于项目终版。</p></article>
      </div>
    </div>

    <div id="resume-contact-contact" className="contact-page hand-contact contact-subsection contact-anchor final-contact-panel">
      <a href="mailto:2488731102@qq.com"><span>EMAIL</span>2488731102@qq.com</a>
      <p><span>WECHAT</span>Veiko_9029</p>
      <a href="#title"><span>BACK TO TOP</span></a>
    </div>
  </section>
}

function App() {
  usePortfolioMotion()
  const query = new URLSearchParams(window.location.search)
  const directContentsCapture = query.get('contentsCapture') === '1'

  return <main className={directContentsCapture ? 'contents-capture-direct' : undefined}>
    <TitleSection />
    <ContentsSection />
    <KeyVisualPage id="key-visual-01" number="01" title="KEY VISUAL 01" asset={artworkOne} variant="one" />
    <KeyVisualPage id="key-visual-02" number="02" title="KEY VISUAL 02" asset={artworkTwo} variant="two" />
    <KeyVisualPage id="key-visual-03" number="03" title="KEY VISUAL 03" asset={artworkThree} variant="three" />
    <CharacterSheets />
    <CostumeDetail />
    <PortraitStudies />
    <SelectedWorks />
    <AdditionalCharacterDesigns />
    <ResumeContactSection />
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
