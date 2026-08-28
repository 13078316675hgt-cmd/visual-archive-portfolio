import React, { useLayoutEffect, useRef } from 'react'
import d1001DirectoryCards from '../data/d1001DirectoryConfig.js'
import resumeContent from '../data/resumeContent.js'
import softwareLogoAssets from '../data/softwareLogoAssets.js'
import { initD1001LockedMasterMotion } from '../motion/d1001LockedMasterMotion.js'

function useD1001Motion() {
  const ref = useRef(null)
  useLayoutEffect(() => initD1001LockedMasterMotion(ref.current), [])
  return ref
}

function ArchiveMark({ className = '' }) {
  return <svg className={className} viewBox="0 0 64 56" aria-hidden="true">
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

function RegistrationCorners() {
  return <g className="d1001-symbol-corners">
    <path d="M18 36V19h17M86 19h17v17M18 84v17h17M103 84v17H86" />
  </g>
}

function DirectorySymbol({ type }) {
  if (type === 'signal') {
    return <svg viewBox="0 0 120 120" aria-hidden="true">
      <RegistrationCorners />
      <circle className="d1001-symbol-faint" cx="60" cy="60" r="31" />
      <path className="d1001-symbol-faint" d="M60 15v90M15 60h90" />
      <path className="d1001-symbol-blue-fill" d="M60 35c3 17 8 22 25 25-17 3-22 8-25 25-3-17-8-22-25-25 17-3 22-8 25-25Z" />
      <circle cx="29" cy="60" r="3" /><circle cx="91" cy="60" r="3" />
    </svg>
  }

  if (type === 'bust') {
    return <svg viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <pattern id="d1001-bust-dots" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="1.05" fill="currentColor" />
        </pattern>
      </defs>
      <path className="d1001-symbol-blue" d="M19 74A49 49 0 0 1 77 21M91 30A48 48 0 0 1 82 96" />
      <path fill="url(#d1001-bust-dots)" d="M67 20c-12 0-21 7-23 18-2 8 1 14 5 18l-8 8 10 2c1 8 6 14 14 17l-3 10c-14 3-25 10-32 18h67c-6-10-15-17-27-21l-1-11c8-4 13-11 14-20l8-5-7-5c1-17-6-27-17-29Z" />
      <path d="M48 34c7-9 15-13 26-12M47 50h18M49 62c5 2 10 1 14-2M69 79c-4 2-8 3-13 2" />
      <path className="d1001-symbol-blue" d="M90 20v16M82 28h16" />
      <path d="M18 91v10M13 96h10M96 68v10M91 73h10" />
    </svg>
  }

  if (type === 'archive') {
    return <svg viewBox="0 0 120 120" aria-hidden="true">
      <path className="d1001-symbol-black-fill" d="M31 30h58v7H31zm7 10h44v7H38zm3 7h7v39h-7zm31 0h7v39h-7zM36 86h48v7H36zm10-34h28v5H46z" />
      <path d="M18 58h15M25.5 50.5v15M88 58h15M95.5 50.5v15" />
      <path className="d1001-symbol-blue-fill" d="m60 66 16 28H44l16-28Z" />
      <path className="d1001-symbol-white" d="M60 75v10M60 89v2" />
    </svg>
  }

  if (type === 'layers') {
    return <svg viewBox="0 0 120 120" aria-hidden="true">
      <path className="d1001-symbol-black-fill" d="m60 76 38 20-38 20-38-20 38-20Z" />
      <path className="d1001-symbol-dots" d="m60 56 38 20-38 20-38-20 38-20Z" />
      <path className="d1001-symbol-blue" d="m60 34 38 20-38 20-38-20 38-20Z" />
      <path d="M18 29v10M13 34h10M98 29v10M93 34h10M18 84v10M13 89h10M98 84v10M93 89h10" />
    </svg>
  }

  if (type === 'turnaround') {
    return <svg viewBox="0 0 120 120" aria-hidden="true">
      <path className="d1001-symbol-grid" d="M10 20h100M10 50h100M10 82h100M25 13v95M60 13v95M95 13v95" />
      <g className="d1001-symbol-blue">
        <circle cx="25" cy="35" r="8" /><path d="M25 43v29M14 53l11-8 11 8M25 72l-8 26M25 72l8 26" />
        <circle cx="60" cy="35" r="8" /><path d="M60 43v29M55 48l-3 21M60 72l-2 26M60 72l5 26" />
        <circle cx="95" cy="35" r="8" /><path d="M95 43v29M84 53l11-8 11 8M95 72l-8 26M95 72l8 26" />
      </g>
    </svg>
  }

  if (type === 'profile') {
    return <svg viewBox="0 0 120 120" aria-hidden="true">
      <RegistrationCorners />
      <path d="M37 25h33l17 17v55H37zM70 25v18h17" />
      <circle className="d1001-symbol-blue-fill" cx="55" cy="53" r="9" />
      <path className="d1001-symbol-blue-fill" d="M42 75c1-11 6-17 13-17s12 6 13 17Z" />
      <path d="M45 84h33M45 91h33" />
    </svg>
  }

  return <svg viewBox="0 0 120 120" aria-hidden="true">
    <circle className="d1001-symbol-blue" cx="60" cy="50" r="25" />
    <circle className="d1001-symbol-blue" cx="60" cy="50" r="15" />
    <path className="d1001-symbol-cursor" d="m56 49 1 37 9-8 8 17 8-4-8-17h12L56 49Z" />
    <path d="M20 29v10M15 34h10M95 23v10M90 28h10M19 75v10M14 80h10M98 77v10M93 82h10" />
  </svg>
}

export function D1001Directory() {
  const ref = useD1001Motion()

  return <section ref={ref} id="contents" className="page d1001-directory" aria-labelledby="d1001-directory-title">
    <div className="d1001-directory-canvas">
      <a className="d1001-directory-brand d1001-reveal-header" href="#title" aria-label="Return to portfolio home">
        <ArchiveMark />
        <strong>ARCHIVE STUDIO</strong>
        <span>VISUAL DESIGN &amp; ART DIRECTION</span>
      </a>

      <header className="d1001-directory-copy d1001-reveal-header">
        <p><i aria-hidden="true" /> DIRECTORY <span aria-hidden="true" /></p>
        <h2 id="d1001-directory-title">DIRECTORY</h2>
        <h3 lang="zh-CN">目录索引</h3>
        <strong lang="zh-CN">角色设定 · 概念绘制 · 设定三视图</strong>
        <small>CHARACTER DESIGN&nbsp;&nbsp;/&nbsp;&nbsp;CONCEPT ART&nbsp;&nbsp;/&nbsp;&nbsp;TURNAROUND SHEETS</small>
      </header>

      <div className="d1001-directory-projects d1001-reveal-meta">
        <h3><i aria-hidden="true" /> SELECTED WORKS</h3>
        <b>2019 — 2024</b>
        <p lang="zh-CN">整理思绪，记录灵感。<br />用视觉语言，探索无限可能。</p>
      </div>

      <nav className="d1001-directory-cards" aria-label="Portfolio directory">
        {d1001DirectoryCards.map((card, index) => <a
          className={`d1001-directory-card d1001-card-${index < 3 ? 'upper' : 'lower'}`}
          href={card.href}
          key={card.number}
        >
          <header><b>{card.number}</b><strong>{card.title}</strong><span aria-hidden="true"><i />□×</span></header>
          <div className="d1001-directory-symbol"><DirectorySymbol type={card.symbol} /></div>
          <footer>
            <b lang="zh-CN">{card.titleZh}</b>
            <span>{card.subtitle}</span>
          </footer>
        </a>)}
      </nav>

      <nav className="d1001-directory-top d1001-reveal-meta" aria-label="Portfolio top navigation">
        <i aria-hidden="true" /><span>PORTFOLIO<br /><b>DIRECTORY</b></span>
        <details>
          <summary aria-label="Open portfolio navigation"><i aria-hidden="true" /></summary>
          <div>
            <a className="d1001-nav-resume" href="#professional-profile">RESUME</a>
            <a className="d1001-nav-contact" href="#about-the-creator">CONTACT</a>
          </div>
        </details>
      </nav>
      <p className="d1001-directory-scroll d1001-reveal-meta">SCROLL <i aria-hidden="true" /></p>
      <p className="d1001-directory-index d1001-reveal-meta"><b>00</b><i aria-hidden="true" /> / DIRECTORY</p>
      <p className="d1001-directory-total d1001-reveal-meta">03 / 08 <i aria-hidden="true" /></p>
    </div>
  </section>
}

export function D1001ProcessWorkflow() {
  const ref = useD1001Motion()
  const steps = [
    ['01', 'BRIEF ANALYSIS', '梳理世界观、目标与视觉语汇，建立清晰的设计方向。'],
    ['02', 'VISUAL KEYWORDS', '提炼关键词、比例与材质，形成可执行的视觉基准。'],
    ['03', 'ITERATION', '通过草图、轮廓与配色方案反复验证，逐步收敛方案。'],
    ['04', 'DELIVERY', '整理三视图、细节与说明文档，输出完整归档文件。'],
  ]

  return <section ref={ref} id="process-workflow" className="page d1001-process" aria-labelledby="d1001-process-title">
    <div className="d1001-process-canvas">
      <header className="d1001-process-heading d1001-reveal-header">
        <p><b>04</b> PROCESS ARCHIVE <i aria-hidden="true" /></p>
        <h2 id="d1001-process-title">PROCESS<br /><span>&amp; WORKFLOW</span></h2>
        <p lang="zh-CN">从概念到交付的设计路径</p>
      </header>
      <div className="d1001-process-intro d1001-reveal-meta">
        <span>CONTROLLED EDITORIAL / DESIGN EVIDENCE</span>
        <p lang="zh-CN">每一阶段都留下可追溯的视觉证据，<br />让想法稳定地变成可用的设定资产。</p>
      </div>
      <ol className="d1001-process-steps d1001-reveal-meta">
        {steps.map(([number, title, copy]) => <li key={number}>
          <b>{number}</b>
          <div><h3>{title}</h3><p lang="zh-CN">{copy}</p></div>
          <i aria-hidden="true" />
        </li>)}
      </ol>
      <div className="d1001-process-axis" aria-hidden="true"><span /><span /><span /><span /></div>
      <p className="d1001-process-index d1001-reveal-meta"><b>04</b><i aria-hidden="true" /> / PROCESS</p>
      <p className="d1001-process-total d1001-reveal-meta">04 / 08 <i aria-hidden="true" /></p>
    </div>
  </section>
}

export function D1001ProfessionalProfile() {
  const ref = useD1001Motion()
  const { contact, coreCapabilities, identity, profile, software, strengths, workflow, website } = resumeContent

  return <section ref={ref} id="professional-profile" className="page d1001-profile" aria-labelledby="d1001-profile-title">
    <span id="resume-contact-resume" className="page-deep-link-alias" aria-hidden="true" />
    <div className="d1001-profile-canvas">
      <header className="d1001-profile-header d1001-profile-rule-reveal">
        <p><b>11</b> / FULL RESUME DETAILS<span>VISUAL ARCHIVE / PROFESSIONAL PROFILE</span></p>
        <h2 id="d1001-profile-title">PROFESSIONAL PROFILE<br />/ FULL RESUME</h2>
      </header>

      <div className="d1001-profile-intro d1001-profile-column-reveal">
        {profile.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>

      <aside className="d1001-profile-identity d1001-profile-column-reveal" aria-label="Contact information">
        <h3>{identity.name}<i aria-hidden="true" /></h3>
        <p>{identity.titleZh}</p>
        <dl>
          <div><dt>所在地</dt><dd>{website.facts.location.replace(' · ', '：')}</dd></div>
          <div><dt>邮箱</dt><dd><a href={`mailto:${contact.email}`}>{contact.email}</a></dd></div>
          <div><dt>微信</dt><dd>{contact.wechat}</dd></div>
          <div><dt>可合作时间</dt><dd>随时</dd></div>
        </dl>
      </aside>

      <div className="d1001-profile-columns">
        <section className="d1001-profile-panel d1001-profile-column-reveal">
          <h3><b>01</b>个人简介</h3>
          <ul>{resumeContent.strengths.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="d1001-profile-panel d1001-profile-column-reveal">
          <h3><b>02</b>核心能力</h3>
          <ol>{coreCapabilities.map((item, index) => <li key={item.title}><b>{String(index + 1).padStart(2, '0')}</b><strong>{item.title}</strong><span>{item.description}</span></li>)}</ol>
        </section>
        <section className="d1001-profile-panel d1001-profile-column-reveal">
          <h3><b>03</b>设计流程</h3>
          <ol>{workflow.map((item) => <li key={item.number}><b>{item.number}</b><strong>{item.title}</strong><span>{item.description}</span></li>)}</ol>
        </section>
      </div>

      <section className="d1001-profile-strengths d1001-profile-rule-reveal">
        <h3><b>04</b>专业优势</h3>
        <div>{strengths.slice(0, 5).map((item, index) => <article key={item}><b>{String(index + 1).padStart(2, '0')}</b><strong>{item.split('，')[0]}</strong><p>{item}</p></article>)}</div>
      </section>

      <section className="d1001-profile-tools d1001-profile-rule-reveal">
        <h3><b>05</b>软件与工具</h3>
        <div>{software.map((item) => <article key={item.name}>
          <i aria-hidden="true"><img className="d1001-software-logo" src={softwareLogoAssets[item.name]} alt="" width="44" height="44" decoding="async" draggable="false" /></i>
          <strong>{item.name}</strong>
          <span>{item.usage}</span>
        </article>)}</div>
      </section>

      <footer>系统：Windows 10</footer>
    </div>
  </section>
}

export function D1001AboutCreator() {
  const ref = useD1001Motion()
  const { contact, identity } = resumeContent
  const base = import.meta.env.BASE_URL

  return <section ref={ref} id="about-the-creator" className="page d1001-about" aria-labelledby="d1001-about-title">
    <span id="end" className="page-deep-link-alias" aria-hidden="true" />
    <span id="resume-contact-contact" className="page-deep-link-alias" aria-hidden="true" />
    <div className="d1001-about-canvas">
      <header className="d1001-about-brand">
        <ArchiveMark />
        <strong>ARCHIVE STUDIO</strong>
        <span>VISUAL ARCHIVE / CONTROLLED EDITORIAL</span>
      </header>
      <p className="d1001-about-top">PORTFOLIO PROFILE <i aria-hidden="true" /><span aria-hidden="true">☰</span></p>
      <i className="d1001-about-rule" aria-hidden="true" />

      <div className="d1001-about-copy d1001-about-copy-reveal">
        <p>//&nbsp;&nbsp;PROFILE&nbsp;&nbsp;//</p>
        <h2 id="d1001-about-title">ABOUT<br />THE CREATOR</h2>
        <h3 lang="zh-CN">关于创作者</h3>
        <i aria-hidden="true" />
        <p lang="zh-CN">角色概念设计师，专注于日系动漫角色<br />与工业题材的设计探索，擅长将叙事、<br />结构与美学融合，输出可落地的高完成度<br />角色设定方案。</p>
      </div>

      <figure className="d1001-about-hand" aria-label="Approved anatomical hand study">
        <img src={`${base}assets/d10-01/about-hand-locked-r2.png`} alt="淡蓝色解剖手部视觉研究" width="758" height="941" loading="eager" decoding="async" />
      </figure>
      <i className="d1001-about-scan" aria-hidden="true" />

      <aside className="d1001-about-window" aria-label="Profile archive contact information">
        <header><b>01</b>PROFILE ARCHIVE<span aria-hidden="true">—　□　×</span></header>
        <div>
          <h3>{identity.name}<i aria-hidden="true" /></h3>
          <p>{identity.titleZh}</p>
          <i className="d1001-about-person" aria-hidden="true" />
          <dl>
            <div><dt>擅长方向</dt><dd>日系角色设计 / 工业题材 / 世界观构建 /<br />视觉开发 / 设定落地 / 叙事驱动设计</dd></div>
            <div><dt>邮箱</dt><dd><a href={`mailto:${contact.email}`}>{contact.email}</a></dd></div>
            <div><dt>微信</dt><dd>{contact.wechat}</dd></div>
          </dl>
        </div>
      </aside>

      <p className="d1001-about-version">VISUAL ARCHIVE SYSTEM<br />VERSION 1.0.4 / 2024</p>
      <a className="d1001-about-return" href="#title">BACK TO TOP</a>
      <p className="d1001-about-index">06&nbsp;&nbsp;/&nbsp;&nbsp;06 <i aria-hidden="true" /></p>
    </div>
  </section>
}

export { ArchiveMark, DirectorySymbol }

