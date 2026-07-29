import React, { useLayoutEffect, useRef } from 'react'
import {
  additionalCharacterDesigns,
  characterSheets,
  costumeDetailAsset,
  portraitStudies,
  selectedWorks,
} from '../data/artworkManifest.js'
import {
  initD06Page04Motion,
  initD06Page05Motion,
  initD06Page06PrimaryMotion,
  initD06Page06SecondaryMotion,
  initD06Page07Motion,
} from '../motion/innerPagesMotion.js'

const CONTENT_ALT = Object.freeze({
  'sheet-01': '黑蓝配色短发角色正面、侧面、背面三视图设定',
  'sheet-02': '紫白配色长发角色正面、侧面、背面三视图设定',
  'sheet-03': '黑白红配色兜帽角色正面、侧面、背面三视图设定',
  'sheet-04': '黑金配色白发角色正面、侧面、背面三视图设定',
  'portrait-01': '黑色背景中白发持剑角色的半身肖像',
  'portrait-white-hair': '浅色背景中白发红角角色的横向半身肖像',
  'character-presentation-purple': '紫白配色长发角色展示页，包含全身造型与配色说明',
  'study-red-profile': '浅绿色背景中的红发侧脸角色横向肖像',
  'study-blue-sky': '蓝天雪山背景中的白发角色横向肖像',
  'design-14': '黑白金配色女性角色正面、侧面、背面三视图设定',
  'design-15': '黑白蓝配色短发角色正面、侧面、背面三视图设定',
  'design-16': '白橙配色角色正面、侧面、背面三视图设定',
  'design-tianzi': '蓝白铠甲男性角色正面、侧面、背面三视图设定',
})

function getAssetDimensions(asset) {
  const [width, height] = asset.resolution.split(/\s*[x×]\s*/).map(Number)
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

function assetAlt(asset) {
  return CONTENT_ALT[asset.id] || asset.alt
}

function ContentPageMeta({ number, label }) {
  return <div className="page-meta content-page-meta"><span>{label}</span><b>{number}</b></div>
}

function D06AssetFigure({ asset, className, index, label = asset.label, critical = false, linkLabel = 'VIEW FULL SHEET' }) {
  return <figure className={`d06-asset ${className}`.trim()}>
    <img
      {...imageAttrs(asset)}
      alt={assetAlt(asset)}
      loading="eager"
      decoding="async"
      className={critical ? 'd06-critical-art' : undefined}
    />
    <figcaption>
      <span><b>{String(index).padStart(2, '0')}</b>{label}</span>
      {linkLabel ? <a href={asset.src} target="_blank" rel="noreferrer">{linkLabel}</a> : null}
    </figcaption>
  </figure>
}

function FullSheetFigure({ asset, index, className = '', characterSheet = false, linkLabel = 'VIEW FULL SHEET', normalizedFrame = false, pairedFrame = false }) {
  const artwork = <img {...imageAttrs(asset)} alt={assetAlt(asset)} loading="lazy" decoding="async" />
  const frameClassName = [pairedFrame ? 'paired-spread-frame' : '', normalizedFrame ? 'additional-normalized-frame' : ''].filter(Boolean).join(' ')

  return <figure className={`content-figure ${characterSheet ? 'sheet' : ''} ${className}`.trim()}>
    {frameClassName ? <div className={frameClassName}>{artwork}</div> : artwork}
    <figcaption>
      <span><b>{String(index).padStart(2, '0')}</b>{asset.label}</span>
      <a href={asset.src} target="_blank" rel="noreferrer">{linkLabel}</a>
    </figcaption>
  </figure>
}

export function CharacterSheets() {
  const [sheetOne, sheetTwo, sheetThree, sheetFour] = characterSheets
  const sectionRef = useRef(null)
  useLayoutEffect(() => initD06Page04Motion(sectionRef.current), [])

  return <section ref={sectionRef} id="character-sheets" className="content-portfolio-page content-sheets page d06-page04" data-page-family="design-evidence" data-d06-page="04">
    <div className="d06-desktop-layout d06-sheet-canvas">
      <header className="d06-sheet-heading">
        <p><b>04</b><span>TECHNICAL ARCHIVE<br />DESIGN EVIDENCE</span></p>
        <h2>CHARACTER <span>SHEETS</span></h2>
        <i aria-hidden="true" />
      </header>
      <D06AssetFigure asset={sheetOne} index={1} className="d06-sheet-primary" critical />
      <div className="d06-sheet-supports">
        <D06AssetFigure asset={sheetTwo} index={2} className="d06-sheet-support d06-sheet-support-a" />
        <D06AssetFigure asset={sheetThree} index={3} className="d06-sheet-support d06-sheet-support-b" />
        <D06AssetFigure asset={sheetFour} index={4} className="d06-sheet-support d06-sheet-support-c" />
      </div>
      <p className="d06-sheet-order" aria-hidden="true"><span>FRONT</span><span>SIDE</span><span>BACK</span></p>
      <i className="d06-sheet-axis" aria-hidden="true" />
    </div>

    <div className="d06-legacy-layout">
    <div className="content-shell">
      <header className="sheets-index" aria-labelledby="character-sheets-title">
        <div className="sheets-index-code">
          <b>04</b>
          <span>TECHNICAL ARCHIVE<br />DESIGN EVIDENCE</span>
        </div>
        <h2 id="character-sheets-title">CHARACTER SHEETS</h2>
        <p>正面、侧面与背面保持完整可见；设定图按阅读层级展开。</p>
      </header>

      <div className="sheet-opening content-spread">
        <FullSheetFigure asset={sheetOne} index={1} className="sheet-main sheet-opening-art" characterSheet />
        <aside className="sheet-reading-note" aria-label="设定图阅读顺序">
          <b>01</b>
          <p>FRONT<br />SIDE<br />BACK</p>
          <i aria-hidden="true" />
          <span>COMPLETE TURNAROUND</span>
        </aside>
      </div>

      <div className="sheet-comparison content-spread d03-paired-spread" aria-label="角色设定图对照">
        <FullSheetFigure asset={sheetTwo} index={2} className="sheet-support sheet-comparison-a" characterSheet pairedFrame />
        <FullSheetFigure asset={sheetThree} index={3} className="sheet-support sheet-comparison-b" characterSheet pairedFrame />
      </div>

      <div className="sheet-closing content-spread">
        <div className="sheet-closing-copy" aria-hidden="true">
          <span>FORM / SILHOUETTE</span>
          <b>04</b>
        </div>
        <FullSheetFigure asset={sheetFour} index={4} className="sheet-support sheet-closing-art" characterSheet />
      </div>
    </div>
    <ContentPageMeta number="04" label="CHARACTER SHEETS" />
    </div>
  </section>
}

export function CostumeDetail() {
  const sectionRef = useRef(null)
  useLayoutEffect(() => initD06Page05Motion(sectionRef.current), [])

  return <section ref={sectionRef} id="costume-detail" className="content-portfolio-page content-costume page d06-page05" data-page-family="detail-focus" data-d06-page="05">
    <div className="d06-desktop-layout d06-costume-canvas">
      <header className="d06-costume-heading">
        <span>05 / DETAIL STUDY</span>
        <h2>COSTUME<br /><b>CONSTRUCTION</b></h2>
        <p>DETAIL / CONSTRUCTION STUDY</p>
      </header>
      <D06AssetFigure asset={costumeDetailAsset} index={1} className="d06-costume-sheet" critical label="COMPLETE SHEET / CONTEXT" linkLabel={null} />
      <figure className="d06-costume-crop d06-costume-upper">
        <div><img {...imageAttrs(costumeDetailAsset)} alt="" loading="eager" decoding="async" aria-hidden="true" /></div>
        <figcaption><b>02</b>UPPER BODY / LAYERING</figcaption>
      </figure>
      <figure className="d06-costume-crop d06-costume-back">
        <div><img {...imageAttrs(costumeDetailAsset)} alt="" loading="eager" decoding="async" aria-hidden="true" /></div>
        <figcaption><b>03</b>BACK / SILHOUETTE</figcaption>
      </figure>
      <i className="d06-costume-marker d06-costume-marker-a" aria-hidden="true" />
      <i className="d06-costume-marker d06-costume-marker-b" aria-hidden="true" />
    </div>

    <div className="d06-legacy-layout">
    <div className="content-shell">
      <header className="costume-index" aria-labelledby="costume-title">
        <span><b>05</b>DETAIL / CONSTRUCTION STUDY</span>
        <h2 id="costume-title">COSTUME CONSTRUCTION</h2>
        <p>由局部观察返回完整设定；裁切只强调原图中已有的服装结构。</p>
      </header>

      <div className="costume-focus content-spread">
        <figure className="content-figure costume-primary">
          <div className="costume-crop-window costume-upper-window">
            <img {...imageAttrs(costumeDetailAsset)} alt="兜帽角色的领口、胸前装饰、袖部和腰部服装结构" loading="lazy" decoding="async" />
          </div>
          <figcaption><span><b>01</b>UPPER BODY / LAYERING</span></figcaption>
        </figure>

        <figure className="content-figure detail-crop costume-context">
          <img {...imageAttrs(costumeDetailAsset)} alt={`${assetAlt(costumeDetailAsset)}完整参考`} loading="lazy" decoding="async" />
          <figcaption><span><b>02</b>COMPLETE SHEET / CONTEXT</span></figcaption>
        </figure>

        <figure className="content-figure detail-crop costume-back">
          <div className="costume-crop-window costume-back-window">
            <img {...imageAttrs(costumeDetailAsset)} alt="兜帽角色背部轮廓和十字纹样细节" loading="lazy" decoding="async" />
          </div>
          <figcaption><span><b>03</b>BACK / SILHOUETTE</span></figcaption>
        </figure>
      </div>
    </div>
    <ContentPageMeta number="05" label="COSTUME DETAIL" />
    </div>
  </section>
}

export function PortraitStudies() {
  const [darkPortrait, lightPortrait] = portraitStudies
  const [, redProfile, blueSky] = selectedWorks
  const sectionRef = useRef(null)
  useLayoutEffect(() => initD06Page06PrimaryMotion(sectionRef.current), [])

  return <section ref={sectionRef} id="portrait-studies" className="content-portfolio-page content-portraits page d06-page06-primary" data-page-family="hero-detail" data-d06-page="06-primary">
    <div className="d06-desktop-layout d06-identity-canvas">
      <figure className="d06-identity-anchor">
        <img {...imageAttrs(darkPortrait)} alt={assetAlt(darkPortrait)} loading="eager" decoding="async" className="d06-critical-art" />
        <figcaption>PORTRAIT STUDY / 01</figcaption>
      </figure>
      <header className="d06-identity-heading">
        <span>06 / PORTRAIT STUDIES</span>
        <h2>IDENTITY<br /><b>&amp; EXPRESSION</b></h2>
        <i aria-hidden="true" />
      </header>
      <figure className="d06-identity-light">
        <img {...imageAttrs(lightPortrait)} alt={assetAlt(lightPortrait)} loading="eager" decoding="async" />
        <figcaption>PORTRAIT STUDY / 02</figcaption>
      </figure>
      <figure className="d06-identity-strip d06-identity-red">
        <img {...imageAttrs(redProfile)} alt={assetAlt(redProfile)} loading="eager" decoding="async" />
        <figcaption>IMAGE STUDY / 03 / RED PROFILE</figcaption>
      </figure>
      <figure className="d06-identity-strip d06-identity-blue">
        <img {...imageAttrs(blueSky)} alt={assetAlt(blueSky)} loading="eager" decoding="async" />
        <figcaption>IMAGE STUDY / 04 / BLUE SKY</figcaption>
      </figure>
      <p className="d06-identity-vertical">FACE / IDENTITY / EXPRESSION</p>
    </div>

    <div className="d06-legacy-layout">
    <div className="portrait-dark-spread content-spread">
      <div className="portrait-dark-inner">
        <header className="portrait-dark-intro" aria-labelledby="portrait-title">
          <span>06 / PORTRAIT STUDIES</span>
          <h2 id="portrait-title">IDENTITY<br />&amp; EXPRESSION</h2>
          <p>明暗、轮廓与视线构成四张人物研究的连续观察。</p>
          <small>01 / DARK PORTRAIT</small>
        </header>
        <figure className="content-figure portrait-item portrait-dark-art">
          <img {...imageAttrs(darkPortrait)} alt={assetAlt(darkPortrait)} loading="lazy" decoding="async" />
          <figcaption><span>PORTRAIT STUDY / 01</span></figcaption>
        </figure>
      </div>
    </div>

    <div className="content-shell portrait-light-spread content-spread">
      <figure className="content-figure portrait-item portrait-light-art">
        <img {...imageAttrs(lightPortrait)} alt={assetAlt(lightPortrait)} loading="lazy" decoding="async" />
        <figcaption><span>PORTRAIT STUDY / 02</span></figcaption>
      </figure>
      <div className="portrait-light-copy">
        <span>FACE / IDENTITY</span>
        <b>02</b>
        <i aria-hidden="true" />
      </div>
    </div>

    <div className="content-shell portrait-study-sequence content-spread d03-paired-spread" aria-label="横向人物图像研究">
      <figure className="content-figure portrait-item portrait-study-red">
        <div className="paired-spread-frame"><img {...imageAttrs(redProfile)} alt={assetAlt(redProfile)} loading="lazy" decoding="async" /></div>
        <figcaption><span>IMAGE STUDY / 03 / RED PROFILE</span></figcaption>
      </figure>
      <figure className="content-figure portrait-item portrait-study-blue">
        <div className="paired-spread-frame"><img {...imageAttrs(blueSky)} alt={assetAlt(blueSky)} loading="lazy" decoding="async" /></div>
        <figcaption><span>IMAGE STUDY / 04 / BLUE SKY</span></figcaption>
      </figure>
    </div>
    <ContentPageMeta number="06" label="PORTRAIT STUDIES" />
    </div>
  </section>
}

export function SelectedWorks() {
  const [principal] = selectedWorks
  const sectionRef = useRef(null)
  useLayoutEffect(() => initD06Page06SecondaryMotion(sectionRef.current), [])

  return <section ref={sectionRef} id="selected-works" className="content-portfolio-page content-selected page d06-page06-secondary" data-page-family="design-evidence-continuation" data-d06-page="06-secondary">
    <div className="d06-desktop-layout d06-presentation-canvas">
      <p className="d06-presentation-ghost" aria-hidden="true">PRESENT</p>
      <header className="d06-presentation-heading">
        <span>06B / PRESENTATION STUDY</span>
        <h2>CHARACTER<br /><b>PRESENTATION</b></h2>
        <p>CHARACTER PRESENTATION</p>
      </header>
      <figure className="d06-presentation-art">
        <img {...imageAttrs(principal)} alt={assetAlt(principal)} loading="eager" decoding="async" className="d06-critical-art" />
        <figcaption>CHARACTER PRESENTATION</figcaption>
      </figure>
      <i className="d06-presentation-rule" aria-hidden="true" />
      <span className="d06-presentation-index" aria-hidden="true">06</span>
    </div>

    <div className="d06-legacy-layout">
    <div className="content-shell selected-editorial content-spread">
      <header className="presentation-intro" aria-labelledby="presentation-title">
        <span>06B / PRESENTATION STUDY</span>
        <h2 id="presentation-title">CHARACTER<br />PRESENTATION</h2>
        <p>完整全身造型与配色信息集中呈现，作为肖像研究后的角色展示。</p>
        <i aria-hidden="true" />
      </header>
        <figure className="content-figure selected-primary selected-presentation">
          <img {...imageAttrs(principal)} alt={assetAlt(principal)} loading="lazy" decoding="async" />
          <figcaption><span>CHARACTER PRESENTATION</span></figcaption>
        </figure>
    </div>
    </div>
  </section>
}

export function AdditionalCharacterDesigns() {
  const [designOne, designTwo, designThree, designFour] = additionalCharacterDesigns
  const sectionRef = useRef(null)
  useLayoutEffect(() => initD06Page07Motion(sectionRef.current), [])

  return <section ref={sectionRef} id="additional-designs" className="content-portfolio-page content-additional page d06-page07" data-page-family="design-evidence" data-d06-page="07">
    <div className="d06-desktop-layout d06-archive-canvas">
      <p className="d06-archive-ghost" aria-hidden="true">ARCHIVE</p>
      <header className="d06-archive-heading">
        <span>07 / FINAL DESIGN EVIDENCE</span>
        <h2>CHARACTER DESIGN<br /><b>ARCHIVE</b></h2>
      </header>
      <D06AssetFigure asset={designFour} index={4} className="d06-archive-anchor" critical />
      <D06AssetFigure asset={designOne} index={1} className="d06-archive-support d06-archive-support-a" />
      <D06AssetFigure asset={designTwo} index={2} className="d06-archive-support d06-archive-support-b" />
      <D06AssetFigure asset={designThree} index={3} className="d06-archive-support d06-archive-support-c" />
      <p className="d06-archive-outro">END OF SELECTED WORKS</p>
      <i className="d06-archive-axis" aria-hidden="true" />
    </div>

    <div className="d06-legacy-layout">
    <div className="content-shell">
      <header className="archive-close-head" aria-labelledby="archive-close-title">
        <div><b>07</b><span>ARCHIVE CLOSURE<br />FINAL DESIGN EVIDENCE</span></div>
        <h2 id="archive-close-title">CHARACTER DESIGN ARCHIVE</h2>
        <p>四张三视图保持完整技术可读性，以两组证据带完成内容收束。</p>
      </header>

      <div className="additional-band additional-band-a content-spread d03-paired-spread">
        <FullSheetFigure asset={designOne} index={1} className="additional-item additional-major" normalizedFrame pairedFrame />
        <FullSheetFigure asset={designTwo} index={2} className="additional-item additional-minor" normalizedFrame pairedFrame />
      </div>

      <div className="additional-band additional-band-b content-spread d03-paired-spread">
        <FullSheetFigure asset={designThree} index={3} className="additional-item additional-minor" pairedFrame />
        <FullSheetFigure asset={designFour} index={4} className="additional-item additional-major" pairedFrame />
      </div>

      <footer className="additional-outro" aria-label="内容章节结束">
        <span>END OF SELECTED WORKS</span>
        <i aria-hidden="true" />
        <b>07</b>
      </footer>
    </div>
    <ContentPageMeta number="07" label="ADDITIONAL CHARACTER DESIGNS" />
    </div>
  </section>
}
