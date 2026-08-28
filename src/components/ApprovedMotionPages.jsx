import React, { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import {
  createApprovedDirectoryTimeline,
  createApprovedEndTimeline,
  createApprovedHomeTimeline,
  createApprovedPage03Timeline,
} from '../motion/approvedMotionTimelines.js'

const base = import.meta.env.BASE_URL
const assetPath = (page, filename) => `${base}assets/approved-motion/${page}/${filename}`
const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

const DIRECTORY_DESTINATIONS = Object.freeze([
  { key: '1', href: '#key-visual-01', label: '01 Key Visuals' },
  { key: '2', href: '#key-visual-02', label: '02 Characters' },
  { key: '3', href: '#key-visual-03', label: '03 Concept Art' },
  { key: '4', href: '#character-sheets', label: '04 Character Sheets' },
  { key: '5', href: '#costume-detail', label: '05 Costume Construction' },
  { key: '6', href: '#portrait-studies', label: '06 Identity and Expression' },
  { key: '6b', href: '#selected-works', label: '06 Character Presentation' },
  { key: '7', href: '#additional-designs', label: '07 Character Design Archive' },
  { key: '8', href: '#end', label: 'End About and Contact' },
])

const activateAnchorOnSpace = (event) => {
  if (event.key !== ' ' && event.code !== 'Space') return
  event.preventDefault()
  event.currentTarget.click()
}

const activateImageSources = (root) => {
  const allImages = [...root.querySelectorAll('img')]
  allImages.forEach((image) => {
    if (image.dataset.approvedSrc && image.src !== image.dataset.approvedSrc) {
      image.loading = 'eager'
      image.src = image.dataset.approvedSrc
    }
  })
  return allImages
}

const preloadImages = async (root) => {
  const allImages = activateImageSources(root)
  const criticalImages = allImages.filter((image) => image.dataset.motionCritical === 'true')
  const images = criticalImages.length ? criticalImages : allImages.slice(0, 1)
  await Promise.allSettled(images.map(async (image) => {
    if (!image.complete) {
      await new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true })
        image.addEventListener('error', resolve, { once: true })
      })
    }
    if (typeof image.decode === 'function') await image.decode().catch(() => {})
  }))
}

function useApprovedMotion(createTimeline, { eventName, current = false } = {}) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const section = root.closest('section') || root
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.matchMedia('(max-width: 900px)').matches
    let timeline
    let active = false
    let disposed = false
    let enterToken = 0

    const context = gsap.context(() => {
      timeline = createTimeline(root)
      timeline.progress(0).pause()
    }, root)
    root.__approvedMotionTimeline = timeline
    root.dataset.motionState = 'initial'
    if (root.dataset.approvedMotion === 'directory' && window.location.hash !== '#contents') {
      section.dataset.archivePhase = 'complete'
    }

    const showFinal = () => {
      timeline.progress(1).pause()
      root.dataset.motionState = 'complete'
      root.dataset.motionMode = reduced ? 'reduced' : 'mobile-final'
      if (root.dataset.approvedMotion === 'directory') section.dataset.archivePhase = 'complete'
    }

    const play = async ({ restart = false } = {}) => {
      if (disposed || reduced || mobile) return
      const token = ++enterToken
      root.dataset.motionState = 'loading'
      if (root.dataset.approvedMotion === 'directory') section.dataset.archivePhase = 'initial'
      await preloadImages(root)
      if (disposed || token !== enterToken || !active) return
      root.dataset.motionState = 'playing'
      root.dataset.playCount = String((Number(root.dataset.playCount) || 0) + 1)
      if (root.dataset.approvedMotion === 'directory') section.dataset.archivePhase = 'playing'
      if (restart || timeline.progress() > 0) timeline.restart()
      else timeline.play(0)
    }

    if (reduced || mobile) {
      if (reduced && current) activateImageSources(root)
      showFinal()
      return () => {
        disposed = true
        timeline?.kill()
        delete root.__approvedMotionTimeline
        context.revert()
      }
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== section) continue
        if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
          const revisiting = root.dataset.hasEntered === 'true'
          root.dataset.hasEntered = 'true'
          active = true
          void play({ restart: revisiting })
        } else if (!entry.isIntersecting) {
          active = false
          enterToken += 1
          timeline.pause()
        }
      }
    }, { threshold: [0, 0.28, 0.6] })

    observer.observe(section)

    const replay = () => {
      active = true
      void play({ restart: true })
    }
    if (eventName) window.addEventListener(eventName, replay)

    if (current) {
      active = true
      void play()
    }

    return () => {
      disposed = true
      observer.disconnect()
      if (eventName) window.removeEventListener(eventName, replay)
      timeline?.kill()
      delete root.__approvedMotionTimeline
      context.revert()
    }
  }, [createTimeline, eventName, current])

  return rootRef
}

const LayerImage = ({ page, file, alt = '', loading = 'lazy', className, critical = false, ...props }) => (
  <img
    className={className}
    src={transparentPixel}
    data-approved-src={assetPath(page, file)}
    alt={alt}
    loading={loading}
    decoding="async"
    draggable="false"
    data-motion-critical={critical || undefined}
    {...props}
  />
)

export function ApprovedHomeMotion() {
  const ref = useApprovedMotion(createApprovedHomeTimeline, {
    eventName: 'portfolio:home-enter',
    current: !window.location.hash,
  })

  return <div ref={ref} className="approved-motion-desktop approved-motion-home" data-approved-motion="home">
    <div className="approved-motion-canvas">
      <div className="am-layer"><LayerImage page="home" file="home-background-paper.png" loading="eager" critical /></div>
      <div className="am-layer"><LayerImage page="home" file="home-background-neutralized.png" loading="eager" critical /></div>
      <div className="am-layer am-home-focus" data-home-focus><LayerImage page="home" file="home-layer-statue-disc-v2.png" loading="eager" critical /></div>
      <div className="am-layer am-reveal-right" data-home-rocks><LayerImage page="home" file="home-layer-rocks.png" loading="eager" /></div>
      <div className="am-layer am-reveal-diagonal" data-home-frame><LayerImage page="home" file="home-layer-frame.png" loading="eager" /></div>
      <div className="am-layer am-reveal-up" data-home-blue><LayerImage page="home" file="home-layer-blue-accents.png" loading="eager" /></div>
      <div className="am-layer am-reveal-right" data-home-birds><LayerImage page="home" file="home-layer-birds.png" loading="eager" /></div>
      <div className="am-layer am-reveal-diagonal" data-home-fine><LayerImage page="home" file="home-layer-fine-marks.png" loading="eager" /></div>
    </div>
  </div>
}

const ROUTE_PATHS = [
  'M1.26249 236.067H135.545L192.931 273.942L272.123 298.044',
  'M272.123 298.044H433.951L503.962 153.432',
  'M503.962 153.432L652.017 107.523L730.062 1.93335',
  'M730.062 1.93335L899.923 172.943H928.616L1013.55 96.046',
  'M1013.55 96.046L1183.41 216.556L1245.39 281.976',
  'M1245.39 281.976L1377.37 329.032L1442.79 190.159',
  'M1442.79 190.159L1639.05 77.6825',
]

const NODE_PATHS = [
  'M24.5436 245.693L14.8049 235.954C13.9085 235.058 12.4551 235.058 11.5587 235.954L1.82003 245.693C0.923609 246.589 0.923609 248.042 1.82003 248.939L11.5587 258.678C12.4551 259.574 13.9085 259.574 14.8049 258.678L24.5436 248.939C25.4401 248.042 25.4401 246.589 24.5436 245.693Z',
  'M295.404 307.669L285.666 297.931C284.769 297.034 283.316 297.034 282.42 297.931L272.681 307.669C271.784 308.566 271.784 310.019 272.681 310.916L282.42 320.654C283.316 321.551 284.769 321.551 285.666 320.654L295.404 310.916C296.301 310.019 296.301 308.566 295.404 307.669Z',
  'M527.243 163.057L517.504 153.318C516.608 152.422 515.154 152.422 514.258 153.318L504.519 163.057C503.623 163.954 503.623 165.407 504.519 166.303L514.258 176.042C515.154 176.938 516.608 176.938 517.504 176.042L527.243 166.303C528.139 165.407 528.139 163.954 527.243 163.057Z',
  'M753.343 11.5587L743.604 1.82001C742.708 0.923592 741.254 0.923592 740.358 1.82001L730.619 11.5587C729.723 12.4551 729.723 13.9085 730.619 14.8049L740.358 24.5436C741.254 25.44 742.708 25.44 743.604 24.5436L753.343 14.8049C754.239 13.9085 754.239 12.4551 753.343 11.5587Z',
  'M1268.67 291.601L1258.93 281.863C1258.03 280.966 1256.58 280.966 1255.68 281.863L1245.94 291.601C1245.05 292.498 1245.05 293.951 1245.94 294.848L1255.68 304.586C1256.58 305.483 1258.03 305.483 1258.93 304.586L1268.67 294.848C1269.56 293.951 1269.56 292.498 1268.67 291.601Z',
  'M1400.65 338.658L1390.92 328.919C1390.02 328.022 1388.57 328.022 1387.67 328.919L1377.93 338.658C1377.03 339.554 1377.03 341.007 1377.93 341.904L1387.67 351.642C1388.57 352.539 1390.02 352.539 1390.92 351.642L1400.65 341.904C1401.55 341.007 1401.55 339.554 1400.65 338.658Z',
  'M1466.07 199.784L1456.34 190.045C1455.44 189.149 1453.99 189.149 1453.09 190.045L1443.35 199.784C1442.45 200.68 1442.45 202.134 1443.35 203.03L1453.09 212.769C1453.99 213.665 1455.44 213.665 1456.34 212.769L1466.07 203.03C1466.97 202.134 1466.97 200.68 1466.07 199.784Z',
  'M1662.33 87.308L1652.59 77.5693C1651.7 76.6729 1650.24 76.6729 1649.35 77.5693L1639.61 87.308C1638.71 88.2044 1638.71 89.6578 1639.61 90.5542L1649.35 100.293C1650.24 101.189 1651.7 101.189 1652.59 100.293L1662.33 90.5542C1663.23 89.6578 1663.23 88.2044 1662.33 87.308Z',
]

const DIRECTORY_LABELS = [
  { n: '01', tag: ['KEY VISUALS'], secondary: ['PROJECT OVERVIEW', 'VISUAL SUMMARY'], number: [74.64, 529.7], tagBox: [70.05, 577.29, 112.54, 25.25], secondaryPos: [75.79, 627.9] },
  { n: '02', tag: ['CHARACTERS'], secondary: ['CHARACTER DESIGN', '& PROFILES'], number: [324.98, 656], tagBox: [322.68, 697.8, 104.5, 25.25], secondaryPos: [324.98, 742.6] },
  { n: '03', tag: ['CONCEPT ART'], secondary: ['IDEATION', '& EXPLORATION'], number: [578.76, 450.6], tagBox: [576.46, 496.94, 113.68, 25.25], secondaryPos: [578.76, 535.9] },
  { n: '04', tag: ['CHARACTER SHEETS'], secondary: ['MODEL SHEETS', '& DETAILS'], number: [811.85, 293.2], tagBox: [809.55, 339.72, 157.32, 26.4], secondaryPos: [811.85, 376.4] },
  { n: '05', tag: ['COSTUME', 'CONSTRUCTION'], secondary: ['COSTUME BREAKDOWN', '& MATERIALS'], number: [1054.15, 459.5], tagBox: [1049.56, 506.14, 119.43, 44.76], secondaryPos: [1054.15, 558.5] },
  { n: '06', tag: ['IDENTITY &', 'EXPRESSION'], secondary: ['EXPRESSION SHEETS', '& EMOTIONAL STUDY'], number: [1327.46, 639.4], tagBox: [1325.16, 684.04, 110.24, 44.76], secondaryPos: [1327.46, 742.6] },
  { n: '07', tag: ['CHARACTER DESIGN', 'ARCHIVE'], secondary: ['ARCHIVE COLLECTION', '& VARIATIONS'], number: [1443.51, 458.4], tagBox: [1438.91, 506.14, 152.73, 45.91], secondaryPos: [1443.51, 559.6] },
  { n: 'END', tag: ['ABOUT / CONTACT'], secondary: ['INFO & CONTACT', 'DETAILS'], number: [1732.49, 407], tagBox: [1731.34, 446.45, 150.43, 26.4], secondaryPos: [1733.64, 493.4] },
]

export function ApprovedDirectoryMotion() {
  const ref = useApprovedMotion(createApprovedDirectoryTimeline, {
    eventName: 'portfolio:directory-history-enter',
    current: window.location.hash === '#contents',
  })

  const activateOnSpace = (event) => {
    if (event.key !== ' ') return
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null
    if (!link) return
    event.preventDefault()
    link.click()
  }

  return <div ref={ref} className="approved-motion-desktop approved-motion-directory" data-approved-motion="directory" onKeyDown={activateOnSpace}>
    <div className="approved-motion-canvas">
      <div className="am-directory-registered">
        <div className="am-layer"><LayerImage page="directory" file="directory-clean-background-v4.png" critical /></div>
        <LayerImage page="directory" file="directory-title.svg" className="am-directory-title" data-directory-title critical />
        <svg className="am-directory-route" viewBox="0 0 1641 331" aria-hidden="true">
          {ROUTE_PATHS.map((path) => <path key={path} d={path} data-directory-route />)}
        </svg>
        <svg className="am-directory-nodes" viewBox="0 0 1665 354" aria-hidden="true">
          {NODE_PATHS.map((path) => <path key={path} d={path} data-directory-node fill="#1488FF" stroke="#fff" strokeWidth="2.29543" />)}
        </svg>
        {DIRECTORY_LABELS.map((label, index) => <div className="am-directory-label" data-directory-label key={label.n}>
          <div className={`am-directory-number ${label.n === 'END' ? 'is-end' : ''}`} style={{ left: label.number[0], top: label.number[1] }}>{label.n}</div>
          <div className={`am-directory-tag ${label.tag.length > 1 ? 'is-multiline' : ''}`} style={{ left: label.tagBox[0], top: label.tagBox[1], width: label.tagBox[2], height: label.tagBox[3] }}>
            {label.tag.map((line) => <span key={line}>{line}</span>)}
          </div>
          <div className="am-directory-secondary" style={{ left: label.secondaryPos[0], top: label.secondaryPos[1] }}>
            {label.secondary.map((line) => <span key={line}>{line}</span>)}
          </div>
          <a className="am-directory-label-hit" href={DIRECTORY_DESTINATIONS[index >= 6 ? index + 1 : index].href} aria-label={DIRECTORY_DESTINATIONS[index >= 6 ? index + 1 : index].label} onKeyDown={activateAnchorOnSpace} style={{ left: label.number[0] - 10, top: label.number[1] - 8, width: Math.max(205, label.tagBox[2] + 30), height: 125 }} />
          {label.n === '06' ? <a className="am-directory-secondary-hit" href="#selected-works" aria-label="06 Character Presentation" onKeyDown={activateAnchorOnSpace} style={{ left: label.secondaryPos[0] - 8, top: label.secondaryPos[1] + 13, width: 150, height: 18 }} /> : null}
        </div>)}
        {DIRECTORY_DESTINATIONS.filter((entry) => entry.key !== '6b').map((destination, index) => {
          const points = [[43.8, 622.2], [314.6, 684.2], [546.5, 539.6], [772.6, 388.1], [1287.9, 668.1], [1419.9, 715.2], [1485.3, 576.3], [1681.6, 463.9]]
          return <a
            className="am-directory-node-hit approved-directory-route-node"
            href={destination.href}
            aria-label={destination.label}
            data-chapter={destination.key === '8' ? '09' : destination.key.padStart(2, '0')}
            onKeyDown={activateAnchorOnSpace}
            key={destination.key}
            style={{ left: points[index][0] - 14, top: points[index][1] - 14 }}
          />
        })}
      </div>
    </div>
  </div>
}

export function ApprovedPage03Motion() {
  const ref = useApprovedMotion(createApprovedPage03Timeline, {
    current: window.location.hash === '#key-visual-03',
  })

  return <div ref={ref} className="approved-motion-desktop approved-motion-page03" data-approved-motion="page03">
    <div className="approved-motion-canvas">
      <div className="am-page03-registered">
        <div className="am-layer"><LayerImage page="page03" file="page03-background-paper.png" critical /></div>
        <div className="am-layer"><LayerImage page="page03" file="page03-background-mountain-wash.png" critical /></div>
        <LayerImage page="page03" file="page03-gold-diagonal-guides.svg" className="am-page03-gold" data-p3-gold />
        <div className="am-page03-art-parent">
          <div className="am-page03-part" data-p3-opening><LayerImage page="page03" file="page03-part-opening-character-snake-v2.png" critical /></div>
          <div className="am-page03-part am-soft-115" data-p3-snake-rear><LayerImage page="page03" file="page03-part-snake-rear-v2.png" /></div>
          <div className="am-page03-part am-soft-left" data-p3-ribbons><LayerImage page="page03" file="page03-part-ribbons-v2.png" /></div>
          <div className="am-page03-part am-soft-right" data-p3-energy><LayerImage page="page03" file="page03-part-energy-v2.png" /></div>
          <div className="am-page03-part am-soft-right" data-p3-waves><LayerImage page="page03" file="page03-part-waves-v2.png" /></div>
          <div className="am-page03-part am-soft-115" data-p3-remainder><LayerImage page="page03" file="page03-part-remainder-v2.png" /></div>
        </div>
        <div className="am-page03-ui" data-p3-ui-left><LayerImage page="page03" file="page03-ui-left-primary.png" /></div>
        <div className="am-page03-ui" data-p3-ui-top><LayerImage page="page03" file="page03-ui-top-rules.png" /></div>
        <div className="am-page03-ui" data-p3-ui-right><LayerImage page="page03" file="page03-ui-right-markers.png" /></div>
        <div className="am-page03-ui" data-p3-ui-bottom><LayerImage page="page03" file="page03-ui-bottom-wedge.png" /></div>
      </div>
    </div>
  </div>
}

const EndFragment = ({ name, file, style }) => (
  <div className="am-end-title-fragment" data-end-title-fragment data-end-letter={name} style={style}>
    <LayerImage page="end" file={file} />
  </div>
)

export function ApprovedEndMotion() {
  const ref = useApprovedMotion(createApprovedEndTimeline, {
    current: ['#end', '#resume-contact-resume', '#resume-contact-contact'].includes(window.location.hash),
  })

  return <div ref={ref} className="approved-motion-desktop approved-motion-end" data-approved-motion="end">
    <div className="approved-motion-canvas">
      <div className="am-layer"><LayerImage page="end" file="end-background-train-clean-v4.png" critical /></div>
      <div className="am-layer am-end-upper" data-end-upper><LayerImage page="end" file="end-upper-xray-hand-clean-v4.png" critical /></div>
      <div className="am-layer am-end-lower" data-end-lower><LayerImage page="end" file="end-lower-xray-hand-clean-v4.png" /></div>
      <div className="am-layer" data-end-blue><LayerImage page="end" file="end-blue-guides-clean-v4.png" /></div>
      <div className="am-layer" data-end-cloud><LayerImage page="end" file="end-cloud-panels-clean-v4.png" /></div>
      <div className="am-layer" data-end-log><LayerImage page="end" file="end-system-log-clean-v4.png" /></div>
      <EndFragment name="e" file="end-letter-e.svg" style={{ left: 120, top: 6.75, width: 75, height: 78.75 }} />
      <EndFragment name="n" file="end-letter-n.svg" style={{ left: 390, top: 420, width: 120, height: 150 }} />
      <EndFragment name="d" file="end-letter-d.svg" style={{ left: 1620, top: 720, width: 86.25, height: 105 }} />
      <EndFragment name="t" file="end-letter-t.svg" style={{ left: 41.25, top: 914.25, width: 108.75, height: 161.25 }} />
      <EndFragment name="l" file="end-letter-l.svg" style={{ left: 1710, top: 855, width: 157.5, height: 221.25 }} />
      <EndFragment name="the-end" file="end-title-the-end.svg" style={{ left: 1432.5, top: 352.5, width: 255, height: 165 }} />
      <a className="am-end-return" href="#title" aria-label="Return to homepage" />
    </div>
  </div>
}

