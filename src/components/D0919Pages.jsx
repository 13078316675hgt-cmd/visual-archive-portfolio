import React, { useLayoutEffect, useRef } from 'react'
import { initD0919DirectoryMotion, initD0919Page01Motion } from '../motion/d0919Motion.js'
import { PerformancePicture } from './PerformancePicture.jsx'

const base = import.meta.env.BASE_URL
const directoryAsset = (filename) => `${base}assets/d09-19-directory/${filename}`
const page01Asset = `${base}assets/d09-19-page01/page01-original-art-crop-1515x1780.png`

const CANVAS = Object.freeze({ width: 1875, height: 903 })

const DIRECTORY_NODES = Object.freeze([
  {
    number: '01',
    zh: '关键视觉',
    en: ['KEY VISUALS'],
    href: '#key-visual-01',
    source: 'directory-thumb-01.webp',
    alt: '蓝色东方幻想角色、龙与建筑构成的关键视觉作品',
    imageSize: [900, 1163],
    frame: [394, 512, 102, 148],
    label: [516, 588],
    labelWidth: 190,
    fit: 'cover',
  },
  {
    number: '02',
    zh: '角色设定',
    en: ['CHARACTERS'],
    href: '#key-visual-02',
    source: 'directory-thumb-02.webp',
    alt: '深色角色与环形生物构成的角色设定作品',
    imageSize: [900, 1163],
    frame: [585, 302, 120, 162],
    label: [726, 354],
    labelWidth: 170,
    fit: 'cover',
  },
  {
    number: '03',
    zh: '概念艺术',
    en: ['CONCEPT ART'],
    href: '#key-visual-03',
    source: 'directory-thumb-03.webp',
    alt: '绿色骨骼结构与角色构成的概念艺术作品',
    imageSize: [900, 998],
    frame: [813, 453, 109, 154],
    label: [944, 566],
    labelWidth: 180,
    fit: 'cover',
  },
  {
    number: '04',
    zh: '角色设定集',
    en: ['CHARACTER SHEETS'],
    href: '#character-sheets',
    source: 'directory-thumb-04.webp',
    alt: '黑色服装角色三视图设定',
    imageSize: [900, 600],
    frame: [1005, 302, 121, 163],
    label: [1156, 354],
    labelWidth: 210,
    fit: 'contain',
  },
  {
    number: '05',
    zh: '服装构造',
    en: ['COSTUME', 'CONSTRUCTION'],
    href: '#costume-detail',
    source: 'directory-thumb-05.webp',
    alt: '红黑服装角色设计图',
    imageSize: [900, 714],
    frame: [1105, 541, 89, 135],
    label: [1221, 588],
    labelWidth: 190,
    fit: 'contain',
  },
  {
    number: '06',
    zh: '身份与表达',
    en: ['IDENTITY &', 'EXPRESSION'],
    href: '#portrait-studies',
    secondaryHref: '#selected-works',
    source: 'directory-thumb-06.webp',
    alt: '白发角色面部与表情研究',
    imageSize: [900, 633],
    frame: [972, 672, 95, 137],
    label: [1091, 730],
    labelWidth: 210,
    fit: 'cover',
  },
  {
    number: '07',
    zh: '角色设计档案',
    en: ['CHARACTER', 'DESIGN ARCHIVE'],
    href: '#additional-designs',
    source: 'directory-thumb-07.webp',
    alt: '蓝色服装角色完整设计图',
    imageSize: [900, 600],
    frame: [1336, 427, 102, 138],
    label: [1471, 480],
    labelWidth: 230,
    fit: 'contain',
  },
])

const pctX = (value) => `${(value / CANVAS.width) * 100}%`
const pctY = (value) => `${(value / CANVAS.height) * 100}%`

function PixelWarningMark() {
  return <svg className="d0919-directory-warning" viewBox="0 0 64 56" aria-label="Archive warning">
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
}

function PreviewWindow({ item }) {
  const [width, height] = item.imageSize
  const sourceKey = item.source.replace(/\.[^.]+$/, '')
  const fallback = directoryAsset(item.source)
  const pdfMode = document.documentElement.classList.contains('portfolio-pdf-mode')
  return <span className="d0919-directory-window" data-d0919-frame>
    <span className="d0919-directory-window-title" aria-hidden="true">
      <small>Frame.Com_{item.number}</small>
      <i /><i /><b />
    </span>
    <span className="d0919-directory-preview directory-asset-preview">
      <PerformancePicture
        sourceKey={sourceKey}
        widths={[360, 720, 900]}
        fallback={fallback}
        sizes="(max-width: 900px) 40vw, 12vw"
        disabled={pdfMode}
        alt={item.alt}
        width={width}
        height={height}
        loading="eager"
        decoding="async"
        draggable="false"
        style={{ '--asset-fit': item.fit }}
      />
    </span>
    <span className="d0919-directory-window-status" aria-hidden="true">
      <small>Asset_{item.number}</small><i /><i /><i />
    </span>
  </span>
}

function DirectoryLabel({ item }) {
  return <span className="d0919-directory-label" data-d0919-label>
    <b>{item.number}</b>
    <strong>{item.zh}</strong>
    <span>{item.en.map((line) => <span key={line}>{line}</span>)}</span>
  </span>
}

function DirectoryNode({ item }) {
  const [frameX, frameY, frameWidth, frameHeight] = item.frame
  const [labelX, labelY] = item.label
  const x = Math.min(frameX, labelX)
  const y = Math.min(frameY, labelY)
  const right = Math.max(frameX + frameWidth, labelX + item.labelWidth)
  const bottom = Math.max(frameY + frameHeight, labelY + 78)
  const nodeWidth = right - x
  const nodeHeight = bottom - y
  const localX = (value) => `${(value / nodeWidth) * 100}%`
  const localY = (value) => `${(value / nodeHeight) * 100}%`
  const style = {
    '--node-left': pctX(x),
    '--node-top': pctY(y),
    '--node-width': pctX(nodeWidth),
    '--node-height': pctY(nodeHeight),
    '--frame-left': localX(frameX - x),
    '--frame-top': localY(frameY - y),
    '--frame-width': localX(frameWidth),
    '--frame-height': localY(frameHeight),
    '--label-left': localX(labelX - x),
    '--label-top': localY(labelY - y),
    '--label-width': localX(item.labelWidth),
  }

  if (item.secondaryHref) {
    return <article
      className={`d0919-directory-node d0919-directory-node-${item.number} approved-directory-route-node`}
      style={style}
      data-chapter={item.number}
      data-d0919-node={item.number}
    >
      <a className="d0919-directory-primary" href={item.href} aria-label={`${item.number} ${item.zh} ${item.en.join(' ')}`}>
        <PreviewWindow item={item} />
        <DirectoryLabel item={item} />
      </a>
      <a className="d0919-directory-secondary" href={item.secondaryHref}>CHARACTER PRESENTATION <span aria-hidden="true">→</span></a>
    </article>
  }

  return <a
    className={`d0919-directory-node d0919-directory-node-${item.number} approved-directory-route-node`}
    href={item.href}
    style={style}
    data-chapter={item.number}
    data-d0919-node={item.number}
    aria-label={`${item.number} ${item.zh} ${item.en.join(' ')}`}
  >
    <PreviewWindow item={item} />
    <DirectoryLabel item={item} />
  </a>
}

function DirectoryRoutes() {
  return <svg className="d0919-directory-routes" viewBox="0 0 1875 903" preserveAspectRatio="none" aria-hidden="true">
    <g className="d0919-route-lines">
      <path pathLength="1" data-d0919-route d="M129 711H651V563H793" />
      <path pathLength="1" data-d0919-route d="M496 563H651" />
      <path pathLength="1" data-d0919-route d="M651 563V477" />
      <path pathLength="1" data-d0919-route d="M705 374H881V453" />
      <path pathLength="1" data-d0919-route d="M922 529H881V750H972" />
      <path pathLength="1" data-d0919-route d="M881 374H1005" />
      <path pathLength="1" data-d0919-route d="M1077 465V608H1105" />
      <path pathLength="1" data-d0919-route d="M1077 511H1336" />
      <path pathLength="1" data-d0919-route d="M1067 750H1362" />
    </g>
    <g className="d0919-route-junctions">
      <circle data-d0919-junction cx="651" cy="563" r="6" />
      <circle data-d0919-junction cx="881" cy="389" r="6" />
      <circle data-d0919-junction cx="1077" cy="511" r="6" />
    </g>
    <g className="d0919-route-arrows">
      <path d="M793 563l-7-4v8z" />
      <path d="M651 477l-4 7h8z" />
      <path d="M1005 374l-7-4v8z" />
      <path d="M1105 608l-7-4v8z" />
      <path d="M1336 511l-7-4v8z" />
      <path d="M972 750l-7-4v8z" />
      <path d="M1362 750l-7-4v8z" />
    </g>
  </svg>
}

function DirectoryEndNode() {
  const pdfMode = document.documentElement.classList.contains('portfolio-pdf-mode')
  return <a className="d0919-directory-end" href="#end" data-d0919-node="END" aria-label="END 关于 联系 ABOUT CONTACT">
    <PerformancePicture
      sourceKey="directory-end"
      widths={[480, 960, 1672]}
      fallback={directoryAsset('directory-end-source.png')}
      sizes="(max-width: 900px) 45vw, 11vw"
      disabled={pdfMode}
      alt=""
      width="1672"
      height="941"
      loading="eager"
      decoding="async"
      draggable="false"
    />
    <span data-d0919-label>
      <b>END</b>
      <strong>关于 / 联系</strong>
      <small>ABOUT / CONTACT</small>
    </span>
  </a>
}

export function D0919Directory() {
  const sectionRef = useRef(null)
  const pdfMode = document.documentElement.classList.contains('portfolio-pdf-mode')
  useLayoutEffect(() => initD0919DirectoryMotion(sectionRef.current), [])

  return <section
    ref={sectionRef}
    id="contents"
    className="contents page d0919-directory"
    data-directory-phase="initial"
    tabIndex={-1}
  >
    <div className="d0919-directory-canvas">
      <div className="d0919-directory-atmosphere" aria-hidden="true">
        <PerformancePicture
          sourceKey="directory-thumb-01"
          widths={[360, 720, 900]}
          fallback={directoryAsset('directory-thumb-01.webp')}
          sizes="20vw"
          disabled={pdfMode}
          className="d0919-directory-ghost d0919-directory-ghost-left"
          alt=""
          width="900"
          height="1163"
          loading="lazy"
          decoding="async"
        />
        <PerformancePicture
          sourceKey="directory-thumb-07"
          widths={[360, 720, 900]}
          fallback={directoryAsset('directory-thumb-07.webp')}
          sizes="20vw"
          disabled={pdfMode}
          className="d0919-directory-ghost d0919-directory-ghost-right"
          alt=""
          width="900"
          height="600"
          loading="lazy"
          decoding="async"
        />
      </div>
      <header className="d0919-directory-header" data-d0919-header>
        <PixelWarningMark />
        <p>E C H O N O 3&nbsp;&nbsp;2 4 1 3 8</p>
        <h2>/ 目录 /</h2>
        <strong>D I R E C T O R Y</strong>
        <small>I N D E X&nbsp;&nbsp;N A V I G A T I O N</small>
      </header>
      <p className="d0919-directory-error" aria-hidden="true">
        E . R . O . R<br />
        E V E N T&nbsp;&nbsp;A R C H I V E S&nbsp;&nbsp;F O U N D<br />
        S I G N A L&nbsp;&nbsp;C O N F L I C T :&nbsp;&nbsp;N O . 2 4 1 3 8
      </p>
      <DirectoryRoutes />
      <nav className="d0919-directory-nodes" aria-label="作品集目录">
        {DIRECTORY_NODES.map((item) => <DirectoryNode item={item} key={item.number} />)}
        <DirectoryEndNode />
      </nav>
      <p className="d0919-directory-status" aria-hidden="true">
        C A T E G O R Y&nbsp;&nbsp;&nbsp;E C H O F I L E S<br />
        S T A T U S&nbsp;&nbsp;:&nbsp;&nbsp;A C T I V E
      </p>
      <span className="d0919-directory-dot-grid d0919-directory-dot-grid-a" aria-hidden="true" />
      <span className="d0919-directory-dot-grid d0919-directory-dot-grid-b" aria-hidden="true" />
      <a className="d0919-directory-return" href="#title">RETURN / TITLE</a>
    </div>
  </section>
}

function Page01Brand() {
  return <div className="d0919-page01-brand" aria-label="Visual Archive Concept Design">
    <span aria-hidden="true"><i /><i /><i /></span>
    <strong>VISUAL ARCHIVE</strong>
    <b aria-hidden="true" />
    <small>CONCEPT DESIGN</small>
  </div>
}

export function D0919Page01() {
  const sectionRef = useRef(null)
  const pdfMode = document.documentElement.classList.contains('portfolio-pdf-mode')
  useLayoutEffect(() => initD0919Page01Motion(sectionRef.current), [])

  return <section
    ref={sectionRef}
    id="key-visual-01"
    className="key-visual-page key-visual-one page d0919-page01"
    data-d0919-page01-phase="initial"
  >
    <div className="d0919-page01-canvas">
      <Page01Brand />
      <nav className="d0919-page01-topnav" aria-label="Key visual navigation">
        <a href="#contents"><span aria-hidden="true">‹</span> PREV</a>
        <a href="#key-visual-02">NEXT <span aria-hidden="true">›</span></a>
        <a className="d0919-page01-grid-link" href="#contents" aria-label="Back to directory">
          {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
        </a>
      </nav>

      <figure className="d0919-page01-art" data-d0919-page01-art>
        <PerformancePicture
          sourceKey="page01-original-art"
          widths={[720, 1280, 1515]}
          fallback={page01Asset}
          sizes="(max-width: 900px) 92vw, 67vw"
          disabled={pdfMode}
          alt="蓝色东方幻想建筑、黑龙与黑衣角色构成的关键视觉插画"
          width="1515"
          height="1780"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable="false"
        />
      </figure>

      <div className="d0919-page01-left" data-d0919-page01-copy>
        <span className="d0919-page01-star" aria-hidden="true">✦</span>
        <b className="d0919-page01-number">01</b>
        <p className="d0919-page01-project">PROJECT</p>
        <h2><span>KEY</span><span>VISUAL</span></h2>
        <div className="d0919-page01-facts">
          <p><small>WORK TYPE</small>CHARACTER ILLUSTRATION</p>
          <p><small>FOCUS</small>CHARACTER · DRAGON · ARCHITECTURE</p>
        </div>
      </div>

      <aside className="d0919-page01-side" data-d0919-page01-meta>
        <i aria-hidden="true" />
        <strong>KEY VISUAL</strong>
        <b>01 / 07</b>
        <span>SELECTED WORK</span>
        <em aria-hidden="true" /><em aria-hidden="true" /><em aria-hidden="true" />
      </aside>

      <nav className="d0919-page01-bottom" aria-label="Selected work pages">
        <a className="is-current" href="#key-visual-01"><b>01</b><span>KEY VISUAL 01<small>CHARACTER ILLUSTRATION</small></span></a>
        <a href="#key-visual-02"><b>02</b><span>KEY VISUAL 02<small>CHARACTER ILLUSTRATION</small></span></a>
        <a href="#key-visual-03"><b>03</b><span>KEY VISUAL 03<small>CHARACTER ILLUSTRATION</small></span></a>
        <a className="d0919-page01-directory-link" href="#contents">DIRECTORY / INDEX</a>
      </nav>
    </div>
  </section>
}

export { DIRECTORY_NODES, page01Asset }
