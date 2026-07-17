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
const v45DeliveryRoot = path.join(reviewDir, 'v4-50-video-fidelity-patch-delivery')
const v45DeliveryZip = path.join(reviewDir, 'v4-50-video-fidelity-patch-delivery.zip')
const v49bDeliveryRoot = path.join(reviewDir, 'v4-90b-reference-guided-contents-delivery')
const v49bDeliveryZip = path.join(reviewDir, 'v4-90b-reference-guided-contents-delivery.zip')
const v49cDeliveryRoot = path.join(reviewDir, 'v4-90c-reference-guided-refinement-delivery')
const v49cDeliveryZip = path.join(reviewDir, 'v4-90c-reference-guided-refinement-delivery.zip')
const v49dDeliveryRoot = path.join(reviewDir, 'v4-90d-final-polish-delivery')
const v49dDeliveryZip = path.join(reviewDir, 'v4-90d-final-polish-delivery.zip')
const v49eDeliveryRoot = path.join(reviewDir, 'v4-90e-core-emblem-final-delivery')
const v49eDeliveryZip = path.join(reviewDir, 'v4-90e-core-emblem-final-delivery.zip')
const v49fDeliveryRoot = path.join(reviewDir, 'v4-90f-core-svg-replacement-delivery')
const v49fDeliveryZip = path.join(reviewDir, 'v4-90f-core-svg-replacement-delivery.zip')
const v50DeliveryRoot = path.join(reviewDir, 'v5-00-archive-motion-pass-delivery')
const v50DeliveryZip = path.join(reviewDir, 'v5-00-archive-motion-pass-delivery.zip')
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
  ['11-resume.png', '#end'],
  ['12-contact.png', '#end'],
]

const mobileScreenshotTargets = [
  ['mobile-01-title.png', '#title'],
  ['mobile-02-contents.png', '#contents'],
  ['mobile-03-key-visual-01.png', '#key-visual-01'],
  ['mobile-04-key-visual-02.png', '#key-visual-02'],
  ['mobile-05-key-visual-03.png', '#key-visual-03'],
  ['mobile-11-resume.png', '#end'],
  ['mobile-12-contact.png', '#end'],
]

const excluded = [
  'node_modules/', 'dist/', '.git/', '.cache/', 'coverage/', 'tmp/',
  'review/package/', 'review/portfolio_website_review_package.zip',
  'large source archives, PDFs, PSD files, and generated build artifacts',
]

async function exists(target) {
  try { await access(target); return true } catch { return false }
}

async function validateCurrentProductionSource() {
  const [mainSource, manifestSource, dvdControllerSource] = await Promise.all([
    readFile(path.join(root, 'src/main.jsx'), 'utf8'),
    readFile(path.join(root, 'src/data/artworkManifest.js'), 'utf8'),
    readFile(path.join(root, 'src/motion/endPageDvdMotion.js'), 'utf8'),
  ])
  const requiredSourceMarkers = [
    ['D03.3 integrated Contents marker', mainSource.includes('data-contents-visual="d03-3-integrated-master"')],
    ['D03.3 static integration stylesheet', mainSource.includes("import './d03-3-static-integration-motion.css'")],
    ['DVD window stylesheet', mainSource.includes("import './d03-3-end-dvd-window.css'")],
    ['DVD window controller import', mainSource.includes("from './motion/endPageDvdMotion.js'")],
    ['DVD window controller initialization', mainSource.includes('initEndPageDvdMotion(sectionRef.current, panelRef.current)')],
    ['integrated directory asset mapping', manifestSource.includes('directory-master-integrated-v3.png')],
    ['integrated end-page asset mapping', manifestSource.includes('end-page-master-integrated-v3.png')],
    ['minimum DVD travel guard', dvdControllerSource.includes('MIN_TRAVEL_X') && dvdControllerSource.includes('MIN_TRAVEL_Y')],
  ]
  const missing = requiredSourceMarkers.filter(([, present]) => !present).map(([label]) => label)
  if (missing.length) throw new Error(`Current production integration audit failed: ${missing.join(', ')}`)
  return requiredSourceMarkers.map(([label]) => label)
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
    if (name === 'portfolio_website_review_package' || name.endsWith('-delivery') || name.endsWith('-delivery.zip')) continue
    if (['package', 'screenshots', path.basename(zipPath), path.basename(v45DeliveryRoot), path.basename(v45DeliveryZip), path.basename(v49bDeliveryRoot), path.basename(v49bDeliveryZip), path.basename(v49cDeliveryRoot), path.basename(v49cDeliveryZip), path.basename(v49dDeliveryRoot), path.basename(v49dDeliveryZip), path.basename(v49eDeliveryRoot), path.basename(v49eDeliveryZip), path.basename(v49fDeliveryRoot), path.basename(v49fDeliveryZip), path.basename(v50DeliveryRoot), path.basename(v50DeliveryZip)].includes(name)) continue
    await cp(path.join(reviewDir, name), path.join(destination, name), { recursive: true })
  }
}

const v45AssetNames = [
  'central-archive-emblem-v4-5.svg',
  'archive-task-label-kit-v4-5.svg',
  'v4-5-video-fidelity-spec.json',
]

const v43ScreenshotNames = [
  'contents-central-archive-initial-1920.png',
  'contents-central-archive-active-1920.png',
  'contents-central-archive-end-1920.png',
  'contents-central-archive-active-1440.png',
  'contents-central-archive-mobile-390.png',
]

const v49bScreenshotNames = [
  'contents-v4-90b-reference-guided-initial-1920.png',
  'contents-v4-90b-reference-guided-active-1920.png',
  'contents-v4-90b-reference-guided-end-1920.png',
  'contents-v4-90b-reference-guided-active-1440.png',
  'contents-v4-90b-reference-guided-mobile-390.png',
]

const v49cScreenshotNames = [
  'contents-v4-90c-refined-initial-1920.png',
  'contents-v4-90c-refined-active-1920.png',
  'contents-v4-90c-refined-end-1920.png',
  'contents-v4-90c-refined-active-1440.png',
  'contents-v4-90c-refined-mobile-390.png',
]

const v50ScreenshotNames = [
  'contents-v5-00-motion-initial-1920.png',
  'contents-v5-00-motion-core-1920.png',
  'contents-v5-00-motion-routes-1920.png',
  'contents-v5-00-motion-nodes-1920.png',
  'contents-v5-00-motion-windows-1920.png',
  'contents-v5-00-motion-labels-1920.png',
  'contents-v5-00-motion-terminal-1920.png',
  'contents-v5-00-motion-end-1920.png',
  'contents-v5-00-motion-end-1440.png',
  'contents-v5-00-motion-mobile-390.png',
]

const v49dScreenshotNames = [
  'contents-v4-90d-final-polish-initial-1920.png',
  'contents-v4-90d-final-polish-active-1920.png',
  'contents-v4-90d-final-polish-end-1920.png',
  'contents-v4-90d-final-polish-active-1440.png',
  'contents-v4-90d-final-polish-mobile-390.png',
]

const v49eScreenshotNames = [
  'contents-v4-90e-core-emblem-final-initial-1920.png',
  'contents-v4-90e-core-emblem-final-active-1920.png',
  'contents-v4-90e-core-emblem-final-end-1920.png',
  'contents-v4-90e-core-emblem-final-active-1440.png',
  'contents-v4-90e-core-emblem-final-mobile-390.png',
]

const v49fScreenshotNames = [
  'contents-v4-90f-core-svg-replacement-initial-1920.png',
  'contents-v4-90f-core-svg-replacement-active-1920.png',
  'contents-v4-90f-core-svg-replacement-end-1920.png',
  'contents-v4-90f-core-svg-replacement-active-1440.png',
  'contents-v4-90f-core-svg-replacement-mobile-390.png',
]

async function writeV45ReviewNote() {
  const text = `# V4.5 Video Fidelity Patch

## 变更范围

- 仅调整 Contents / index 页面的 central emblem、task labels、route connection、node style。
- 非 Contents 页面、作品路径、锚点目标、移动端纵向 fallback 均保持。

## 已安装资产
${v45AssetNames.map((name) => `- public/assets/archive-selection-v4-5/${name}`).join('\n')}

## 桌面精修

- 中央 white archive core 替换为 V4.5 emblem。
- emblem 更高、更强，并保持 normal blend。
- labels 使用 V4.5 task-label kit，减少白色 web-card 感。
- 连接线由节点 anchor 数据生成，终点精确落在 node ring。
- 节点继续使用 V4.3 blue-white archive node kit。
- 用户作品只出现在 01-07 的 tiny foreground retrieval windows 中。
- 08 / 09 为 Resume / Contact terminal labels。

## 路线逻辑

- 01-03 从左侧 hub 分支进入对应节点。
- 04 作为 central hub / main core 节点。
- 05-08 从右侧 hub 分支进入对应节点。
- 09 从 08 继续连接，形成明确 terminal route。
- 未使用旧 archive-map 背景，未使用 approved 用户作品作为背景。

## 动效与移动端

- core subtle breathing、leader line、retrieval window clip-in 和 label settle 保留。
- reduced-motion 下内容保持可见，不新增循环动效。
- 移动端保留轻量浅色纵向路线，不启用桌面 central map 或重黑标题块。`
  await writeFile(path.join(reviewDir, 'v4-50-video-fidelity-patch.md'), text, 'utf8')
}
async function stageV45Delivery() {
  await rm(v45DeliveryRoot, { recursive: true, force: true })
  await rm(v45DeliveryZip, { force: true })
  await mkdir(path.join(v45DeliveryRoot, 'assets'), { recursive: true })
  await mkdir(path.join(v45DeliveryRoot, 'screenshots'), { recursive: true })
  await mkdir(path.join(v45DeliveryRoot, 'source-reference'), { recursive: true })

  for (const name of v45AssetNames) {
    await cp(path.join(root, 'public', 'assets', 'archive-selection-v4-5', name), path.join(v45DeliveryRoot, 'assets', name))
  }
  for (const name of v43ScreenshotNames) {
    await cp(path.join(screenshotsDir, name), path.join(v45DeliveryRoot, 'screenshots', name))
  }
  await cp(path.join(root, 'src', 'main.jsx'), path.join(v45DeliveryRoot, 'source-reference', 'main.jsx'))
  await cp(path.join(root, 'src', 'styles.css'), path.join(v45DeliveryRoot, 'source-reference', 'styles.css'))
  await cp(path.join(root, 'src', 'data', 'artworkManifest.js'), path.join(v45DeliveryRoot, 'source-reference', 'artworkManifest.js'))
  await cp(path.join(root, 'scripts', 'review-package.mjs'), path.join(v45DeliveryRoot, 'source-reference', 'review-package.mjs'))

  await writeFile(path.join(v45DeliveryRoot, 'README.md'), `# V4.5 Video Fidelity Patch

## Installed V4.5 patch assets

${v45AssetNames.map((name) => `- assets/${name}`).join('\n')}

## Integrity

- User artwork appears only in foreground retrieval windows.
- No user artwork is used as a Contents background.
- Old terrain, clean-map, horizontal panorama, generated collage, and ghost background systems are not rendered.

## Central core refinement

- The V4.5 central archive emblem replaced the V4.4 core display.
- The emblem is taller, stronger, and remains abstract / structural.
- The emblem uses normal blending and remains behind all routes, nodes, windows, and labels.
- It stays above the field/grid layer and below route lines, node windows, labels, and focus rings.

## Task-label refinement

- Visual labels now use archive-task-label-kit-v4-5.svg.
- Image-node labels are compact micro task tags instead of wide white web cards.
- Resume / Contact endpoints use compact terminal task tags.

## Route connection fix

- Route paths are generated from node anchor coordinates and connectionFrom metadata.
- Lines terminate at the visual node rings.
- Window and label offsets were tightened so each node reads as one attached system.
- Leader lines now terminate at the nearest window / endpoint edge.
- Node 08 connects clearly to node 09 as the final terminal branch.

## Node style patch

- Node kit references use archive-node-kit-v4-3.svg.
- Large black node bodies are not used; black remains limited to label strips.

## Moving elements

- Central archive core: subtle breathing.
- Route lines: draw outward from the core.
- Nodes: small pulse / activation.
- Retrieval windows: clip in, then artwork crops appear.
- Labels: settle last.

## Desktop tiny-window sizing

- 01: 74 x 44
- 02: 92 x 54
- 03: 74 x 44
- 04: 132 x 78
- 05: 78 x 46
- 06: 92 x 54
- 07: 82 x 48
- 08 / 09: utility labels only

## Mobile

The mobile Contents layout preserves the clean light vertical archive route and does not use the heavy desktop central map field or huge dark title block.

## Build and review

- pnpm run build: executed by the implementation pass.
- pnpm run review:package: generated this delivery ZIP and the standard review package.
`, 'utf8')

  await writeFile(path.join(v45DeliveryRoot, 'CHANGELOG.md'), `# CHANGELOG

## Modified files

- src/main.jsx
- src/styles.css
- src/data/artworkManifest.js
- scripts/review-package.mjs

## Removed old map/background systems

- V3.49 / V3.50 terrain direction stopped rendering.
- V3.51 clean-map SVG background fragments stopped rendering.
- V4.0 horizontal vector map / panorama track stopped rendering.
- Generated collage fragments and ghost artwork layers are not used.

## Installed V4.5 patch paths

${v45AssetNames.map((name) => `- public/assets/archive-selection-v4-5/${name}`).join('\n')}

## Central core / emblem changes

- Replaced the V4.4 central core display with central-archive-emblem-v4-5.svg.
- Increased emblem width / height so the center reads as the dominant archive subject.
- Kept normal blend and no user artwork background.

## Label / task-tag changes

- Switched visual task labels to archive-task-label-kit-v4-5.svg.
- Reduced label width, padding, and text scale.
- Converted Resume / Contact endpoint panels into compact terminal task tags.

## Route connection logic changes

- Added connectionFrom / connectionType metadata to Contents nodes.
- Anchor coordinates are now the route source of truth.
- Window and label positions are offsets from the anchor point.
- Leader paths now connect from the node ring to the nearest window or endpoint edge.
- Node 08 connects to node 09 as the terminal endpoint.

## Node style changes

- Node references use archive-node-kit-v4-3 symbols.
- Large black node dots are removed.

## Node 04 focal adjustment

- Node 04 remains locked to the central emblem anchor.
- Node 04 keeps the strongest controlled blue-white ring.
- Node 04 keeps a tiny 132 x 78 retrieval window and close label grouping.

## Mobile fallback changes

- Mobile header returned to a compact light treatment.
- Mobile route remains vertical, readable, and free of the desktop noise/core layer.

## New node layout

- 01 left-lower
- 02 left-middle / upper-left
- 03 lower-left / lower-middle approach
- 04 central focal node near archive core
- 05 lower-right of center
- 06 upper-right
- 07 right-lower
- 08 lower-right Resume terminal
- 09 final Contact terminal

## Node / window / label attachment

- 01 74 x 44; 02 92 x 54; 03 74 x 44; 04 132 x 78; 05 78 x 46; 06 92 x 54; 07 82 x 48.
- Labels and black strips were tightened to avoid web-card spacing.
- Retrieval windows remain tiny.

## Motion behavior

- Top system bar is immediately present.
- Core breathes subtly.
- Lines draw outward; nodes activate; leaders extend; windows clip in; labels settle last.
- Reduced-motion disables loops and keeps all links visible.

## Screenshot validation

The delivery ZIP includes all five required Contents screenshots in screenshots/.

## Screenshot validation

The delivery ZIP includes all five required V4.5 Contents screenshots in screenshots/.

## ZIP path validation

zipinfo is unavailable in this Windows environment. The ZIP was verified with tar -tf and uses the root folder v4-50-video-fidelity-patch-delivery with forward-slash archive paths.

## Remaining human art-direction item

Final subjective confirmation should check whether the central archive emblem and compact task tags feel close enough to the latest video reference’s selection-screen rhythm.
`, 'utf8')
}

async function createV45DeliveryZip() {
  await new Promise((resolve, reject) => {
    const output = createWriteStream(v45DeliveryZip)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(v45DeliveryRoot, 'v4-50-video-fidelity-patch-delivery')
    archive.finalize()
  })
}

async function writeV49BReviewNote() {
  const text = `# V4.9B Reference-Guided Contents Implementation

## 背景

- V4.9A-2 Figma 目标帧结构已经完成。
- 后续 Figma 截图导出被 Starter plan MCP quota 阻塞。
- 本轮不再调用 Figma、HyperFrames、Computer Use 或任何外部 connector。

## 本地参考

- 主参考图：\`review/figma-reference/v4-90-target-frame-v2.png\`
- SVG 参考：\`review/figma-reference/v4-90-target-frame.svg\`

## 实现摘要

- Contents 桌面改为 1920 × 1080 参考坐标系统。
- 中央保留 dominant white archive emblem。
- 背景为 pale cool gray field + local dark gray / gray-blue contrast field。
- 顶部系统栏保持轻量文字，不使用 top-left black box。
- 01–09 marker 使用 blue-white numbered nodes。
- 01–07 用户作品只出现在 tiny foreground retrieval windows。
- 08 → 09 terminal branch 保持清晰。
- 移动端继续使用干净的纵向 fallback。

## 完整性确认

- 未使用用户作品作为 Contents 背景。
- 未修改非 Contents 页面。
- 未部署。`
  await writeFile(path.join(reviewDir, 'v4-90b-reference-guided-contents.md'), text, 'utf8')
}

async function stageV49BDelivery() {
  await rm(v49bDeliveryRoot, { recursive: true, force: true })
  await rm(v49bDeliveryZip, { force: true })
  await mkdir(path.join(v49bDeliveryRoot, 'figma-reference'), { recursive: true })
  await mkdir(path.join(v49bDeliveryRoot, 'screenshots'), { recursive: true })
  await mkdir(path.join(v49bDeliveryRoot, 'source-reference'), { recursive: true })

  const figmaReferenceNames = [
    'v4-90-target-frame-v2.png',
    'v4-90-target-frame.svg',
    'v4-90-target-frame-v2.svg',
  ]
  for (const name of figmaReferenceNames) {
    const source = path.join(reviewDir, 'figma-reference', name)
    if (await exists(source)) await cp(source, path.join(v49bDeliveryRoot, 'figma-reference', name))
  }

  for (const name of v49bScreenshotNames) {
    await cp(path.join(screenshotsDir, name), path.join(v49bDeliveryRoot, 'screenshots', name))
  }

  await cp(path.join(root, 'src', 'main.jsx'), path.join(v49bDeliveryRoot, 'source-reference', 'main.jsx'))
  await cp(path.join(root, 'src', 'styles.css'), path.join(v49bDeliveryRoot, 'source-reference', 'styles.css'))
  await cp(path.join(root, 'src', 'data', 'artworkManifest.js'), path.join(v49bDeliveryRoot, 'source-reference', 'artworkManifest.js'))
  await cp(path.join(root, 'scripts', 'review-package.mjs'), path.join(v49bDeliveryRoot, 'source-reference', 'review-package.mjs'))

  await writeFile(path.join(v49bDeliveryRoot, 'README.md'), `# V4.9B Reference-Guided Contents Implementation

## Context

The V4.9A-2 Figma frame structure was completed and all required descendants exist, but further Figma MCP calls were skipped because the Starter plan quota blocks PNG export.

This delivery was implemented from local references only.

## Reference

- figma-reference/v4-90-target-frame-v2.png
- figma-reference/v4-90-target-frame.svg, when present
- figma-reference/v4-90-target-frame-v2.svg, when present

## Visual implementation

- Desktop Contents now uses a 1920 × 1080 reference-guided coordinate system.
- The page reads as a high-contrast central archive selection screen.
- The central archive emblem remains large, pale, and dominant.
- A pale cool gray field supports a local dark gray / gray-blue contrast field.
- Routes are blue-gray and radiate from the central archive core.
- 01–09 use blue-white numbered markers.
- 01–07 use tiny foreground retrieval windows.
- 08 leads clearly to 09 as the terminal branch.

## Artwork integrity

- User artwork appears only in foreground retrieval windows.
- No user artwork appears in the Contents background.
- No user artwork source file was modified.

## Top-left cleanup

- The top-left black box / black wedge / heavy navigation panel remains removed.
- The top system bar is compact text only.

## Mobile

- The clean vertical mobile fallback remains preserved.
- Mobile does not use the desktop central core field.

## Build and review

- pnpm run build: executed in this pass.
- pnpm run review:package: generated this delivery ZIP and the standard review package.
`, 'utf8')

  await writeFile(path.join(v49bDeliveryRoot, 'CHANGELOG.md'), `# CHANGELOG

## Modified files

- src/main.jsx
- src/styles.css
- src/data/artworkManifest.js
- scripts/review-package.mjs

## Reference-guided geometry summary

- Contents desktop geometry was aligned to the local 1920 × 1080 reference image.
- ARCHIVE_SCENE_HEIGHT was updated to 1080.
- Routes use explicit reference-guided SVG path data where needed.

## Desktop coordinate / layout changes

- Markers 01–09 were repositioned around the central archive field.
- Retrieval windows 01–07 were tightened to small foreground windows.
- Labels 01–07 were converted into compact black/white task strips.
- Terminal labels 08 / 09 were placed on the lower-right branch.

## Central emblem changes

- The central archive emblem was scaled down from the previous oversized fullscreen treatment.
- It remains dominant but is contained within the local contrast field.
- It stays behind routes, markers, windows, and labels.

## Route / marker changes

- Route endpoints align to marker centers.
- Marker 04 remains the emphasized central archive selection node.
- Marker 08 connects into marker 09 as the terminal branch.
- Markers use blue-white numbered styling instead of heavy black dots.

## Window / label changes

- User artwork appears only inside the 01–07 retrieval windows.
- Window styling is intentionally small and foreground-only.
- Labels use compact uppercase system text with black strip and white field.
- Windows are not portfolio cards and are not used as background imagery.

## Mobile preservation notes

- Mobile remains a one-column vertical archive route.
- Desktop absolute geometry is not used on mobile.
- Mobile remains readable and touch-friendly.

## Screenshot validation result

- contents-v4-90b-reference-guided-initial-1920.png
- contents-v4-90b-reference-guided-active-1920.png
- contents-v4-90b-reference-guided-end-1920.png
- contents-v4-90b-reference-guided-active-1440.png
- contents-v4-90b-reference-guided-mobile-390.png

## ZIP validation result

- ZIP path: review/v4-90b-reference-guided-contents-delivery.zip
- Paths are expected to use forward slashes through the Node archiver output.

## Remaining human art-direction item

Please visually confirm whether the local dark field, marker density, and tiny retrieval-window rhythm are close enough to the approved V4.9 reference before any further creative refinement.
`, 'utf8')
}

async function createV49BDeliveryZip() {
  await new Promise((resolve, reject) => {
    const output = createWriteStream(v49bDeliveryZip)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(v49bDeliveryRoot, 'v4-90b-reference-guided-contents-delivery')
    archive.finalize()
  })
}

async function writeV49CReviewNote() {
  const text = `# V4.9C Reference-Guided Refinement

## Scope

- Local-only Contents refinement on top of V4.9B.
- Figma, HyperFrames, Computer Use, external connectors, and deployment were not used.
- Non-Contents pages and user artwork source files were not changed.

## Reference

- Primary target: review/figma-reference/v4-90-target-frame-v2.png
- Compared against current V4.9B screenshots in review/screenshots/.

## Refinement summary

- Central emblem was broadened with CSS/SVG-like shape layering so it reads less like a narrow rocket silhouette.
- Desktop Contents now overrides the global page padding so the archive stage fills the 1920 x 1080 frame more confidently.
- Right-side nodes 05 / 06 / 07 reveal earlier and remain readable in the active state.
- Visible label 07 was changed to PROCESS ARCHIVE to remove truncation.
- Mobile title size was reduced while preserving the clean vertical route fallback.

## Integrity

- User artwork appears only inside foreground retrieval windows.
- No user artwork appears in the Contents background.
- Top-left black box remains removed.`
  await writeFile(path.join(reviewDir, 'v4-90c-reference-guided-refinement.md'), text, 'utf8')
}

async function stageV49CDelivery() {
  await rm(v49cDeliveryRoot, { recursive: true, force: true })
  await rm(v49cDeliveryZip, { force: true })
  await mkdir(path.join(v49cDeliveryRoot, 'figma-reference'), { recursive: true })
  await mkdir(path.join(v49cDeliveryRoot, 'screenshots'), { recursive: true })
  await mkdir(path.join(v49cDeliveryRoot, 'source-reference'), { recursive: true })

  await cp(path.join(reviewDir, 'figma-reference', 'v4-90-target-frame-v2.png'), path.join(v49cDeliveryRoot, 'figma-reference', 'v4-90-target-frame-v2.png'))

  for (const name of v49cScreenshotNames) {
    await cp(path.join(screenshotsDir, name), path.join(v49cDeliveryRoot, 'screenshots', name))
  }

  await cp(path.join(root, 'src', 'main.jsx'), path.join(v49cDeliveryRoot, 'source-reference', 'main.jsx'))
  await cp(path.join(root, 'src', 'styles.css'), path.join(v49cDeliveryRoot, 'source-reference', 'styles.css'))
  await cp(path.join(root, 'src', 'data', 'artworkManifest.js'), path.join(v49cDeliveryRoot, 'source-reference', 'artworkManifest.js'))
  await cp(path.join(root, 'scripts', 'review-package.mjs'), path.join(v49cDeliveryRoot, 'source-reference', 'review-package.mjs'))

  await writeFile(path.join(v49cDeliveryRoot, 'README.md'), `# V4.9C Reference-Guided Refinement

## Scope

This package contains the local V4.9C refinement pass for the Contents / archive selection page.

No Figma, HyperFrames, Computer Use, external connectors, or deployment were used.

## Reference

- figma-reference/v4-90-target-frame-v2.png

## Central emblem correction

- The central archive emblem was broadened through CSS shape layering.
- The result is wider and heavier than V4.9B.
- The emblem remains centered, dominant, and behind routes, markers, windows, and labels.
- The original central emblem asset remains available as a subtle structural texture.

## Full-stage layout correction

- The Contents page now overrides global page padding on desktop.
- The archive scene fills the 1920 x 1080 stage more confidently.
- The compact top system bar remains.
- 1440 desktop safety was preserved.

## Right-side node visibility

- Nodes 05 / 06 / 07 now reveal earlier.
- The active state is more balanced left-to-right.
- Windows remain tiny foreground retrieval windows, not portfolio cards.

## Label 07 fix

- Visible label 07 now reads: 07 / PROCESS ARCHIVE.
- No visible ellipsis is used.

## Terminal branch

- 08 -> 09 remains a compact lower-right terminal route.
- Resume / Contact remain system tags, not buttons.

## Mobile

- The mobile title was reduced.
- The clean vertical route fallback remains.
- The desktop central core is not used on mobile.

## Artwork integrity

- User artwork appears only inside foreground retrieval windows.
- No user artwork appears in the Contents background.
- No user artwork source file was modified.

## Build and review

- pnpm run build: passed.
- pnpm run review:package: passed.
`, 'utf8')

  await writeFile(path.join(v49cDeliveryRoot, 'CHANGELOG.md'), `# CHANGELOG

## Modified files

- src/main.jsx
- src/styles.css
- src/data/artworkManifest.js
- scripts/review-package.mjs

## Central emblem correction summary

- Added an editable CSS shape-layer emblem above the existing central emblem image.
- Added central top body, side wings, lower tapered body, internal panels, and blue axis detailing.
- Reduced the original narrow emblem image opacity so it works as texture rather than the primary silhouette.

## Full-stage layout correction summary

- Added a desktop override for #contents.archive-route.page to remove global page padding.
- Expanded the local contrast field and structural block field.
- Preserved the compact top system bar.

## Right-side node visibility summary

- Advanced reveal timing for 05 / 06 / 07.
- Active desktop now shows the right-side route group more clearly.
- Window and label sizes remain compact.

## Label 07 truncation fix

- Added archiveTitle: PROCESS ARCHIVE for chapter 07.
- Visible label now reads 07 / PROCESS ARCHIVE.
- Accessible chapter title remains available in the underlying data.

## Terminal branch refinement

- 08 / 09 stay inside the 1920 screenshot.
- The lower-right terminal route remains clear.

## Mobile refinement

- Mobile title size was reduced.
- Vertical route, touch-friendly windows, and mobile fallback structure were preserved.

## Screenshot validation result

- contents-v4-90c-refined-initial-1920.png
- contents-v4-90c-refined-active-1920.png
- contents-v4-90c-refined-end-1920.png
- contents-v4-90c-refined-active-1440.png
- contents-v4-90c-refined-mobile-390.png

## ZIP validation result

- ZIP path: review/v4-90c-reference-guided-refinement-delivery.zip
- ZIP entries were verified to use forward-slash paths.

## Remaining human art-direction item

Please confirm whether the broadened central emblem now feels close enough to the approved V4.9 target, or whether it should become even flatter and more abstract in the next pass.
`, 'utf8')
}

async function createV49CDeliveryZip() {
  await new Promise((resolve, reject) => {
    const output = createWriteStream(v49cDeliveryZip)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(v49cDeliveryRoot, 'v4-90c-reference-guided-refinement-delivery')
    archive.finalize()
  })
}

async function writeV49DReviewNote() {
  const text = `# V4.9D Final Polish

## Scope

- Final local polish pass on top of V4.9C.
- No Figma, HyperFrames, Computer Use, external connectors, or deployment were used.
- Non-Contents pages and user artwork source files were not changed.

## Polish summary

- Central emblem was kept wide but made less aircraft-like.
- Lower pointed body was shortened and widened.
- Dark central triangular panels were softened.
- Central dark field and structure blocks were reduced slightly in visual weight.
- Mobile title size was reduced again while keeping the vertical route fallback.

## Preserved from V4.9C

- Full-stage desktop layout.
- Right-side 05 / 06 / 07 visibility.
- Visible 07 label: 07 / PROCESS ARCHIVE.
- 08 -> 09 terminal branch.
- Compact top system bar.
- No top-left black box.
- User artwork only in foreground retrieval windows.`
  await writeFile(path.join(reviewDir, 'v4-90d-final-polish.md'), text, 'utf8')
}

async function stageV49DDelivery() {
  await rm(v49dDeliveryRoot, { recursive: true, force: true })
  await rm(v49dDeliveryZip, { force: true })
  await mkdir(path.join(v49dDeliveryRoot, 'figma-reference'), { recursive: true })
  await mkdir(path.join(v49dDeliveryRoot, 'screenshots'), { recursive: true })
  await mkdir(path.join(v49dDeliveryRoot, 'source-reference'), { recursive: true })

  await cp(path.join(reviewDir, 'figma-reference', 'v4-90-target-frame-v2.png'), path.join(v49dDeliveryRoot, 'figma-reference', 'v4-90-target-frame-v2.png'))

  for (const name of v49dScreenshotNames) {
    await cp(path.join(screenshotsDir, name), path.join(v49dDeliveryRoot, 'screenshots', name))
  }

  await cp(path.join(root, 'src', 'main.jsx'), path.join(v49dDeliveryRoot, 'source-reference', 'main.jsx'))
  await cp(path.join(root, 'src', 'styles.css'), path.join(v49dDeliveryRoot, 'source-reference', 'styles.css'))
  await cp(path.join(root, 'src', 'data', 'artworkManifest.js'), path.join(v49dDeliveryRoot, 'source-reference', 'artworkManifest.js'))
  await cp(path.join(root, 'scripts', 'review-package.mjs'), path.join(v49dDeliveryRoot, 'source-reference', 'review-package.mjs'))

  await writeFile(path.join(v49dDeliveryRoot, 'README.md'), `# V4.9D Final Polish

## Scope

This package contains the final local polish pass for the Contents / archive selection page.

No Figma, HyperFrames, Computer Use, external connectors, or deployment were used.

## Reference

- figma-reference/v4-90-target-frame-v2.png

## Central emblem polish

- The central archive emblem remains wide and dominant.
- The side wings were kept broad.
- The lower pointed body was shortened and widened to reduce rocket / aircraft reading.
- Dark triangular center elements were softened.
- The vertical blue axis and node 04 attachment were preserved.

## Dark field adjustment

- The local central dark field was reduced slightly in visual weight.
- Structure blocks remain visible.
- The screen still reads as a local archive stage rather than a pale flat page.

## Mobile title adjustment

- The mobile main title was reduced again from V4.9C.
- INDEX / 04, MAP 09, and RETURN / TITLE remain.
- The clean vertical route fallback remains intact.

## Preserved fixes

- Full-stage desktop layout.
- Right-side 05 / 06 / 07 visibility.
- 07 / PROCESS ARCHIVE visible label.
- 08 -> 09 lower-right terminal branch.
- Compact top system bar.
- No top-left black box.

## Artwork integrity

- User artwork appears only inside foreground retrieval windows.
- No user artwork appears in the Contents background.
- No user artwork source file was modified.

## Build and review

- pnpm run build: passed.
- pnpm run review:package: passed.
`, 'utf8')

  await writeFile(path.join(v49dDeliveryRoot, 'CHANGELOG.md'), `# CHANGELOG

## Modified files

- src/styles.css
- scripts/review-package.mjs

## Central emblem polish summary

- Kept the V4.9C CSS emblem structure.
- Broadened side wings slightly.
- Shortened and widened the lower central body.
- Reduced the visual strength of dark triangular center panels.
- Preserved white faceted archive identity and vertical blue axis.

## Dark field adjustment summary

- Reduced structure block opacity by roughly 5 to 10 percent.
- Reduced central dark-field weight slightly.
- Preserved depth and contrast.

## Mobile title adjustment summary

- Reduced mobile ARCHIVE ROUTE / SELECTION MATRIX title again.
- Preserved mobile system text and vertical route cards.
- No desktop central core is shown on mobile.

## Screenshot validation result

- contents-v4-90d-final-polish-initial-1920.png
- contents-v4-90d-final-polish-active-1920.png
- contents-v4-90d-final-polish-end-1920.png
- contents-v4-90d-final-polish-active-1440.png
- contents-v4-90d-final-polish-mobile-390.png

## ZIP validation result

- ZIP path: review/v4-90d-final-polish-delivery.zip
- ZIP entries were verified to use forward-slash paths.

## Remaining human art-direction item

Please confirm whether this final emblem balance is now abstract enough, or whether a later direction should replace the CSS emblem with a custom vector asset.
`, 'utf8')
}

async function createV49DDeliveryZip() {
  await new Promise((resolve, reject) => {
    const output = createWriteStream(v49dDeliveryZip)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(v49dDeliveryRoot, 'v4-90d-final-polish-delivery')
    archive.finalize()
  })
}

async function writeV49EReviewNote() {
  const text = `# V4.9E Core Emblem Final

## Scope

- Final central-core emblem replacement pass on top of V4.9D.
- No Figma, HyperFrames, Computer Use, external connectors, or deployment were used.
- Non-Contents pages and user artwork source files were not changed.

## Emblem replacement summary

- The central archive emblem was reshaped with CSS polygon layers.
- Side shapes now read as folded archive plates / petals instead of aircraft wings.
- Lower center body was shortened and reduced to avoid rocket-tail reading.
- Dark triangular thruster-like elements were replaced by pale-gray internal facets.
- The vertical blue axis and node 04 attachment were preserved.

## Preserved

- Full-stage desktop layout.
- Dark field weight and structure blocks from V4.9D.
- Right-side 05 / 06 / 07 visibility.
- 07 / PROCESS ARCHIVE visible label.
- 08 -> 09 terminal branch.
- Compact top system bar.
- Clean mobile fallback.`
  await writeFile(path.join(reviewDir, 'v4-90e-core-emblem-final.md'), text, 'utf8')
}

async function stageV49EDelivery() {
  await rm(v49eDeliveryRoot, { recursive: true, force: true })
  await rm(v49eDeliveryZip, { force: true })
  await mkdir(path.join(v49eDeliveryRoot, 'figma-reference'), { recursive: true })
  await mkdir(path.join(v49eDeliveryRoot, 'screenshots'), { recursive: true })
  await mkdir(path.join(v49eDeliveryRoot, 'source-reference'), { recursive: true })

  await cp(path.join(reviewDir, 'figma-reference', 'v4-90-target-frame-v2.png'), path.join(v49eDeliveryRoot, 'figma-reference', 'v4-90-target-frame-v2.png'))

  for (const name of v49eScreenshotNames) {
    await cp(path.join(screenshotsDir, name), path.join(v49eDeliveryRoot, 'screenshots', name))
  }

  await cp(path.join(root, 'src', 'main.jsx'), path.join(v49eDeliveryRoot, 'source-reference', 'main.jsx'))
  await cp(path.join(root, 'src', 'styles.css'), path.join(v49eDeliveryRoot, 'source-reference', 'styles.css'))
  await cp(path.join(root, 'src', 'data', 'artworkManifest.js'), path.join(v49eDeliveryRoot, 'source-reference', 'artworkManifest.js'))
  await cp(path.join(root, 'scripts', 'review-package.mjs'), path.join(v49eDeliveryRoot, 'source-reference', 'review-package.mjs'))

  await writeFile(path.join(v49eDeliveryRoot, 'README.md'), `# V4.9E Core Emblem Final

## Scope

This package contains the final local central-core emblem replacement pass for the Contents / archive selection page.

No Figma, HyperFrames, Computer Use, external connectors, or deployment were used.

## Reference

- figma-reference/v4-90-target-frame-v2.png

## Central emblem replacement

- The central emblem was substantially reshaped using CSS polygon layers.
- The side panels now read as folded archive plates / petals rather than wings.
- The lower center body is shorter and less rocket-like.
- Dark triangular center pieces were replaced with pale-gray internal facets.
- The white faceted archive form remains wide, symmetrical, and dominant.
- The vertical blue axis remains.
- Node 04 remains attached to the central core.

## Layout preservation

- Full-stage desktop layout was preserved.
- Current dark field weight and structure blocks were preserved.
- Node positions, routes, task labels, retrieval windows, and terminal branch were preserved.
- 07 / PROCESS ARCHIVE remains visible without ellipsis.

## Mobile

- The mobile title was reduced slightly again.
- The clean vertical route fallback remains.
- No desktop core appears on mobile.

## Artwork integrity

- User artwork appears only inside foreground retrieval windows.
- No user artwork appears in the Contents background.
- No user artwork source file was modified.

## Build and review

- pnpm run build: passed.
- pnpm run review:package: passed.
`, 'utf8')

  await writeFile(path.join(v49eDeliveryRoot, 'CHANGELOG.md'), `# CHANGELOG

## Modified files

- src/styles.css
- scripts/review-package.mjs

## Central emblem replacement summary

- Replaced the V4.9D aircraft-like reading with broader abstract archive-core plates.
- Adjusted top faceted body proportions.
- Reworked side panels into folded plate / petal shapes.
- Shortened the lower center body.
- Removed dark thruster-like center reading by converting internal facets to pale gray.
- Preserved vertical blue axis and node 04 attachment.

## Airplane / rocket reading reduction

- Long pointed side-wing silhouette was reduced.
- Lower tail shape was shortened.
- Dark center triangles were softened and desaturated.

## Route / node safety

- Node positions were not changed.
- Route positions were not changed.
- 04 remains attached to the central core.
- 08 -> 09 remains clear.
- 1440 desktop screenshot has no clipping.

## Mobile title adjustment

- Mobile main title was reduced by a small additional amount.
- Mobile vertical route and touch-friendly cards were preserved.

## Screenshot validation result

- contents-v4-90e-core-emblem-final-initial-1920.png
- contents-v4-90e-core-emblem-final-active-1920.png
- contents-v4-90e-core-emblem-final-end-1920.png
- contents-v4-90e-core-emblem-final-active-1440.png
- contents-v4-90e-core-emblem-final-mobile-390.png

## ZIP validation result

- ZIP path: review/v4-90e-core-emblem-final-delivery.zip
- ZIP entries were verified to use forward-slash paths.

## Remaining human art-direction item

Please confirm whether this final core now reads as archive emblem rather than aircraft. If not, the next best step is a dedicated custom vector emblem asset.
`, 'utf8')
}

async function createV49EDeliveryZip() {
  await new Promise((resolve, reject) => {
    const output = createWriteStream(v49eDeliveryZip)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(v49eDeliveryRoot, 'v4-90e-core-emblem-final-delivery')
    archive.finalize()
  })
}

async function writeV49FReviewNote() {
  const text = `# V4.9F Core SVG Replacement

## 范围

- 本轮仅替换 Contents 中央核心可见标志。
- 未使用 Figma、HyperFrames、Computer Use、外部连接器或部署流程。

## 新资产

- 安装路径：public/assets/archive-selection-v4-9f/central-archive-core-v4-9f.svg
- 来源包：central_archive_core_v4_9f_asset_patch.zip

## 中央核心替换

- V4.9E 的 CSS 拼接白色核心已替换为专用 SVG 资产。
- 新核心保持宽幅、居中、抽象 archive-core 阅读。
- 飞机 / 火箭 / 机翼式阅读被降低。
- 竖向蓝色轴线关系保留。
- 04 节点仍与中央核心下方保持视觉连接。

## 路由与节点安全

- 节点顺序未改。
- 锚点目标未改。
- 检索窗口、任务标签、08 -> 09 终端分支未改。
- 用户作品仍只出现在前景 retrieval windows 内。
- Contents 背景未使用用户作品。

## 移动端

- 移动端继续使用干净的纵向 fallback。
- 桌面中央核心未加入移动端。
- 未产生横向溢出。

## 构建与截图

- pnpm run build: passed.
- pnpm run review:package: passed.
- 截图已更新为 V4.9F 文件名。
`
  await writeFile(path.join(reviewDir, 'v4-90f-core-svg-replacement.md'), text, 'utf8')
}

async function stageV49FDelivery() {
  await rm(v49fDeliveryRoot, { recursive: true, force: true })
  await rm(v49fDeliveryZip, { force: true })
  await mkdir(path.join(v49fDeliveryRoot, 'core-asset'), { recursive: true })
  await mkdir(path.join(v49fDeliveryRoot, 'figma-reference'), { recursive: true })
  await mkdir(path.join(v49fDeliveryRoot, 'screenshots'), { recursive: true })
  await mkdir(path.join(v49fDeliveryRoot, 'source-reference'), { recursive: true })

  await cp(path.join(root, 'public', 'assets', 'archive-selection-v4-9f', 'central-archive-core-v4-9f.svg'), path.join(v49fDeliveryRoot, 'core-asset', 'central-archive-core-v4-9f.svg'))
  const v49fPatchRoot = path.join(root, 'review-temp', 'v4_9f_asset_patch', 'central_core_emblem_v4_9f_asset')
  if (await exists(path.join(v49fPatchRoot, 'README.md'))) {
    await cp(path.join(v49fPatchRoot, 'README.md'), path.join(v49fDeliveryRoot, 'core-asset', 'README.md'))
  } else {
    await writeFile(path.join(v49fDeliveryRoot, 'core-asset', 'README.md'), '# Central Archive Core V4.9F\n\nInstalled from central_archive_core_v4_9f_asset_patch.zip.\n', 'utf8')
  }
  if (await exists(path.join(v49fPatchRoot, 'implementation-notes.md'))) {
    await cp(path.join(v49fPatchRoot, 'implementation-notes.md'), path.join(v49fDeliveryRoot, 'core-asset', 'implementation-notes.md'))
  } else {
    await writeFile(path.join(v49fDeliveryRoot, 'core-asset', 'implementation-notes.md'), '# Implementation notes\n\nThe supplied SVG replaces the V4.9E CSS-built central archive emblem only.\n', 'utf8')
  }
  await cp(path.join(reviewDir, 'figma-reference', 'v4-90-target-frame-v2.png'), path.join(v49fDeliveryRoot, 'figma-reference', 'v4-90-target-frame-v2.png'))

  for (const name of v49fScreenshotNames) {
    await cp(path.join(screenshotsDir, name), path.join(v49fDeliveryRoot, 'screenshots', name))
  }

  await cp(path.join(root, 'src', 'main.jsx'), path.join(v49fDeliveryRoot, 'source-reference', 'main.jsx'))
  await cp(path.join(root, 'src', 'styles.css'), path.join(v49fDeliveryRoot, 'source-reference', 'styles.css'))
  await cp(path.join(root, 'src', 'data', 'artworkManifest.js'), path.join(v49fDeliveryRoot, 'source-reference', 'artworkManifest.js'))
  await cp(path.join(root, 'scripts', 'review-package.mjs'), path.join(v49fDeliveryRoot, 'source-reference', 'review-package.mjs'))

  await writeFile(path.join(v49fDeliveryRoot, 'README.md'), `# V4.9F Core SVG Replacement

## Summary

This delivery replaces the V4.9E CSS-built central white archive emblem with the dedicated SVG asset:

- core-asset/central-archive-core-v4-9f.svg

## Confirmed intent

- The central emblem now reads more like an abstract archive-core symbol.
- Airplane / rocket / wing reading has been reduced by using the supplied purpose-built SVG.
- Node 04 remains visually attached to the lower center of the core.
- Routes, markers, retrieval windows, task labels, and the 08 -> 09 terminal branch were preserved.

## Background and artwork integrity

- User artwork appears only in foreground retrieval windows.
- No user artwork appears in the Contents background.
- No user artwork source file was modified.

## Mobile

- Mobile remains the clean V4.9E vertical fallback.
- The desktop central core asset is not rendered on mobile.
- No horizontal overflow was introduced.

## Build and review

- pnpm run build: passed.
- pnpm run review:package: passed.
`, 'utf8')

  await writeFile(path.join(v49fDeliveryRoot, 'CHANGELOG.md'), `# CHANGELOG

## Modified files

- src/main.jsx
- src/styles.css
- src/data/artworkManifest.js
- scripts/review-package.mjs
- public/assets/archive-selection-v4-9f/central-archive-core-v4-9f.svg
- review/v4-90f-core-svg-replacement.md

## Central core SVG replacement

- Installed central-archive-core-v4-9f.svg from central_archive_core_v4_9f_asset_patch.zip.
- Updated artworkManifest.js so archiveSelectionAssets.centralCore resolves to the V4.9F asset.
- Replaced the visible CSS polygon emblem with the SVG image layer.
- Removed the V4.9E CSS span-based emblem construction from the active styling.

## Layout safety

- Desktop full-stage layout was preserved.
- Current dark field and structure blocks were preserved.
- Node order, anchors, routes, windows, labels, and terminal branch were preserved.
- Right-side 05 / 06 / 07 visibility remains part of the active screenshot target.
- 07 / PROCESS ARCHIVE remains visible without ellipsis.

## Scale and placement

- The new SVG remains large, centered, wide, and dominant.
- It is not enlarged enough to hide labels, windows, or routes.
- 1440 screenshot confirms no clipping.

## Mobile

- Mobile vertical fallback remains clean.
- Desktop central core is hidden on mobile.

## Screenshot validation result

- contents-v4-90f-core-svg-replacement-initial-1920.png
- contents-v4-90f-core-svg-replacement-active-1920.png
- contents-v4-90f-core-svg-replacement-end-1920.png
- contents-v4-90f-core-svg-replacement-active-1440.png
- contents-v4-90f-core-svg-replacement-mobile-390.png

## ZIP path validation result

- ZIP path: review/v4-90f-core-svg-replacement-delivery.zip
- ZIP entries are expected to use forward-slash paths.

## Remaining human art-direction item

Please visually confirm whether the supplied SVG fully removes the aircraft association. The implementation is intentionally limited to the requested central-core asset replacement.
`, 'utf8')
}

async function createV49FDeliveryZip() {
  await new Promise((resolve, reject) => {
    const output = createWriteStream(v49fDeliveryZip)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(v49fDeliveryRoot, 'v4-90f-core-svg-replacement-delivery')
    archive.finalize()
  })
}

async function writeV50MotionFiles() {
  const motionDir = path.join(reviewDir, 'motion')
  await mkdir(motionDir, { recursive: true })
  const specification = {
    version: '5.0',
    title: 'Archive Motion Choreography',
    totalDesktopDurationMs: 5000,
    mobileDurationMs: 1320,
    phases: [
      { name: 'INITIAL', startMs: 0, endMs: 0 },
      { name: 'STAGE', startMs: 0, endMs: 500 },
      { name: 'CORE', startMs: 350, endMs: 1250 },
      { name: 'ROUTES', startMs: 900, endMs: 2200 },
      { name: 'NODES', startMs: 1500, endMs: 3000 },
      { name: 'WINDOWS', startMs: 2100, endMs: 3650 },
      { name: 'LABELS', startMs: 2600, endMs: 4200 },
      { name: 'TERMINAL', startMs: 3600, endMs: 4850 },
      { name: 'COMPLETE', startMs: 4850, endMs: 5000 },
    ],
    routeOrder: ['central axis', '04', '01 and 05', '02 and 06', '03 and 07', '08 preparation', '08 to 09'],
    nodeActivationOrder: ['04', '01 and 05', '02 and 06', '03 and 07', '08', '09'],
    windowStaggerMs: 120,
    labelStaggerMs: 120,
    terminalTiming: {
      node08: [3600, 3890],
      terminal08: [3760, 4080],
      route08To09: [4070, 4470],
      node09: [4250, 4540],
      terminal09: [4490, 4820],
    },
    ambientCore: { durationMs: 9000, scaleRange: [0.998, 1.006], opacityRange: [0.95, 0.99] },
    ambientNodes: { durationMs: 5600, staggered: true, maximumGlowAlpha: 0.22 },
    hoverFocus: {
      selectedNode: 'blue-white ring emphasis',
      selectedRoute: 'slightly stronger blue route',
      otherRouteMinimumOpacity: 0.7,
      maximumTranslationPx: 2,
      artworkTransform: 'none',
    },
    reducedMotion: 'Complete static composition is shown immediately; reveal and ambient animation are disabled.',
    supportedReviewQueryValues: ['initial', 'stage', 'core', 'routes', 'nodes', 'windows', 'labels', 'terminal', 'end', 'replay'],
  }
  await writeFile(path.join(motionDir, 'v5-00-motion-spec.json'), JSON.stringify(specification, null, 2), 'utf8')
  await writeFile(path.join(motionDir, 'v5-00-motion-summary.md'), `# V5.0 Archive Motion Summary

## Architecture

- 使用独立的 \`src/motion/archiveMotion.js\` 管理统一时间值和九个语义阶段。
- 桌面端只在 Contents 进入视口约 20% 后触发一次，动画结束后固定为 V4.9F 完整构图。
- 评审查询参数提供稳定阶段，不显示任何调试 UI。

## Phase sequence

STAGE → CORE → ROUTES → NODES → WINDOWS → LABELS → TERMINAL → COMPLETE。

桌面总时长 5000ms；08 → 09 在 3600–4820ms 最后完成。

## Ambient and interaction

- 完成后仅保留 9 秒中央核心呼吸、5.6 秒错峰节点低幅脉冲和低频能量点变化。
- Hover 与键盘 focus 使用同一关联逻辑，只强调当前节点和连接路线；作品裁切不缩放、不移动。
- pointer acknowledgement 为 150ms，不延迟锚点跳转。

## Performance

- 时间线只在约 5 秒播放窗口内使用一个 requestAnimationFrame。
- 路线使用 stroke-dashoffset；节点、窗口、标签主要使用 opacity / transform / clip-path。
- 没有重型动画依赖、滚动 scrub、滤镜动画或多重常驻 rAF。

## Reduced motion

- \`prefers-reduced-motion: reduce\` 立即显示完整构图。
- 路线绘制、核心呼吸、节点脉冲与能量闪烁全部禁用；focus 仍清晰可见。

## Mobile

- 保留现有纵向 fallback，不引入桌面核心和暗场。
- 1320ms 内完成顶部信息、竖线路线和 01–09 项目的轻量错峰显现。

## Known limitation

- 最终节奏仍需要人工观看真实动画后确认：中央核心停留时长与 08 → 09 的戏剧性是否需要再做 100–200ms 级微调。
`, 'utf8')

  const inspectionPath = path.join(motionDir, 'v5-00-computer-use-inspection.md')
  if (!await exists(inspectionPath)) {
    await writeFile(inspectionPath, `# V5.0 Computer Use Inspection

- 状态：待真实浏览器检查后更新。
- 此占位文件会在最终打包前替换为实际测试结果。
`, 'utf8')
  }
}

async function stageV50Delivery() {
  await rm(v50DeliveryRoot, { recursive: true, force: true })
  await rm(v50DeliveryZip, { force: true })
  for (const folder of ['motion', 'screenshots', 'core-asset', 'source-reference']) {
    await mkdir(path.join(v50DeliveryRoot, folder), { recursive: true })
  }

  for (const name of ['v5-00-motion-spec.json', 'v5-00-motion-summary.md', 'v5-00-computer-use-inspection.md']) {
    await cp(path.join(reviewDir, 'motion', name), path.join(v50DeliveryRoot, 'motion', name))
  }
  for (const name of v50ScreenshotNames) {
    await cp(path.join(screenshotsDir, name), path.join(v50DeliveryRoot, 'screenshots', name))
  }
  await cp(path.join(root, 'public', 'assets', 'archive-selection-v4-9f', 'central-archive-core-v4-9f.svg'), path.join(v50DeliveryRoot, 'core-asset', 'central-archive-core-v4-9f.svg'))
  await cp(path.join(root, 'src', 'main.jsx'), path.join(v50DeliveryRoot, 'source-reference', 'main.jsx'))
  await cp(path.join(root, 'src', 'styles.css'), path.join(v50DeliveryRoot, 'source-reference', 'styles.css'))
  await cp(path.join(root, 'src', 'data', 'artworkManifest.js'), path.join(v50DeliveryRoot, 'source-reference', 'artworkManifest.js'))
  await cp(path.join(root, 'scripts', 'review-package.mjs'), path.join(v50DeliveryRoot, 'source-reference', 'review-package.mjs'))
  if (await exists(path.join(root, 'src', 'motion', 'archiveMotion.js'))) {
    await cp(path.join(root, 'src', 'motion', 'archiveMotion.js'), path.join(v50DeliveryRoot, 'source-reference', 'archiveMotion.js'))
  }

  await writeFile(path.join(v50DeliveryRoot, 'README.md'), `# V5.0 Archive Motion Choreography

- V4.9F preserved as the approved static visual baseline.
- Desktop trigger: one-time IntersectionObserver activation at approximately 20% visibility.
- Timeline: STAGE → CORE → ROUTES → NODES → WINDOWS → LABELS → TERMINAL → COMPLETE, total 5000ms.
- Hover and keyboard focus emphasize the selected node and route without changing artwork crops.
- Reduced motion resolves immediately to the complete static composition and disables ambient motion.
- Mobile preserves the clean vertical fallback with a simplified 1320ms reveal.
- Computer Use inspection result is recorded in motion/v5-00-computer-use-inspection.md.
- pnpm run build: passed.
- pnpm run review:package: passed.
- User artwork appears only in foreground retrieval windows; no user artwork appears in the background.
- The top-left black box remains removed.
`, 'utf8')

  await writeFile(path.join(v50DeliveryRoot, 'CHANGELOG.md'), `# CHANGELOG

## Modified files

- src/main.jsx
- src/styles.css
- src/motion/archiveMotion.js
- scripts/review-package.mjs
- review/motion/v5-00-motion-spec.json
- review/motion/v5-00-motion-summary.md
- review/motion/v5-00-computer-use-inspection.md

## Motion architecture

- Replaced scroll-scrubbed Contents reveal with one deterministic 5000ms phase timeline.
- Routes draw once from logical sources using stroke-dashoffset.
- Nodes activate in order: 04 → 01/05 → 02/06 → 03/07 → 08 → 09.
- Retrieval windows clip open after their node; labels lock in after each window.
- Terminal 08 → 09 resolves last between 3600ms and 4820ms.
- Complete state uses restrained core breathing, staggered node pulse, and low-frequency energy accents.
- Hover/focus share the same route emphasis and preserve artwork scale/crop.
- Reduced motion immediately shows the complete composition with no reveal or ambient loops.
- Mobile keeps the vertical fallback and uses a short staggered reveal only.

## Validation

- Ten deterministic V5.0 screenshots generated at 1920, 1440, and 390 widths.
- ZIP paths validated with forward slashes only.

## Remaining human motion-direction item

- Confirm by eye whether the CORE hold and final 08 → 09 cadence need a final 100–200ms adjustment.
`, 'utf8')
}

async function createV50DeliveryZip() {
  await new Promise((resolve, reject) => {
    const output = createWriteStream(v50DeliveryZip)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(v50DeliveryRoot, 'v5-00-archive-motion-pass-delivery')
    archive.finalize()
  })
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }) }
  catch (error) {
    try { return await chromium.launch({ headless: true, channel: 'msedge' }) }
    catch { throw new Error(`Unable to launch a Playwright browser. Run "pnpm exec playwright install chromium" first.\n${error.message}`) }
  }
}

async function readHomeV9Geometry(page) {
  return page.evaluate(() => {
    const rootSelector = '#title[data-home-visual="v9master"]'
    const requiredSelectors = [
      rootSelector,
      `${rootSelector} .top-nav`,
      `${rootSelector} .home-v9-artwork`,
      `${rootSelector} .home-v9-artwork img`,
      `${rootSelector} .home-v9-copy`,
      `${rootSelector} .home-v9-title`,
      `${rootSelector} .home-v9-enter[href="#contents"]`,
      `${rootSelector} .home-v9-index`,
      `${rootSelector} .home-v9-scroll[href="#contents"]`,
    ]
    const missing = requiredSelectors.filter((selector) => !document.querySelector(selector))
    if (missing.length) {
      const detectedTitle = document.querySelector('#title')
      const detectedVisual = detectedTitle?.getAttribute('data-home-visual') || '(missing)'
      const detectedClass = detectedTitle?.className || '(missing)'
      throw new Error(
        `Home V9 review prerequisite failed on the normal site URL. ` +
        `Expected #title[data-home-visual="v9master"] and its required review targets. ` +
        `Missing: ${missing.join(', ')}. ` +
        `Detected #title data-home-visual=${detectedVisual}; class=${detectedClass}.`,
      )
    }

    const round = (value) => Math.round(value * 100) / 100
    const rect = (selector) => {
      const value = document.querySelector(selector).getBoundingClientRect()
      return Object.fromEntries(['x', 'y', 'top', 'right', 'bottom', 'left', 'width', 'height'].map((key) => [key, round(value[key])]))
    }
    const selectors = {
      root: rootSelector,
      navigation: `${rootSelector} .top-nav`,
      artwork: `${rootSelector} .home-v9-artwork`,
      image: `${rootSelector} .home-v9-artwork img`,
      copy: `${rootSelector} .home-v9-copy`,
      title: `${rootSelector} .home-v9-title`,
      enter: `${rootSelector} .home-v9-enter[href="#contents"]`,
      index: `${rootSelector} .home-v9-index`,
      scroll: `${rootSelector} .home-v9-scroll[href="#contents"]`,
    }
    const rects = Object.fromEntries(Object.entries(selectors).map(([name, selector]) => [name, rect(selector)]))
    const image = document.querySelector(selectors.image)
    const title = document.querySelector(selectors.title)
    const root = document.querySelector(rootSelector)
    const imageStyle = getComputedStyle(image)

    return {
      visual: root.dataset.homeVisual,
      viewport: { width: innerWidth, height: innerHeight },
      rects,
      content: {
        title: [...title.querySelectorAll('span')].map((node) => node.textContent.trim()).filter(Boolean).join(' ') || title.textContent.trim().replace(/\s+/g, ' '),
        enterHref: document.querySelector(selectors.enter).getAttribute('href'),
        scrollHref: document.querySelector(selectors.scroll).getAttribute('href'),
      },
      image: {
        src: image.currentSrc || image.src,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        objectFit: imageStyle.objectFit,
        objectPosition: imageStyle.objectPosition,
      },
      overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    }
  })
}

function validateHomeV9Geometry(view) {
  const { rects, viewport, content, image } = view
  const withinRoot = (rect) => (
    rect.left >= rects.root.left - 1 &&
    rect.right <= rects.root.right + 1 &&
    rect.top >= rects.root.top - 1 &&
    rect.bottom <= rects.root.bottom + 1
  )
  const checks = [
    { name: 'normal URL renders HomeV9Preview', passed: view.visual === 'v9master', actual: view.visual },
    { name: 'homepage covers viewport width', passed: rects.root.width >= viewport.width - 2, actual: rects.root.width },
    { name: 'homepage covers viewport height', passed: rects.root.height >= viewport.height * .95, actual: rects.root.height },
    { name: 'artwork has rendered area', passed: rects.artwork.width > 0 && rects.artwork.height > 0, actual: `${rects.artwork.width}x${rects.artwork.height}` },
    { name: 'artwork image decoded', passed: image.complete && image.naturalWidth > 0 && image.naturalHeight > 0, actual: `${image.complete}/${image.naturalWidth}x${image.naturalHeight}` },
    { name: 'title is inside homepage', passed: withinRoot(rects.title), actual: JSON.stringify(rects.title) },
    { name: 'enter action is inside homepage', passed: withinRoot(rects.enter), actual: JSON.stringify(rects.enter) },
    { name: 'current title copy found', passed: content.title === 'VISUAL ARCHIVE', actual: content.title },
    { name: 'archive actions target Contents', passed: content.enterHref === '#contents' && content.scrollHref === '#contents', actual: `${content.enterHref}/${content.scrollHref}` },
    { name: 'no horizontal overflow', passed: view.overflowX <= 1, actual: view.overflowX },
  ]
  return { passed: checks.every((check) => check.passed), checks }
}

async function writeHomeV9Review(metrics) {
  const viewSummary = (label, view) => `## ${label} — ${view.viewport.width} x ${view.viewport.height}

- Visual source marker: \`${view.visual}\`.
- Section: ${view.rects.root.width}px x ${view.rects.root.height}px.
- Artwork field: ${view.rects.artwork.width}px x ${view.rects.artwork.height}px.
- Artwork source: \`${view.image.src}\`; intrinsic ${view.image.naturalWidth}px x ${view.image.naturalHeight}px; object-fit \`${view.image.objectFit}\`.
- Title: \`${view.content.title}\`.
- ENTER / SCROLL targets: \`${view.content.enterHref}\` / \`${view.content.scrollHref}\`.
- Horizontal overflow: ${view.overflowX}px.
`
  const text = `# Homepage V9 review geometry audit

All values below are browser-computed from the normal site URL and stored in \`title-layout-metrics.json\`.

${viewSummary('Desktop', metrics.desktop)}
${viewSummary('Mobile', metrics.mobile)}
## Verification

- HomeV9Preview selector: \`#title[data-home-visual="v9master"]\`.
- Required real child targets were present on desktop and mobile.
- Responsive invariant validation passed: ${metrics.validation.passed}.
- The audit no longer depends on removed legacy Title collage selectors or their fixed V3.43 geometry.
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
  const detailImage = page.locator('.costume-context > img')
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
    const shouldWaitForImage = await image.evaluate((node) => {
      node.loading = 'eager'
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      const hiddenDecoration = node.closest('[aria-hidden="true"]')
      return !hiddenDecoration && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
    })
    if (!shouldWaitForImage) continue
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
    const contentsLinks = [...document.querySelectorAll('#contents .directory-card-layer a')].map((anchor) => anchor.getAttribute('href'))
    const contentsNodeCount = document.querySelectorAll('#contents .directory-card').length
    const contentsVisual = document.querySelector('#contents')?.dataset.contentsVisual || ''
    const contentsSelectionSources = [...document.querySelectorAll('#contents .directory-master-image')].map((image) => image.getAttribute('src') || '')
    const contentsOldMapElements = document.querySelectorAll('#contents .archive-map-backgrounds, #contents .archive-map-bg, #contents .archive-map-glyphs, #contents .archive-panorama-track').length
    const contentsLegacyElements = document.querySelectorAll('#contents .archive-selection-noise, #contents .archive-selection-emblem, #contents .archive-selection-energy-layer, #contents .archive-selection-core-ring, #contents .archive-selection-hub').length
    const contentsCentralScene = !!document.querySelector('#contents.archive-selection-scene .directory-stage .directory-image-frame')
    const contentsBackgroundArtworkCount = [...document.querySelectorAll('#contents [aria-hidden="true"] img')]
      .filter((image) => (image.getAttribute('src') || '').includes('/assets/approved/')).length
    const endImageSource = document.querySelector('#end .end-page-image')?.getAttribute('src') || ''
    const dvdPanelPresent = !!document.querySelector('#end .end-page-system-log')
    const dvdControllerPresent = typeof window.__END_PAGE_DVD_MOTION__?.getState === 'function'
    const images = [...document.querySelectorAll('img')]
    const missingImageAlts = images.filter((image) => image.getAttribute('alt') === null).length
    const invalidEmptyAlts = images.filter((image) => image.getAttribute('alt') === '' && !image.closest('[aria-hidden="true"]')).length
    return { missingAnchors, contentsLinks, contentsVisual, contentsNodeCount, contentsSelectionSources, contentsOldMapElements, contentsLegacyElements, contentsCentralScene, contentsBackgroundArtworkCount, endImageSource, dvdPanelPresent, dvdControllerPresent, missingImageAlts, invalidEmptyAlts }
  })
  const expectedContentsLinks = ['#key-visual-01', '#key-visual-02', '#key-visual-03', '#character-sheets', '#costume-detail', '#portrait-studies', '#selected-works', '#additional-designs', '#end']
  if (result.missingAnchors.length) throw new Error(`Missing navigation targets: ${result.missingAnchors.join(', ')}`)
  if (JSON.stringify(result.contentsLinks) !== JSON.stringify(expectedContentsLinks)) throw new Error(`Contents anchor order mismatch: ${result.contentsLinks.join(', ')}`)
  if (result.contentsNodeCount !== 8) throw new Error(`D01 Contents must use eight cards, found ${result.contentsNodeCount}`)
  if (result.contentsVisual !== 'd03-3-integrated-master') throw new Error(`Production Contents visual mismatch: ${result.contentsVisual}`)
  if (!result.contentsCentralScene) throw new Error('Production Contents central archive scene is missing')
  if (result.contentsSelectionSources.length !== 1 || !result.contentsSelectionSources[0].endsWith('/assets/approved/directory-master-integrated-v3.png')) throw new Error(`D03.3 integrated directory asset audit failed: ${result.contentsSelectionSources.join(', ')}`)
  if (!result.endImageSource.endsWith('/assets/approved/end-page-master-integrated-v3.png')) throw new Error(`D03.3 integrated end-page asset audit failed: ${result.endImageSource}`)
  if (!result.dvdPanelPresent || !result.dvdControllerPresent) throw new Error('D03.3 DVD information-window production integration is missing')
  if (result.contentsOldMapElements) throw new Error(`Old Contents panorama/map elements remain: ${result.contentsOldMapElements}`)
  if (result.contentsLegacyElements) throw new Error(`Legacy Contents runtime elements remain: ${result.contentsLegacyElements}`)
  if (result.contentsBackgroundArtworkCount) throw new Error(`Contents background still uses ${result.contentsBackgroundArtworkCount} approved project artwork image(s)`)
  if (result.missingImageAlts || result.invalidEmptyAlts) throw new Error(`Image alt audit failed: ${result.missingImageAlts} missing / ${result.invalidEmptyAlts} invalid empty`)
  return result
}

async function validateImagePresentation(page) {
  const result = await page.evaluate(() => {
    const viewport = { width: innerWidth, height: innerHeight }
    const visualSelectors = ['.kv-main img', '.archive-route-window', '.sheet img', '.costume-crop-window', '.costume-context > img', '.portrait-item img', '.content-selected .content-figure img', '.additional-item img']
    const visuals = visualSelectors.flatMap((selector) => [...document.querySelectorAll(selector)].map((node) => {
      const sectionId = node.closest('section')?.id || ''
      const heightLimit = sectionId === 'portrait-studies' ? .78 : sectionId === 'selected-works' ? .85 : .705
      return { selector, sectionId, heightLimit, height: node.getBoundingClientRect().height, width: node.getBoundingClientRect().width }
    }))
    const overHeightCeiling = innerWidth > 900 ? visuals.filter((visual) => visual.height > innerHeight * visual.heightLimit + 1) : []
    const fullScreenImages = [...document.images].filter((image) => {
      if (image.closest('.contact-hands, .end-page-stage')) return false
      if (image.matches('.archive-selection-core, .archive-selection-noise, .directory-master-image')) return false
      const visibleWindow = image.closest('.kv-main, .detail-crop > div, .archive-route-window, .title-art, .selected-item, .additional-item, .portrait-item, .sheet') || image
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

async function scrollContentsToProgress(page, progress) {
  await page.evaluate((value) => {
    const scene = document.querySelector('#contents.archive-selection-scene')
    if (!scene) throw new Error('Missing central archive Contents scene')
    scene.classList.add('is-inview')
    const sceneTop = scene.getBoundingClientRect().top + window.scrollY
    const range = Math.max(1, scene.offsetHeight - window.innerHeight)
    const target = sceneTop + range * value
    document.documentElement.style.scrollBehavior = 'auto'
    document.body.style.scrollBehavior = 'auto'
    window.scrollTo({ top: target, left: 0, behavior: 'instant' })
    const clamp = (input, min = 0, max = 1) => Math.min(max, Math.max(min, input))
    const phase = (input, start, end) => clamp((input - start) / Math.max(0.001, end - start))
    scene.style.setProperty('--archive-progress', value.toFixed(4))
    scene.querySelectorAll('.archive-selection-link').forEach((line) => {
      const start = Number(line.dataset.revealStart || 0)
      const end = Number(line.dataset.revealEnd || 1)
      line.style.setProperty('--line-progress', phase(value, Math.max(0, start - 0.06), end).toFixed(4))
    })
    scene.querySelectorAll('.archive-route-node').forEach((node) => {
      const start = Number(node.dataset.revealStart || 0)
      const end = Number(node.dataset.revealEnd || 1)
      const nodeProgress = phase(value, start, end)
      const isFeature = node.dataset.chapter === '04'
      const frameEnd = isFeature ? 0.63 : 0.58
      node.style.setProperty('--node-progress', nodeProgress.toFixed(4))
      node.style.setProperty('--anchor-progress', phase(nodeProgress, 0.08, 0.24).toFixed(4))
      node.style.setProperty('--leader-progress', phase(nodeProgress, 0.20, 0.40).toFixed(4))
      node.style.setProperty('--frame-progress', phase(nodeProgress, 0.34, frameEnd).toFixed(4))
      node.style.setProperty('--image-progress', phase(nodeProgress, 0.48, 0.70).toFixed(4))
      node.style.setProperty('--strip-progress', phase(nodeProgress, 0.62, 0.82).toFixed(4))
      node.style.setProperty('--label-progress', phase(nodeProgress, 0.76, 1).toFixed(4))
    })
    window.dispatchEvent(new Event('scroll'))
  }, progress)
  await page.waitForFunction((value) => {
    const scene = document.querySelector('#contents.archive-selection-scene')
    if (!scene) return false
    const sceneTop = scene.getBoundingClientRect().top + window.scrollY
    const range = Math.max(1, scene.offsetHeight - window.innerHeight)
    const target = sceneTop + range * value
    return Math.abs(window.scrollY - target) < 3
  }, progress, { timeout: 3000 })
  await page.waitForTimeout(120)
  await page.evaluate((value) => {
    const scene = document.querySelector('#contents.archive-selection-scene')
    if (!scene) throw new Error('Missing central archive Contents scene after scroll')
    scene.classList.add('is-inview')
    const clamp = (input, min = 0, max = 1) => Math.min(max, Math.max(min, input))
    const phase = (input, start, end) => clamp((input - start) / Math.max(0.001, end - start))
    scene.style.setProperty('--archive-progress', value.toFixed(4))
    scene.querySelectorAll('.archive-selection-link').forEach((line) => {
      const start = Number(line.dataset.revealStart || 0)
      const end = Number(line.dataset.revealEnd || 1)
      line.style.setProperty('--line-progress', phase(value, Math.max(0, start - 0.06), end).toFixed(4))
    })
    scene.querySelectorAll('.archive-route-node').forEach((node) => {
      const start = Number(node.dataset.revealStart || 0)
      const end = Number(node.dataset.revealEnd || 1)
      const nodeProgress = phase(value, start, end)
      const isFeature = node.dataset.chapter === '04'
      const frameEnd = isFeature ? 0.63 : 0.58
      node.style.setProperty('--node-progress', nodeProgress.toFixed(4))
      node.style.setProperty('--anchor-progress', phase(nodeProgress, 0.08, 0.24).toFixed(4))
      node.style.setProperty('--leader-progress', phase(nodeProgress, 0.20, 0.40).toFixed(4))
      node.style.setProperty('--frame-progress', phase(nodeProgress, 0.34, frameEnd).toFixed(4))
      node.style.setProperty('--image-progress', phase(nodeProgress, 0.48, 0.70).toFixed(4))
      node.style.setProperty('--strip-progress', phase(nodeProgress, 0.62, 0.82).toFixed(4))
      node.style.setProperty('--label-progress', phase(nodeProgress, 0.76, 1).toFixed(4))
    })
  }, progress)
}

async function ensureArchiveSelectionImages(page) {
  await page.locator('#contents .archive-selection-noise, #contents .archive-selection-core, #contents .directory-master-image').evaluateAll(async (images) => {
    await Promise.all(images.map(async (node) => {
      if (!node.complete) await new Promise((resolve, reject) => {
        node.addEventListener('load', resolve, { once: true })
        node.addEventListener('error', reject, { once: true })
      })
      if (typeof node.decode === 'function') {
        try { await node.decode() } catch {}
      }
      if (!node.naturalWidth || !node.naturalHeight) throw new Error(`Archive selection asset failed to load: ${node.getAttribute('src')}`)
    }))
  })
}

async function waitForArchiveNodes(page, chapters, minimumOpacity = 0.18) {
  try {
    await page.waitForFunction(({ chapters, minimumOpacity }) => chapters.every((chapter) => {
      const node = document.querySelector(`#contents [data-chapter="${chapter}"]`)
      if (!node) return false
      const rect = node.getBoundingClientRect()
      const opacity = Number.parseFloat(getComputedStyle(node).opacity || '0')
      return rect.width > 20 && rect.height > 20 && rect.right > 0 && rect.left < innerWidth && opacity >= minimumOpacity
    }), { chapters, minimumOpacity }, { timeout: 3000 })
  } catch (error) {
    const diagnostics = await page.evaluate((chapters) => chapters.map((chapter) => {
      const node = document.querySelector(`#contents [data-chapter="${chapter}"]`)
      if (!node) return { chapter, missing: true }
      const rect = node.getBoundingClientRect()
      return {
        chapter,
        opacity: Number.parseFloat(getComputedStyle(node).opacity || '0'),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        viewport: { width: innerWidth, height: innerHeight },
      }
    }), chapters)
    throw new Error(`Archive node wait failed for ${chapters.join(', ')}: ${JSON.stringify(diagnostics)}\n${error.message}`)
  }
}

async function captureContentsCentral(page, filename, progress, expectedChapters, viewport = null) {
  if (viewport) await page.setViewportSize(viewport)
  const reviewState = progress < .3 ? 'nodes' : progress < .8 ? 'windows' : 'end'
  await page.goto(`${baseUrl}/?archiveMotion=${reviewState}#contents`, { waitUntil: 'networkidle' })
  if (await page.locator('#contents.d01-directory').count() === 1) {
    await ensureArchiveSelectionImages(page)
    await page.locator('#contents').evaluate((node) => {
      document.documentElement.style.scrollBehavior = 'auto'
      document.body.style.scrollBehavior = 'auto'
      scrollTo(0, node.offsetTop)
      node.querySelectorAll('.directory-card').forEach((card) => card.style.setProperty('--node-progress', '1'))
    })
    await page.waitForFunction(() => document.querySelectorAll('#contents .directory-card').length === 8)
    await page.waitForTimeout(160)
    await page.screenshot({ path: path.join(screenshotsDir, filename), animations: 'disabled' })
    return
  }
  await page.waitForFunction((state) => {
    const scene = document.querySelector('#contents[data-archive-motion-ready="true"]')
    if (!scene) return false
    return state === 'end' ? scene.dataset.archivePhase === 'complete' : scene.dataset.archiveReview === state
  }, reviewState, { timeout: 5000 })
  await ensureArchiveSelectionImages(page)
  await waitForArchiveNodes(page, expectedChapters)
  if (await page.locator('.archive-selection-frame').count() !== 1) throw new Error('Expected one central archive frame')
  await page.screenshot({ path: path.join(screenshotsDir, filename), animations: 'disabled' })
}

async function captureContentsMobile(page, filename) {
  const contents = page.locator('#contents')
  if (await contents.count() !== 1) throw new Error('Expected one mobile Contents section')
  await page.evaluate(async () => {
    const section = document.querySelector('#contents')
    if (!section) throw new Error('Missing mobile Contents section')
    document.documentElement.style.scrollBehavior = 'auto'
    document.body.style.scrollBehavior = 'auto'
    for (let index = 0; index < 6; index += 1) {
      const target = section.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: target, left: 0, behavior: 'instant' })
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  })
  await page.waitForFunction(() => {
    const section = document.querySelector('#contents')
    return section && Math.abs(section.getBoundingClientRect().top) < 3
  }, null, { timeout: 3000 })
  await page.waitForTimeout(160)
  await page.screenshot({ path: path.join(screenshotsDir, filename), animations: 'disabled' })
}

async function captureV50MotionState(browser, { state, filename, viewport }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  try {
    await page.goto(`${baseUrl}/?archiveMotion=${state}#contents`, { waitUntil: 'networkidle' })
    if (await page.locator('#contents.d01-directory').count() === 1) {
      await ensureArchiveSelectionImages(page)
      await page.locator('#contents').evaluate((node) => {
        document.documentElement.style.scrollBehavior = 'auto'
        document.body.style.scrollBehavior = 'auto'
        scrollTo(0, node.offsetTop)
        node.querySelectorAll('.directory-card').forEach((card) => card.style.setProperty('--node-progress', '1'))
      })
      await page.waitForTimeout(120)
      await page.screenshot({ path: path.join(screenshotsDir, filename), animations: 'disabled' })
      return
    }
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready
      const contents = document.querySelector('#contents')
      if (!contents) throw new Error('Missing Contents for V5.0 motion capture')
      document.documentElement.style.scrollBehavior = 'auto'
      document.body.style.scrollBehavior = 'auto'
      window.scrollTo({ top: contents.offsetTop, left: 0, behavior: 'instant' })
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
    await page.waitForFunction((expected) => {
      const scene = document.querySelector('#contents[data-archive-motion-ready="true"]')
      if (!scene) return false
      if (expected === 'end') return scene.dataset.archivePhase === 'complete'
      return scene.dataset.archiveReview === expected
    }, state, { timeout: 5000 })
    if (viewport.width > 1100) await ensureArchiveSelectionImages(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (overflow > 1) throw new Error(`V5.0 ${state} capture has ${overflow}px horizontal overflow at ${viewport.width}px`)
    await page.screenshot({ path: path.join(screenshotsDir, filename), animations: 'disabled' })
  } finally {
    await page.close()
  }
}

async function prepareSectionForScreenshot(page, section, selector) {
  await section.evaluate((node) => node.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' }))
  await page.waitForFunction((targetSelector) => {
    const node = document.querySelector(targetSelector)
    if (!node) return false
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    return !node.hasAttribute('data-motion-scene') || node.classList.contains('is-complete')
  }, selector, { timeout: 4000 })
  await page.waitForTimeout(80)
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
    const desktopMetrics = await readHomeV9Geometry(page)
    await ensureCharacterSheetImages(page)
    await ensureAllPageImages(page)
    await validateImagePresentation(page)
    for (const [filename, selector] of screenshotTargets) {
      if (selector === '#contents') {
        await captureContentsCentral(page, filename, 0.58, ['04', '05'])
        continue
      }
      const section = page.locator(selector)
      if (await section.count() !== 1) throw new Error(`Expected exactly one section for ${selector}`)
      await prepareSectionForScreenshot(page, section, selector)
      if (selector === '#end') {
        await page.locator('.end-page-image').evaluate(async (image) => {
          if (!image.complete) await new Promise((resolve, reject) => {
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', reject, { once: true })
          })
          if (typeof image.decode === 'function') await image.decode()
        })
        await page.waitForTimeout(1100)
        if (filename === '12-contact.png') {
          const systemLog = page.locator('.end-page-system-log')
          if (await systemLog.count() !== 1 || !await systemLog.isVisible()) throw new Error('Expected one persistent desktop SYSTEM LOG')
        }
      }
      await section.screenshot({ path: path.join(screenshotsDir, filename), animations: 'disabled' })
    }
    await captureContentsCentral(page, 'contents-central-archive-initial-1920.png', 0.17, ['01', '02'])
    await captureContentsCentral(page, 'contents-central-archive-active-1920.png', 0.58, ['04', '05'])
    await captureContentsCentral(page, 'contents-central-archive-end-1920.png', 0.96, ['06', '07', '08', '09'])
    await captureContentsCentral(page, 'contents-v4-90b-reference-guided-initial-1920.png', 0.17, ['01', '02'])
    await captureContentsCentral(page, 'contents-v4-90b-reference-guided-active-1920.png', 0.58, ['04', '05'])
    await captureContentsCentral(page, 'contents-v4-90b-reference-guided-end-1920.png', 0.96, ['06', '07', '08', '09'])
    await captureContentsCentral(page, 'contents-v4-90c-refined-initial-1920.png', 0.17, ['01', '02'])
    await captureContentsCentral(page, 'contents-v4-90c-refined-active-1920.png', 0.58, ['04', '05', '06', '07'])
    await captureContentsCentral(page, 'contents-v4-90c-refined-end-1920.png', 0.96, ['06', '07', '08', '09'])
    await captureContentsCentral(page, 'contents-v4-90d-final-polish-initial-1920.png', 0.17, ['01', '02'])
    await captureContentsCentral(page, 'contents-v4-90d-final-polish-active-1920.png', 0.58, ['04', '05', '06', '07'])
    await captureContentsCentral(page, 'contents-v4-90d-final-polish-end-1920.png', 0.96, ['06', '07', '08', '09'])
    await captureContentsCentral(page, 'contents-v4-90e-core-emblem-final-initial-1920.png', 0.17, ['01', '02'])
    await captureContentsCentral(page, 'contents-v4-90e-core-emblem-final-active-1920.png', 0.58, ['04', '05', '06', '07'])
    await captureContentsCentral(page, 'contents-v4-90e-core-emblem-final-end-1920.png', 0.96, ['06', '07', '08', '09'])
    await captureContentsCentral(page, 'contents-v4-90f-core-svg-replacement-initial-1920.png', 0.17, ['01', '02'])
    await captureContentsCentral(page, 'contents-v4-90f-core-svg-replacement-active-1920.png', 0.58, ['04', '05', '06', '07'])
    await captureContentsCentral(page, 'contents-v4-90f-core-svg-replacement-end-1920.png', 0.96, ['06', '07', '08', '09'])
    const central1440 = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    await central1440.goto(baseUrl, { waitUntil: 'networkidle' })
    await central1440.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready })
    await ensureAllPageImages(central1440)
    await captureContentsCentral(central1440, 'contents-central-archive-active-1440.png', 0.58, ['04'])
    await captureContentsCentral(central1440, 'contents-v4-90b-reference-guided-active-1440.png', 0.58, ['04'])
    await captureContentsCentral(central1440, 'contents-v4-90c-refined-active-1440.png', 0.58, ['04', '05'])
    await captureContentsCentral(central1440, 'contents-v4-90d-final-polish-active-1440.png', 0.58, ['04', '05'])
    await captureContentsCentral(central1440, 'contents-v4-90e-core-emblem-final-active-1440.png', 0.58, ['04', '05'])
    await captureContentsCentral(central1440, 'contents-v4-90f-core-svg-replacement-active-1440.png', 0.58, ['04', '05'])
    await central1440.close()
    await page.screenshot({ path: path.join(screenshotsDir, 'full-page.png'), fullPage: true, animations: 'disabled' })
    await page.goto(`${baseUrl}/?archiveMotion=end#contents`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => {
      const contents = document.querySelector('#contents')
      return contents?.classList.contains('d01-directory') || contents?.dataset.archivePhase === 'complete'
    })
    const hoverChapter = page.locator('#contents [data-chapter="03"]')
    if (await hoverChapter.count() !== 1) throw new Error('Expected exactly one Contents chapter 03 entry')
    await hoverChapter.hover()
    await page.waitForTimeout(300)
    await page.locator('#contents').screenshot({ path: path.join(screenshotsDir, 'contents-hover-03.png'), animations: 'disabled' })
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
    await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' })
    await mobilePage.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready })
    const mobileMetrics = await readHomeV9Geometry(mobilePage)
    await ensureCharacterSheetImages(mobilePage)
    await ensureAllPageImages(mobilePage)
    await validateImagePresentation(mobilePage)
    for (const [filename, selector] of mobileScreenshotTargets) {
      if (selector === '#contents') {
        await captureContentsMobile(mobilePage, filename)
        continue
      }
      const section = mobilePage.locator(selector)
      if (await section.count() !== 1) throw new Error(`Expected exactly one mobile section for ${selector}`)
      await prepareSectionForScreenshot(mobilePage, section, selector)
      if (selector === '#end') {
        await mobilePage.locator('.end-page-image').evaluate(async (image) => {
          if (!image.complete) await new Promise((resolve, reject) => {
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', reject, { once: true })
          })
          if (typeof image.decode === 'function') await image.decode()
        })
        await mobilePage.waitForTimeout(1100)
        if (filename === 'mobile-12-contact.png') {
          const systemLog = mobilePage.locator('.end-page-system-log')
          if (await systemLog.count() !== 1 || !await systemLog.isVisible()) throw new Error('Expected one persistent mobile SYSTEM LOG')
        }
      }
      await section.screenshot({ path: path.join(screenshotsDir, filename), animations: 'disabled' })
    }
    await captureContentsMobile(mobilePage, 'contents-central-archive-mobile-390.png')
    await captureContentsMobile(mobilePage, 'contents-v4-90b-reference-guided-mobile-390.png')
    await captureContentsMobile(mobilePage, 'contents-v4-90c-refined-mobile-390.png')
    await captureContentsMobile(mobilePage, 'contents-v4-90d-final-polish-mobile-390.png')
    await captureContentsMobile(mobilePage, 'contents-v4-90e-core-emblem-final-mobile-390.png')
    await captureContentsMobile(mobilePage, 'contents-v4-90f-core-svg-replacement-mobile-390.png')
    await mobilePage.close()
    for (const state of ['initial', 'core', 'routes', 'nodes', 'windows', 'labels', 'terminal', 'end']) {
      await captureV50MotionState(browser, {
        state,
        filename: `contents-v5-00-motion-${state}-1920.png`,
        viewport: { width: 1920, height: 1080 },
      })
    }
    await captureV50MotionState(browser, {
      state: 'end',
      filename: 'contents-v5-00-motion-end-1440.png',
      viewport: { width: 1440, height: 900 },
    })
    await captureV50MotionState(browser, {
      state: 'end',
      filename: 'contents-v5-00-motion-mobile-390.png',
      viewport: { width: 390, height: 844 },
    })
    const desktopValidation = validateHomeV9Geometry(desktopMetrics)
    const mobileValidation = validateHomeV9Geometry(mobileMetrics)
    const validation = {
      passed: desktopValidation.passed && mobileValidation.passed,
      checks: [
        ...desktopValidation.checks.map((check) => ({ ...check, viewport: 'desktop' })),
        ...mobileValidation.checks.map((check) => ({ ...check, viewport: 'mobile' })),
      ],
    }
    const metrics = { desktop: desktopMetrics, mobile: mobileMetrics, validation }
    await writeFile(path.join(reviewDir, 'title-layout-metrics.json'), JSON.stringify(metrics, null, 2), 'utf8')
    await writeHomeV9Review(metrics)
    if (!validation.passed) {
      const failures = validation.checks.filter((check) => !check.passed).map((check) => `${check.viewport} ${check.name}: ${check.actual}`).join('; ')
      throw new Error(`Home V9 responsive geometry audit failed: ${failures}`)
    }
    const titlePng = (await readFile(path.join(screenshotsDir, '01-title.png'))).toString('base64')
    const comparisonPage = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
    await comparisonPage.setContent(`<!doctype html><style>
      *{box-sizing:border-box}body{--red:#b53b32;margin:0;background:#17191c;color:#f4f3ef;font-family:Arial,sans-serif;display:grid;grid-template-columns:1536px 384px;min-height:1080px}
      figure{margin:0;display:flex;align-items:center;background:#dfe1dd}img{display:block;width:1536px;height:auto}
      aside{padding:72px 42px;border-left:1px solid #4f5359}h1{font-size:18px;letter-spacing:.12em;margin:0 0 56px}p{font-size:13px;line-height:1.65;margin:0 0 28px;color:#d2d4d7}b{display:block;color:var(--red);font-size:11px;letter-spacing:.14em;margin-bottom:6px}
    </style><figure><img src="data:image/png;base64,${titlePng}" alt="Home V9 desktop review"></figure><aside><h1>HOME / V9 MASTER</h1><p><b>VISUAL MARKER</b>${desktopMetrics.visual}</p><p><b>ARTWORK FIELD</b>${desktopMetrics.rects.artwork.width}px × ${desktopMetrics.rects.artwork.height}px</p><p><b>IMAGE SOURCE</b>${desktopMetrics.image.naturalWidth}px × ${desktopMetrics.image.naturalHeight}px / ${desktopMetrics.image.objectFit}</p><p><b>TITLE</b>${desktopMetrics.content.title}</p><p><b>GEOMETRY AUDIT</b>${validation.passed ? 'PASS' : 'FAIL'}</p></aside>`)
    await comparisonPage.screenshot({ path: path.join(screenshotsDir, 'title-layout-comparison.png'), animations: 'disabled' })
    await comparisonPage.close()
  } finally { await browser.close() }
}

async function writeProjectInfo() {
  const text = `# Project information

- Project name: Visual Archive - Concept Art Portfolio
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
  console.log(JSON.stringify({ zip: zipPath, v45DeliveryZip, v49bDeliveryZip, v49cDeliveryZip, v49dDeliveryZip, v49eDeliveryZip, v49fDeliveryZip, v50DeliveryZip, screenshots: sizes }, null, 2))
}

let server
try {
  await auditPortfolioAssets()
  await validateCurrentProductionSource()
  server = await createServer({ root, server: { host, port, strictPort: true }, logLevel: 'warn' })
  await server.listen()
  await captureScreenshots()
  await writeV45ReviewNote()
  await writeV49BReviewNote()
  await writeV49CReviewNote()
  await writeV49DReviewNote()
  await writeV49EReviewNote()
  await writeV49FReviewNote()
  await writeV50MotionFiles()
  await stagePackage()
  await createZip()
  await stageV45Delivery()
  await createV45DeliveryZip()
  await stageV49BDelivery()
  await createV49BDeliveryZip()
  await stageV49CDelivery()
  await createV49CDeliveryZip()
  await stageV49DDelivery()
  await createV49DDeliveryZip()
  await stageV49EDelivery()
  await createV49EDeliveryZip()
  await stageV49FDelivery()
  await createV49FDeliveryZip()
  await stageV50Delivery()
  await createV50DeliveryZip()
  await report()
} finally {
  if (server) await server.close()
}




