import React from 'react'
import {
  additionalCharacterDesigns,
  characterSheets,
  costumeDetailAsset,
  portraitStudies,
  selectedWorks,
} from '../data/artworkManifest.js'

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

function FullSheetFigure({ asset, index, className = '', characterSheet = false, linkLabel = 'VIEW FULL SHEET' }) {
  return <figure className={`content-figure ${characterSheet ? 'sheet' : ''} ${className}`.trim()}>
    <img {...imageAttrs(asset)} alt={assetAlt(asset)} loading="lazy" decoding="async" />
    <figcaption>
      <span><b>{String(index).padStart(2, '0')}</b>{asset.label}</span>
      <a href={asset.src} target="_blank" rel="noreferrer">{linkLabel}</a>
    </figcaption>
  </figure>
}

export function CharacterSheets() {
  const [sheetOne, sheetTwo, sheetThree, sheetFour] = characterSheets

  return <section id="character-sheets" className="content-portfolio-page content-sheets page" data-page-family="design-evidence">
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

      <div className="sheet-comparison content-spread" aria-label="角色设定图对照">
        <FullSheetFigure asset={sheetTwo} index={2} className="sheet-support sheet-comparison-a" characterSheet />
        <FullSheetFigure asset={sheetThree} index={3} className="sheet-support sheet-comparison-b" characterSheet />
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
  </section>
}

export function CostumeDetail() {
  return <section id="costume-detail" className="content-portfolio-page content-costume page" data-page-family="detail-focus">
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
  </section>
}

export function PortraitStudies() {
  const [darkPortrait, lightPortrait] = portraitStudies
  const [, redProfile, blueSky] = selectedWorks

  return <section id="portrait-studies" className="content-portfolio-page content-portraits page" data-page-family="hero-detail">
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

    <div className="content-shell portrait-study-sequence content-spread" aria-label="横向人物图像研究">
      <figure className="content-figure portrait-item portrait-study-red">
        <img {...imageAttrs(redProfile)} alt={assetAlt(redProfile)} loading="lazy" decoding="async" />
        <figcaption><span>IMAGE STUDY / 03 / RED PROFILE</span></figcaption>
      </figure>
      <figure className="content-figure portrait-item portrait-study-blue">
        <img {...imageAttrs(blueSky)} alt={assetAlt(blueSky)} loading="lazy" decoding="async" />
        <figcaption><span>IMAGE STUDY / 04 / BLUE SKY</span></figcaption>
      </figure>
    </div>
    <ContentPageMeta number="06" label="PORTRAIT STUDIES" />
  </section>
}

export function SelectedWorks() {
  const [principal] = selectedWorks

  return <section id="selected-works" className="content-portfolio-page content-selected page" data-page-family="design-evidence-continuation">
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
  </section>
}

export function AdditionalCharacterDesigns() {
  const [designOne, designTwo, designThree, designFour] = additionalCharacterDesigns

  return <section id="additional-designs" className="content-portfolio-page content-additional page" data-page-family="design-evidence">
    <div className="content-shell">
      <header className="archive-close-head" aria-labelledby="archive-close-title">
        <div><b>07</b><span>ARCHIVE CLOSURE<br />FINAL DESIGN EVIDENCE</span></div>
        <h2 id="archive-close-title">CHARACTER DESIGN ARCHIVE</h2>
        <p>四张三视图保持完整技术可读性，以两组证据带完成内容收束。</p>
      </header>

      <div className="additional-band additional-band-a content-spread">
        <FullSheetFigure asset={designOne} index={1} className="additional-item additional-major" />
        <FullSheetFigure asset={designTwo} index={2} className="additional-item additional-minor" />
      </div>

      <div className="additional-band additional-band-b content-spread">
        <FullSheetFigure asset={designThree} index={3} className="additional-item additional-minor" />
        <FullSheetFigure asset={designFour} index={4} className="additional-item additional-major" />
      </div>

      <footer className="additional-outro" aria-label="内容章节结束">
        <span>END OF SELECTED WORKS</span>
        <i aria-hidden="true" />
        <b>07</b>
      </footer>
    </div>
    <ContentPageMeta number="07" label="ADDITIONAL CHARACTER DESIGNS" />
  </section>
}
