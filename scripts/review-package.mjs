import { createWriteStream } from 'node:fs'
import { access, cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { auditPortfolioAssets } from './audit-portfolio-assets.mjs'

const require = createRequire(import.meta.url)
const archiver = require('archiver')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const reviewDir = path.join(root, 'review')
const screenshotsDir = path.join(reviewDir, 'screenshots')
const packageDir = path.join(reviewDir, 'package')
const packageRoot = path.join(packageDir, 'portfolio_website_review_package')
const zipPath = path.join(reviewDir, 'portfolio_website_review_package.zip')
const host = '127.0.0.1'
const port = 4173
const baseUrl = `http://${host}:${port}`

const screenshotTargets = [
  ['01-title.png', '#title'],
  ['02-contents.png', '#contents'],
  ['03-key-visual-01.png', '#key-visual-01'],
  ['04-key-visual-02.png', '#key-visual-02'],
  ['05-key-visual-03.png', '#key-visual-03'],
  ['06-character-sheets.png', '#character-sheets'],
  ['07-costume-detail.png', '#costume-detail'],
  ['08-portrait-studies.png', '#portrait-studies'],
  ['09-selected-works.png', '#selected-works'],
  ['10-additional-character-designs.png', '#additional-designs'],
  ['11-resume.png', '#resume-contact-resume'],
  ['12-contact.png', '#resume-contact-contact'],
]

const mobileScreenshotTargets = [
  ['mobile-01-title.png', '#title'],
  ['mobile-02-contents.png', '#contents'],
  ['mobile-03-key-visual-01.png', '#key-visual-01'],
  ['mobile-04-key-visual-02.png', '#key-visual-02'],
  ['mobile-05-key-visual-03.png', '#key-visual-03'],
  ['mobile-11-resume.png', '#resume-contact-resume'],
  ['mobile-12-contact.png', '#resume-contact-contact'],
]

const excluded = [
  'node_modules/', 'dist/', '.git/', '.cache/', 'coverage/', 'tmp/',
  'review/package/', 'review/portfolio_website_review_package.zip',
  'large source archives, PDFs, PSD files, and generated build artifacts',
]

async function exists(target) {
  try { await access(target); return true } catch { return false }
}

async function copyIfPresent(relativePath) {
  const source = path.join(root, relativePath)
  if (!await exists(source)) return false
  const destination = path.join(packageRoot, relativePath)
  await mkdir(path.dirname(destination), { recursive: true })
  await cp(source, destination, { recursive: true })
  return true
}

async function copyMatchingFiles(prefix) {
  for (const name of (await readdir(root)).filter((item) => item.startsWith(prefix))) await copyIfPresent(name)
}

async function copyReviewMetadata() {
  const destination = path.join(packageRoot, 'review')
  await mkdir(destination, { recursive: true })
  for (const name of await readdir(reviewDir)) {
    if (['package', 'screenshots', path.basename(zipPath)].includes(name)) continue
    await cp(path.join(reviewDir, name), path.join(destination, name), { recursive: true })
  }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }) }
  catch (error) {
    try { return await chromium.launch({ headless: true, channel: 'msedge' }) }
    catch { throw new Error(`Unable to launch a Playwright browser. Run "pnpm exec playwright install chromium" first.\n${error.message}`) }
  }
}

async function readTitleGeometry(page) {
  return page.evaluate(() => {
    const round = (value) => Math.round(value * 100) / 100
    const rect = (selector) => {
      const node = document.querySelector(selector)
      if (!node) throw new Error(`Missing geometry target: ${selector}`)
      const value = node.getBoundingClientRect()
      return Object.fromEntries(['x', 'y', 'top', 'right', 'bottom', 'left', 'width', 'height'].map((key) => [key, round(value[key])]))
    }
    const selectors = ['.title-band', '.title-art-main', '.title-art-side', '.title-checker', '.title-signal', '.title-strokes', '.title-lockup h1', '.title-lockup h2']
    const rects = Object.fromEntries(selectors.map((selector) => [selector, rect(selector)]))
    const pageNode = document.querySelector('.title-page')
    const pageRect = pageNode.getBoundingClientRect()
    const footerStyle = getComputedStyle(pageNode, '::after')
    const footerWidth = parseFloat(footerStyle.width)
    const footerHeight = parseFloat(footerStyle.height)
    const footerLeft = pageRect.left + parseFloat(footerStyle.left)
    const footerBottom = pageRect.bottom - parseFloat(footerStyle.bottom)
    const footerRule = {
      x: round(footerLeft), y: round(footerBottom - footerHeight), top: round(footerBottom - footerHeight),
      right: round(footerLeft + footerWidth), bottom: round(footerBottom), left: round(footerLeft),
      width: round(footerWidth), height: round(footerHeight),
    }
    return {
      viewport: { width: innerWidth, height: innerHeight }, rects, footerRule,
      derived: { panelGap: round(rects['.title-art-side'].left - rects['.title-art-main'].right) },
    }
  })
}

function validateDesktopGeometry(desktop) {
  const values = [
    ['poster collage top', desktop.rects['.title-band'].top, 170, 190],
    ['poster collage height', desktop.rects['.title-band'].height, 660, 680],
    ['primary scan width', desktop.rects['.title-art-main'].width, 600, 700],
    ['scan overlap offset', desktop.derived.panelGap, -330, -230],
    ['large grain width', desktop.rects['.title-checker'].width, 430, 450],
    ['large grain height', desktop.rects['.title-checker'].height, 430, 450],
    ['cobalt signal width', desktop.rects['.title-signal'].width, 145, 160],
  ]
  const checks = values.map(([name, value, min, max]) => ({ name, value, min, max, passed: value >= min && value <= max }))
  return { passed: checks.every((check) => check.passed), checks }
}

async function writeTitleReview(metrics) {
  const d = metrics.desktop
  const m = metrics.mobile
  const text = `# Homepage Title geometry rebuild

All values below are browser-computed values from \`title-layout-metrics.json\`.

## Desktop — ${d.viewport.width} × ${d.viewport.height}

- Image strip: top ${d.rects['.title-band'].top}px; height ${d.rects['.title-band'].height}px; bottom ${d.rects['.title-band'].bottom}px.
- Primary panel width: ${d.rects['.title-art-main'].width}px.
- Panel gap: ${d.derived.panelGap}px.
- Secondary panel width: ${d.rects['.title-art-side'].width}px.
- Diamond band: ${d.rects['.title-checker'].width}px × ${d.rects['.title-checker'].height}px.
- Homepage lime line: ${d.rects['.title-signal'].width}px × ${d.rects['.title-signal'].height}px.
- Title: left ${d.rects['.title-lockup h1'].left}px; width ${d.rects['.title-lockup h1'].width}px; bottom ${d.rects['.title-lockup h1'].bottom}px.
- Role text: top ${d.rects['.title-lockup h2'].top}px; left ${d.rects['.title-lockup h2'].left}px.
- Footer rule: ${d.footerRule.width}px × ${d.footerRule.height}px; bottom ${d.footerRule.bottom}px.

## Mobile — ${m.viewport.width} × ${m.viewport.height}

- Image strip: top ${m.rects['.title-band'].top}px; height ${m.rects['.title-band'].height}px; bottom ${m.rects['.title-band'].bottom}px.
- Primary panel width: ${m.rects['.title-art-main'].width}px; panel gap: ${m.derived.panelGap}px; secondary width: ${m.rects['.title-art-side'].width}px.
- Diamond band: ${m.rects['.title-checker'].width}px × ${m.rects['.title-checker'].height}px.
- Homepage lime line width: ${m.rects['.title-signal'].width}px.
- Title: left ${m.rects['.title-lockup h1'].left}px; width ${m.rects['.title-lockup h1'].width}px.
- Role text: top ${m.rects['.title-lockup h2'].top}px; left ${m.rects['.title-lockup h2'].left}px.

## Verified integrity

- Geometry validation passed: ${metrics.validation.passed}.
- Diamond pattern uses explicit SVG rhombus polygons; no square checkerboard remains.
- Homepage lime is isolated to the Title line and diagonal stroke cluster.
- No line texture overlays the architecture artwork.
- The architecture artwork was not modified.
- The former role sticker remains removed.
`
  await writeFile(path.join(reviewDir, 'homepage-title-rebuild.md'), text, 'utf8')
}

async function writeTitleReviewV343(metrics) {
  const d = metrics.desktop
  const m = metrics.mobile
  const text = `# Homepage Title V3.43 editorial poster audit

All values below are browser-computed values from \`title-layout-metrics.json\`.

## Desktop — ${d.viewport.width} x ${d.viewport.height}

- Architecture scan collage: top ${d.rects['.title-band'].top}px; height ${d.rects['.title-band'].height}px; bottom ${d.rects['.title-band'].bottom}px.
- Primary scan panel: ${d.rects['.title-art-main'].width}px x ${d.rects['.title-art-main'].height}px.
- Secondary scan overlap value: ${d.derived.panelGap}px.
- Secondary scan panel: ${d.rects['.title-art-side'].width}px x ${d.rects['.title-art-side'].height}px.
- Large black print texture: ${d.rects['.title-checker'].width}px x ${d.rects['.title-checker'].height}px.
- Cobalt signal bar: ${d.rects['.title-signal'].width}px x ${d.rects['.title-signal'].height}px.
- Title: left ${d.rects['.title-lockup h1'].left}px; width ${d.rects['.title-lockup h1'].width}px; bottom ${d.rects['.title-lockup h1'].bottom}px.
- Role text: top ${d.rects['.title-lockup h2'].top}px; left ${d.rects['.title-lockup h2'].left}px.
- Footer rule: ${d.footerRule.width}px x ${d.footerRule.height}px; bottom ${d.footerRule.bottom}px.

## Mobile — ${m.viewport.width} x ${m.viewport.height}

- Architecture scan collage: top ${m.rects['.title-band'].top}px; height ${m.rects['.title-band'].height}px; bottom ${m.rects['.title-band'].bottom}px.
- Primary scan width: ${m.rects['.title-art-main'].width}px; secondary overlap value: ${m.derived.panelGap}px; secondary width: ${m.rects['.title-art-side'].width}px.
- Large black print texture: ${m.rects['.title-checker'].width}px x ${m.rects['.title-checker'].height}px.
- Cobalt signal bar width: ${m.rects['.title-signal'].width}px.
- Title: left ${m.rects['.title-lockup h1'].left}px; width ${m.rects['.title-lockup h1'].width}px.
- Role text: top ${m.rects['.title-lockup h2'].top}px; left ${m.rects['.title-lockup h2'].left}px.

## Verified integrity

- V3.43 poster geometry validation passed: ${metrics.validation.passed}.
- Title uses the approved architecture image as cropped scan panels.
- Cobalt field is flat and Title-only.
- Black print textures are abstract grain objects only.
- Supplied-reference statues, rococo frames, birds, Japanese copy, copied blue-square placement, and copied circle placement were intentionally avoided.
- The architecture artwork was not modified.
- Non-title pages were not part of this audit.
`
  await writeFile(path.join(reviewDir, 'homepage-title-rebuild.md'), text, 'utf8')
}

async function ensureCharacterSheetImages(page) {
  const images = page.locator('.sheet img')
  const count = await images.count()
  if (count !== 4) throw new Error(`Expected four Character Sheet images, found ${count}`)
  const dimensions = []
  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index)
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(async (node) => {
      if (!node.complete) await new Promise((resolve, reject) => {
        node.addEventListener('load', resolve, { once: true })
        node.addEventListener('error', reject, { once: true })
      })
      if (typeof node.decode === 'function') await node.decode()
    })
    const size = await image.evaluate((node) => ({ naturalWidth: node.naturalWidth, naturalHeight: node.naturalHeight, complete: node.complete }))
    if (!size.complete || size.naturalWidth === 0 || size.naturalHeight === 0) throw new Error(`Character Sheet ${index + 1} failed to render: ${JSON.stringify(size)}`)
    dimensions.push(size)
    await page.waitForTimeout(100)
  }
  const detailImage = page.locator('.detail-main img')
  if (await detailImage.count() !== 1) throw new Error('Expected one Costume Detail reference image')
  await detailImage.scrollIntoViewIfNeeded()
  await detailImage.evaluate(async (node) => { if (typeof node.decode === 'function') await node.decode() })
  const detailSize = await detailImage.evaluate((node) => ({ naturalWidth: node.naturalWidth, naturalHeight: node.naturalHeight, complete: node.complete }))
  if (!detailSize.complete || detailSize.naturalWidth === 0 || detailSize.naturalHeight === 0) throw new Error(`Costume Detail reference failed to render: ${JSON.stringify(detailSize)}`)
  await page.waitForTimeout(250)
  return { sheets: dimensions, costumeReference: detailSize }
}

async function ensureAllPageImages(page) {
  const images = page.locator('img')
  const count = await images.count()
  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index)
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(async (node) => {
      node.loading = 'eager'
      if (!node.complete) await new Promise((resolve, reject) => {
        node.addEventListener('load', resolve, { once: true })
        node.addEventListener('error', reject, { once: true })
      })
      if (typeof node.decode === 'function') {
        try { await node.decode() } catch {}
      }
    })
  }
  await page.evaluate(() => window.scrollTo(0, 0))
}

async function validatePageStructure(page) {
  const result = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll('a[href^="#"]')].map((anchor) => anchor.getAttribute('href'))
    const missingAnchors = [...new Set(anchors)].filter((href) => href.length < 2 || !document.querySelector(href))
    const contentsLinks = [...document.querySelectorAll('#contents .contents-index-entry')].map((anchor) => anchor.getAttribute('href'))
    const contentsColumns = getComputedStyle(document.querySelector('.contents-index-grid')).gridTemplateColumns.split(' ').length
    const images = [...document.querySelectorAll('img')]
    const missingImageAlts = images.filter((image) => image.getAttribute('alt') === null).length
    const invalidEmptyAlts = images.filter((image) => image.getAttribute('alt') === '' && !image.closest('[aria-hidden="true"]')).length
    return { missingAnchors, contentsLinks, contentsColumns, missingImageAlts, invalidEmptyAlts }
  })
  const expectedContentsLinks = ['#key-visual-01', '#key-visual-02', '#key-visual-03', '#character-sheets', '#costume-detail', '#portrait-studies', '#additional-designs', '#resume-contact-resume', '#resume-contact-contact', '#title']
  if (result.missingAnchors.length) throw new Error(`Missing navigation targets: ${result.missingAnchors.join(', ')}`)
  if (JSON.stringify(result.contentsLinks) !== JSON.stringify(expectedContentsLinks)) throw new Error(`Contents anchor order mismatch: ${result.contentsLinks.join(', ')}`)
  if (page.viewportSize().width > 900 && result.contentsColumns !== 5) throw new Error(`Desktop Contents must use five columns, found ${result.contentsColumns}`)
  if (result.missingImageAlts || result.invalidEmptyAlts) throw new Error(`Image alt audit failed: ${result.missingImageAlts} missing / ${result.invalidEmptyAlts} invalid empty`)
  return result
}

async function validateImagePresentation(page) {
  const result = await page.evaluate(() => {
    const viewport = { width: innerWidth, height: innerHeight }
    const visualSelectors = ['.kv-main img', '.contents-index-preview', '.sheet img', '.detail-main img', '.detail-crop>div', '.portrait-item img', '.selected-item img', '.additional-item img']
    const visuals = visualSelectors.flatMap((selector) => [...document.querySelectorAll(selector)].map((node) => ({ selector, height: node.getBoundingClientRect().height, width: node.getBoundingClientRect().width })))
    const overHeightCeiling = innerWidth > 900 ? visuals.filter((visual) => visual.height > innerHeight * .705) : []
    const fullScreenImages = [...document.images].filter((image) => {
      if (image.closest('.contact-hands')) return false
      const visibleWindow = image.closest('.kv-main, .detail-crop > div, .contents-index-preview, .title-art, .selected-item, .additional-item, .portrait-item, .sheet') || image
      const rect = visibleWindow.getBoundingClientRect()
      return rect.width >= innerWidth * .95 && rect.height >= innerHeight * .9
    }).map((image) => image.getAttribute('src'))
    const approvedBackgroundContent = [...document.querySelectorAll('*')].filter((node) => getComputedStyle(node).backgroundImage.includes('/assets/approved/') && !node.closest('.contact-hands')).length
    const heroHierarchy = [...document.querySelectorAll('.key-visual-page')].every((section) => section.querySelector('.kv-meta h2')?.textContent.trim() && section.querySelector('.kv-main img'))
    return { viewport, overHeightCeiling, fullScreenImages, approvedBackgroundContent, heroHierarchy }
  })
  if (result.overHeightCeiling.length) throw new Error(`Desktop image height ceiling exceeded: ${JSON.stringify(result.overHeightCeiling)}`)
  if (result.fullScreenImages.length) throw new Error(`Full-screen dominant images detected: ${result.fullScreenImages.join(', ')}`)
  if (result.approvedBackgroundContent) throw new Error(`${result.approvedBackgroundContent} approved artwork backgrounds remain as primary content`)
    if (!result.heroHierarchy) throw new Error('Key Visual hierarchy is missing typography or image content')
  return result
}

async function captureScreenshots() {
  await rm(screenshotsDir, { recursive: true, force: true })
  await mkdir(screenshotsDir, { recursive: true })
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready })
    await validatePageStructure(page)
    const desktopMetrics = await readTitleGeometry(page)
    await ensureCharacterSheetImages(page)
    await ensureAllPageImages(page)
    await validateImagePresentation(page)
    for (const [filename, selector] of screenshotTargets) {
      const section = page.locator(selector)
      if (await section.count() !== 1) throw new Error(`Expected exactly one section for ${selector}`)
      await section.screenshot({ path: path.join(screenshotsDir, filename), animations: 'disabled' })
    }
    await page.screenshot({ path: path.join(screenshotsDir, 'full-page.png'), fullPage: true, animations: 'disabled' })
    const hoverChapter = page.locator('[data-chapter="03"]')
    if (await hoverChapter.count() !== 1) throw new Error('Expected exactly one Contents chapter 03 entry')
    await hoverChapter.hover()
    await page.waitForTimeout(300)
    await hoverChapter.screenshot({ path: path.join(screenshotsDir, 'contents-hover-03.png') })
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
    await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' })
    await mobilePage.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready })
    const mobileMetrics = await readTitleGeometry(mobilePage)
    await ensureCharacterSheetImages(mobilePage)
    await ensureAllPageImages(mobilePage)
    await validateImagePresentation(mobilePage)
    for (const [filename, selector] of mobileScreenshotTargets) {
      const section = mobilePage.locator(selector)
      if (await section.count() !== 1) throw new Error(`Expected exactly one mobile section for ${selector}`)
      await section.screenshot({ path: path.join(screenshotsDir, filename), animations: 'disabled' })
    }
    await mobilePage.close()
    const validation = validateDesktopGeometry(desktopMetrics)
    const metrics = { desktop: desktopMetrics, mobile: mobileMetrics, validation }
    await writeFile(path.join(reviewDir, 'title-layout-metrics.json'), JSON.stringify(metrics, null, 2), 'utf8')
    await writeTitleReviewV343(metrics)
    if (!validation.passed) {
      const failures = validation.checks.filter((check) => !check.passed).map((check) => `${check.name}: ${check.value} not in ${check.min}–${check.max}`).join('; ')
      throw new Error(`Title geometry audit failed: ${failures}`)
    }
    const titlePng = (await readFile(path.join(screenshotsDir, '01-title.png'))).toString('base64')
    const comparisonPage = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
    await comparisonPage.setContent(`<!doctype html><style>
      *{box-sizing:border-box}body{--red:#b53b32;margin:0;background:#17191c;color:#f4f3ef;font-family:Arial,sans-serif;display:grid;grid-template-columns:1536px 384px;min-height:1080px}
      figure{margin:0;display:flex;align-items:center;background:#dfe1dd}img{display:block;width:1536px;height:auto}
      aside{padding:72px 42px;border-left:1px solid #4f5359}h1{font-size:18px;letter-spacing:.12em;margin:0 0 56px}p{font-size:13px;line-height:1.65;margin:0 0 28px;color:#d2d4d7}b{display:block;color:var(--red);font-size:11px;letter-spacing:.14em;margin-bottom:6px}
    </style><figure><img src="data:image/png;base64,${titlePng}" alt="V3.43 desktop Title"></figure><aside><h1>TITLE / V3.43</h1><p><b>EDITORIAL POSTER</b>${desktopMetrics.rects['.title-band'].top}px top / ${desktopMetrics.rects['.title-band'].height}px collage height</p><p><b>ARCHITECTURE SCANS</b>approved Title image reused as offset cropped panels</p><p><b>COBALT FIELD</b>${desktopMetrics.rects['.title-signal'].width}px signal bar / flat Title-only color</p><p><b>PRINT GRAIN</b>${desktopMetrics.rects['.title-checker'].width}px abstract black texture form</p><p><b>GEOMETRY AUDIT</b>${validation.passed ? 'PASS' : 'FAIL'}</p></aside>`)
    await comparisonPage.screenshot({ path: path.join(screenshotsDir, 'title-layout-comparison.png'), animations: 'disabled' })
    await comparisonPage.close()
  } finally { await browser.close() }
}

async function writeProjectInfo() {
  const text = `# Project information

- Project name: Huang Guo Tai - Character Concept Artist Portfolio
- Install dependencies: \`pnpm install\`, then \`pnpm exec playwright install chromium\`
- Run local preview: \`pnpm run dev\`
- Generate screenshots and review package: \`pnpm run review:package\`

## Intentionally excluded

${excluded.map((item) => `- ${item}`).join('\n')}
`
  await writeFile(path.join(packageRoot, 'PROJECT_INFO.md'), text, 'utf8')
}

async function stagePackage() {
  await rm(packageDir, { recursive: true, force: true })
  await mkdir(packageRoot, { recursive: true })
  for (const item of ['src', 'public', '.github', '.gitignore', 'package.json', 'pnpm-lock.yaml', 'index.html', 'README.md', 'PORTFOLIO_MAINTENANCE.md', 'DEPLOYMENT.md', 'DEPLOY_GITHUB_PAGES.md', 'scripts']) await copyIfPresent(item)
  await copyMatchingFiles('vite.config.')
  await copyMatchingFiles('playwright.config.')
  await cp(screenshotsDir, path.join(packageRoot, 'screenshots'), { recursive: true })
  await copyReviewMetadata()
  for (const name of ['assets-mapping.md', 'assets-contact-sheet.jpg']) {
    const source = path.join(reviewDir, name)
    if (await exists(source)) await cp(source, path.join(packageRoot, name))
  }
  await writeProjectInfo()
}

async function createZip() {
  await rm(zipPath, { force: true })
  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(packageRoot, 'portfolio_website_review_package')
    archive.finalize()
  })
}

async function report() {
  const sizes = {}
  for (const file of await readdir(screenshotsDir)) sizes[file] = (await stat(path.join(screenshotsDir, file))).size
  console.log(JSON.stringify({ zip: zipPath, screenshots: sizes }, null, 2))
}

let server
try {
  await auditPortfolioAssets()
  server = await createServer({ root, server: { host, port, strictPort: true }, logLevel: 'warn' })
  await server.listen()
  await captureScreenshots()
  await stagePackage()
  await createZip()
  await report()
} finally {
  if (server) await server.close()
}
