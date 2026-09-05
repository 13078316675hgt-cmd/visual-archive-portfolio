import { useEffect, useRef } from 'react'
import resumeContent from '../data/resumeContent.js'
import '../marlsa-archive-ending.css'

// The FRAGMENTS composition from VEIKO, with one scene and MARLSA's blue ink.
const fragments = Array.from({ length: 78 }, (_, index) => {
  const seed = Math.sin(index * 127.1 + 6) * 43758.5453
  const depth = seed - Math.floor(seed)
  return { depth, position: index / 78, rotation: -.7 + Math.sin(index) * .16, blue: index % 7 < 3 }
})

function ArchiveFragmentsCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const context = canvas.getContext('2d')
    if (!context) return undefined
    let width = 1, height = 1, dpr = 1, unit = 1
    let frame = 0, previous = null, elapsed = 0, visible = false
    let sprites = []
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')

    // Rasterise type and linework only on resize; each frame reuses these cards.
    const cacheCards = () => {
      sprites = fragments.map(({ depth, blue }, index) => {
        const size = unit * (.018 + depth * depth * .1)
        const tile = document.createElement('canvas')
        tile.width = tile.height = Math.ceil(size * dpr) + 4
        const ink = tile.getContext('2d')
        ink.translate(2, 2)
        ink.scale(size * dpr / 128, size * dpr / 128)
        ink.fillStyle = blue ? '#2052c9' : '#c4c9cc'
        ink.strokeStyle = blue ? '#123984' : '#78858c'
        ink.lineWidth = 1
        ink.fillRect(0, 0, 128, 128)
        ink.strokeRect(.5, .5, 127, 127)
        if (size > 34) {
          ink.fillStyle = blue ? '#082858' : '#52616a'
          ink.font = '16px monospace'
          ink.fillText(`MA.${String(index).padStart(3, '0')}`, 14, 31)
          for (let line = 0; line < 6; line++) {
            ink.fillRect(18, 68 + line * 8.2, 128 * (.25 + ((index + line) % 4) * .1), 1.6)
          }
          ink.strokeRect(79, 54, 29, 29)
        }
        return { tile, size }
      })
    }
    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)
      fragments.forEach(({ depth, position, rotation }, index) => {
        const { tile, size } = sprites[index]
        const x = width * (.12 + .72 * position) + Math.cos(index * 4.3 + elapsed * .1) * unit * .16
        const y = height * (.65 - position * .23) + Math.sin(index * 8.1 + elapsed * .1) * height * .18
        context.save()
        context.translate(x, y)
        context.rotate(rotation + Math.sin(elapsed * .22 + index) * .035)
        context.globalAlpha = .2 + depth * .7
        context.drawImage(tile, -size / 2 - 2 / dpr, -size / 2 - 2 / dpr, tile.width / dpr, tile.height / dpr)
        context.restore()
      })
    }
    const tick = now => {
      if (previous !== null) elapsed += Math.min((now - previous) / 1000, .05)
      previous = now
      draw()
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      previous = null
      const running = visible && !document.hidden && !reduced.matches
      canvas.dataset.running = String(running)
      if (running) frame = requestAnimationFrame(tick)
    }
    const resize = () => {
      const nextWidth = Math.max(1, canvas.clientWidth)
      const nextHeight = Math.max(1, canvas.clientHeight)
      const nextDpr = Math.min(devicePixelRatio || 1, 2)
      if (nextWidth === width && nextHeight === height && nextDpr === dpr && sprites.length) return
      width = nextWidth; height = nextHeight; dpr = nextDpr
      unit = Math.min(width, height * 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      cacheCards()
      draw()
      canvas.dataset.ready = 'true'
    }
    const resizeObserver = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    resize()
    resizeObserver.observe(canvas)
    visibilityObserver.observe(canvas)
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      sprites = []
    }
  }, [])

  return <canvas ref={ref} className="marlsa-ending-fragments" aria-hidden="true" />
}

export default function MarlsaArchiveEnding() {
  const { identity, contact, website } = resumeContent
  return <section id="about-the-creator" className="page marlsa-ending" aria-labelledby="marlsa-ending-title">
    <span id="end" className="page-deep-link-alias" aria-hidden="true" />
    <span id="resume-contact-contact" className="page-deep-link-alias" aria-hidden="true" />
    <div className="marlsa-ending-stage" aria-hidden="true">
      <ArchiveFragmentsCanvas />
      <svg className="marlsa-ending-registration" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path d="M-90 825 1330 170M160 920 1520 350" />
        <path d="M410 487 566 374M902 525 1060 653M310 640 140 711" />
        <g><rect x="395" y="472" width="30" height="30" /><rect x="871" y="494" width="62" height="62" /></g>
        <path d="M561 370h10m-5-5v10M1055 653h10m-5-5v10" />
      </svg>
    </div>
    <div className="marlsa-ending-diagnostics" aria-hidden="true">
      <span className="marlsa-ending-reticle marlsa-ending-reticle-a" />
      <span className="marlsa-ending-reticle marlsa-ending-reticle-b" />
      <span className="marlsa-ending-reticle marlsa-ending-reticle-c" />
      <span className="marlsa-ending-reticle marlsa-ending-reticle-d" />
      <svg className="marlsa-ending-pulse" viewBox="0 0 520 70" preserveAspectRatio="none">
        <path className="marlsa-ending-pulse-guide" d="M0 37H520" />
        <path className="marlsa-ending-pulse-line" d="M0 37h72l12-2 8 5 8-23 9 37 10-19 11 4 10-3 8 2 14-1 10-11 9 27 10-18 9 1 10 3 10-7 9 17 11-12 12 1 11-2 10 4 12-24 8 37 10-15 11 2 10-3 12 5 12-2 10 1h72" />
      </svg>
      <span className="marlsa-ending-diagnostic-label">PROFILE SIGNAL / ACTIVE</span>
      <span className="marlsa-ending-diagnostic-index">M–A / 0926</span>
    </div>
    <div className="marlsa-ending-topline">
      <span>THE NEXT CHAPTER</span>
      <a href="#title">BACK TO TOP <span aria-hidden="true">↗</span></a>
    </div>
    <header className="marlsa-ending-heading">
      <p><i aria-hidden="true" /> PERSONAL VISUAL ARCHIVE <span>/ MARLSA</span></p>
      <h2 id="marlsa-ending-title">LET’S TALK</h2>
      <div><strong>{identity.name}</strong><i aria-hidden="true" /><span>{identity.title}</span></div>
    </header>
    <div className="marlsa-ending-coordinate" aria-hidden="true">M / A<i />FRAGMENTS OF<br />IMAGINATION</div>
    <aside className="marlsa-ending-profile-window" aria-label="个人资料窗口">
      <header>
        <div><i aria-hidden="true" /><span>PERSONAL FILE / PROFILE ARCHIVE</span></div>
        <span aria-hidden="true">—&nbsp;&nbsp;□&nbsp;&nbsp;×</span>
      </header>
      <div className="marlsa-ending-profile-body">
        <div className="marlsa-ending-profile-id">
          <div className="marlsa-ending-profile-mark" aria-hidden="true"><i /><i /><i /></div>
          <div>
            <span>CREATOR / 个人档案</span>
            <h3>{identity.name}</h3>
            <p>{identity.titleZh} / {identity.title}</p>
          </div>
        </div>
        <dl>
          <div><dt>LOCATION / 所在地</dt><dd>{website.facts.location}</dd></div>
          <div><dt>FOCUS / 专注方向</dt><dd>{website.facts.focus}</dd></div>
          <div><dt>EMAIL / 邮箱</dt><dd><a href={`mailto:${contact.email}`}>{contact.email}</a></dd></div>
          <div><dt>WECHAT / 微信</dt><dd>{contact.wechat}</dd></div>
        </dl>
      </div>
      <footer><span>AVAILABLE FOR COLLABORATION</span><i aria-hidden="true" /><strong>ONLINE</strong></footer>
    </aside>
    <div className="marlsa-ending-details">
      <section className="marlsa-ending-about" aria-labelledby="marlsa-ending-about-title">
        <span className="marlsa-ending-label">ABOUT THE CREATOR / 关于创作者</span>
        <h3 id="marlsa-ending-about-title">IMAGINATION CONTINUES <span aria-hidden="true">✦</span></h3>
        <p>角色概念设计师，专注于日系动漫角色与工业题材的设计探索，擅长将叙事、结构与美学融合，输出可落地的高完成度角色设定方案。</p>
        <p className="marlsa-ending-focus">日系角色设计 / 工业题材 / 世界观构建 / 视觉开发 / 设定落地 / 叙事驱动设计</p>
      </section>
      <address className="marlsa-ending-contact">
        <span className="marlsa-ending-label">CONTACT / 联系方式</span>
        <a href={`mailto:${contact.email}`} aria-label={`发送邮件至 ${contact.email}`}>{contact.email}<span aria-hidden="true">↗</span></a>
        <p><span>微信 / WECHAT</span><strong>{contact.wechat}</strong></p>
      </address>
    </div>
    <footer className="marlsa-ending-footer"><span>MARLSA / HUANG GUOTAI</span><span>END OF ARCHIVE <i aria-hidden="true" /></span></footer>
  </section>
}
