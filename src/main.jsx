import React from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import './styles.css'
import './gallery.css'
import {
  additionalCharacterDesigns,
  artworkManifest,
  artworkOne,
  artworkThree,
  artworkTwo,
  characterSheets,
  contactHandsTech,
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
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement

    root.classList.toggle('motion-reduced', reduceMotion)

    const scrollToCurrentHash = () => {
      if (!window.location.hash) return
      const target = ['#resume-contact-resume', '#resume-contact-contact'].includes(window.location.hash)
        ? document.querySelector('#resume-contact')
        : document.querySelector(window.location.hash)
      target?.scrollIntoView({ block: 'start' })
    }

    const hashTimers = []
    const clearHashTimers = () => {
      while (hashTimers.length) window.clearTimeout(hashTimers.pop())
    }
    const queueHashCorrection = () => {
      clearHashTimers()
      if (!window.location.hash) return
      ;[80, 360, 900, 1800, 3200, 5200].forEach((delay) => {
        hashTimers.push(window.setTimeout(scrollToCurrentHash, delay))
      })
    }

    window.addEventListener('hashchange', queueHashCorrection)

    if (reduceMotion) {
      queueHashCorrection()
      return () => {
        clearHashTimers()
        window.removeEventListener('hashchange', queueHashCorrection)
        root.classList.remove('motion-reduced')
      }
    }

    root.classList.add('motion-enabled')

    const touchedNodes = new Set()
    const scenes = []

    const touch = (node) => {
      if (node) touchedNodes.add(node)
      return node
    }

    const scene = (selector, name) => {
      const node = document.querySelector(selector)
      if (!node) return null
      node.setAttribute('data-motion-scene', name)
      scenes.push(node)
      return touch(node)
    }

    const setMotion = (selector, type, options = {}) => {
      const nodes = Array.from(document.querySelectorAll(selector))
      nodes.forEach((node, index) => {
        node.setAttribute('data-motion', type)
        if (options.variant) node.setAttribute('data-motion-variant', options.variant)
        if (options.delay != null || options.stagger) {
          const delay = (options.delay || 0) + (options.stagger || 0) * index
          node.style.setProperty('--motion-delay', `${Math.min(delay, options.maxDelay || 520)}ms`)
        }
        touch(node)
      })
      return nodes
    }

    scene('#title', 'title')
    scene('#contents', 'contents')
    scene('#key-visual-01', 'kv01')
    scene('#key-visual-02', 'kv02')
    scene('#key-visual-03', 'kv03')
    scene('#character-sheets', 'sheets')
    scene('#costume-detail', 'detail')
    scene('#portrait-studies', 'portraits')
    scene('#selected-works', 'selected')
    scene('#additional-designs', 'additional')
    scene('#resume-contact', 'final')

    setMotion('.title-cobalt-field', 'title-field')
    setMotion('.title-scan', 'title-panel', { delay: 110, stagger: 90, maxDelay: 420 })
    setMotion('.title-lockup h1 span', 'title-word', { delay: 160, stagger: 70, maxDelay: 340 })
    setMotion('.title-lockup h2, .title-lockup p, .title-contact a, .title-contact p, .title-meta span', 'micro', { delay: 360, stagger: 40, maxDelay: 520 })
    setMotion('.title-rule, .title-signal', 'title-rule', { delay: 260, stagger: 70, maxDelay: 420 })
    setMotion('.title-print-orb, .title-strokes', 'title-grain', { delay: 320, stagger: 90, maxDelay: 520 })

    setMotion('.contents-index-head h2, .contents-index-head p', 'type', { stagger: 55, maxDelay: 140 })
    setMotion('.contents-index-grid', 'line')
    Array.from(document.querySelectorAll('.contents-index-entry')).forEach((node, index) => {
      node.setAttribute('data-motion', 'contents-tile')
      const delay = index < 5 ? index * 35 : 120 + (9 - index) * 35
      node.style.setProperty('--motion-delay', `${delay}ms`)
      touch(node)
      const copy = node.querySelector('.contents-index-copy')
      copy?.setAttribute('data-motion', 'micro')
      copy?.style.setProperty('--motion-delay', `${delay + 50}ms`)
      touch(copy)
    })

    setMotion('.key-visual-one .kv-number-row, .key-visual-two .kv-number-row, .key-visual-three .kv-number-row', 'type')
    setMotion('.key-visual-one .kv-title-rule, .key-visual-two .kv-title-rule, .key-visual-three .kv-title-rule', 'line', { delay: 60 })
    setMotion('.key-visual-one .kv-title-copy, .key-visual-two .kv-title-copy, .key-visual-three .kv-title-copy', 'type', { delay: 110 })
    setMotion('.key-visual-one .kv-main', 'image-window', { variant: 'diagonal', delay: 100 })
    setMotion('.key-visual-two .kv-main', 'image-window', { variant: 'rect', delay: 100 })
    setMotion('.key-visual-one .kv-red-shape, .key-visual-one .kv-local-plane, .key-visual-one .kv-rule, .key-visual-one .kv-mark', 'support', { delay: 240 })
    setMotion('.key-visual-two .kv-red-shape, .key-visual-two .kv-local-plane, .key-visual-two .kv-rule, .key-visual-two .kv-mark', 'support', { delay: 80 })
    setMotion('.key-visual-three .kv-red-shape, .key-visual-three .kv-local-plane, .key-visual-three .kv-rule, .key-visual-three .kv-mark', 'support', { delay: 160, stagger: 70, maxDelay: 360 })

    setMotion('.editorial-head span, .editorial-head h2, .editorial-head p', 'type', { stagger: 45, maxDelay: 180 })
    setMotion('.sheet', 'image-window', { stagger: 65, maxDelay: 260 })
    setMotion('.detail-main, .detail-crop', 'image-window', { variant: 'vertical', stagger: 70, maxDelay: 260 })
    setMotion('.portrait-item', 'image-window', { variant: 'vertical', stagger: 80, maxDelay: 180 })
    setMotion('.selected-item', 'image-window', { stagger: 65, maxDelay: 280 })
    Array.from(document.querySelectorAll('.additional-item')).forEach((node, index, nodes) => {
      node.setAttribute('data-motion', 'image-window')
      const half = Math.ceil(nodes.length / 2)
      const delay = index < half ? index * 65 : 120 + (nodes.length - 1 - index) * 65
      node.style.setProperty('--motion-delay', `${Math.min(delay, 360)}ms`)
      touch(node)
    })

    setMotion('.final-chapter-label, .final-identity, .final-resume-panel', 'anatomy-copy', { delay: 260, stagger: 70, maxDelay: 420 })
    setMotion('.final-contact-panel', 'anatomy-copy', { delay: 520 })
    setMotion('.hand-study-overlay .study-arc, .hand-study-overlay .study-guide, .hand-study-overlay .study-dotline', 'anatomy-guide', { delay: 120, stagger: 35, maxDelay: 260 })
    setMotion('.hand-study-overlay .study-joint, .hand-study-overlay .study-marker, .hand-study-overlay .study-cross', 'anatomy-marker', { delay: 240, stagger: 28, maxDelay: 480 })
    setMotion('.page-meta', 'micro', { delay: 120 })

    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-inview')
        window.setTimeout(() => entry.target.classList.add('is-complete'), 760)
        sceneObserver.unobserve(entry.target)
      })
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' })

    scenes.forEach((node) => sceneObserver.observe(node))

    requestAnimationFrame(() => {
      scenes.forEach((node) => {
        const rect = node.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          node.classList.add('is-inview')
          window.setTimeout(() => node.classList.add('is-complete'), 760)
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

    queueHashCorrection()

    return () => {
      clearHashTimers()
      window.removeEventListener('hashchange', queueHashCorrection)
      sceneObserver.disconnect()
      navObserver.disconnect()
      root.classList.remove('motion-enabled')
      root.classList.remove('motion-reduced')
      navLinks.forEach((link) => link.classList.remove('is-active'))
      scenes.forEach((node) => {
        node.classList.remove('is-inview', 'is-complete')
        node.removeAttribute('data-motion-scene')
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


function ContentsSection() {
  return <section id="contents" className="contents contents-index page paper-page">
    <header className="contents-index-head">
      <h2>CONTENTS</h2>
      <p>PORTFOLIO INDEX / 01-10</p>
    </header>
    <div className="contents-index-grid" aria-label="作品集目录">
      {contentsChapters.map((chapter) => <a
        className={`contents-index-entry ${chapter.type === 'text' ? 'contents-index-entry-text' : ''}`}
        href={chapter.href}
        key={chapter.number}
        data-chapter={chapter.number}
      >
        {chapter.type === 'image'
          ? <figure className="contents-index-preview">
              <img {...imageAttrs(chapter.asset)} alt={`${chapter.asset.alt}目录预览`} style={{ objectPosition: chapter.objectPosition }} loading="lazy" decoding="async" fetchPriority="low" />
            </figure>
          : <div className="contents-index-text-tile" aria-label={`${chapter.title} / ${chapter.subtitle}`}>
              <strong>{chapter.lines[0]}</strong>
              <span>{chapter.lines[1]}</span>
            </div>}
        <div className="contents-index-copy">
          <b>{chapter.number}</b>
          <span>{chapter.title}</span>
          <small>{chapter.subtitle}</small>
        </div>
      </a>)}
    </div>
  </section>
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
  return <section id="selected-works" className="selected page paper-page">
    <header className="editorial-head compact"><div><span>CHARACTER PRESENTATION / IMAGE STUDIES</span><h2>SELECTED WORKS</h2></div><p>保留非 Key Visual 的展示页与横向图像研究，不重复 01–03 的独立作品页。</p></header>
    <div className="selected-layout">
      {selectedWorks.map((asset, index) => <figure className={`selected-item selected-${index + 1}`} key={asset.id}>
        <img {...imageAttrs(asset)} alt={asset.alt} loading="lazy" decoding="async" />
        <figcaption>{asset.label}</figcaption>
      </figure>)}
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

  return <main>
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
