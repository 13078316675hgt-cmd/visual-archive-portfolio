import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const baseUrl = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4173'
const screenshotDir = path.join(root, 'review', 'screenshots')
const motionDir = path.join(root, 'review', 'motion-capture')
const reportDir = path.join(root, 'review', 'contents-v6')
const videoTemp = path.join(motionDir, '.v6-46-video-temp')
const normalRecording = path.join(motionDir, 'v6-46-route-tangent-motion-1920.webm')
const interactionRecording = path.join(motionDir, 'v6-46-route-tangent-interaction-1920.webm')
const visualMasterPath = path.join(root, 'public', 'assets', 'contents-v6-4', 'contents-v6-4-clean-atmosphere-plate.png')
const v645ImplementationPath = path.join(root, 'review', 'v6-45-final-polish-route-cleanup-delivery', 'screenshots', 'contents-v6-45-polish-end-1920.png')

await mkdir(screenshotDir, { recursive: true })
await mkdir(motionDir, { recursive: true })
await mkdir(reportDir, { recursive: true })

const fixedStates = [
  ['initial', 'initial'],
  ['stage', 'stage'],
  ['core', 'core'],
  ['routes', 'routes'],
  ['nodes', 'nodes'],
  ['windows', 'windows'],
  ['labels', 'labels'],
  ['terminal', 'terminal'],
  ['end', 'complete'],
]
const screenshotStates = new Set(['end'])
const screenshotName = (state, width = 1920) => `contents-v6-46-${state}-${width}.png`
const url = (motion, hash = '#contents') => `${baseUrl}/?contentsVisual=v6master&archiveMotion=${motion}${hash}`

const attachDiagnostics = (page) => {
  const consoleErrors = []
  const failedRequests = []
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => consoleErrors.push(error.message))
  page.on('requestfailed', (request) => failedRequests.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`))
  return { consoleErrors, failedRequests }
}

const waitForPhase = async (page, phase) => {
  await page.waitForFunction((expected) => document.querySelector('#contents')?.dataset.archivePhase === expected, phase, { timeout: 15000 })
}

const inspectPage = async (page) => page.evaluate(() => {
  const contents = document.querySelector('#contents')
  const plate = document.querySelector('.v6-master-plate')
  const frame = document.querySelector('.archive-selection-frame')
  const routeSvg = contents?.querySelector('.v6-master-route')
  const routeRect = routeSvg?.getBoundingClientRect()
  const routeGeometry = Array.from(contents?.querySelectorAll('.v6-master-route .archive-selection-link') || [], (path) => {
    const chapter = path.dataset.routeChapter
    const marker = contents?.querySelector(`.v6-master-node[data-chapter="${chapter}"] .v6-master-marker`)
    const markerRect = marker?.getBoundingClientRect()
    const endPoint = path.getPointAtLength(path.getTotalLength())
    const endX = routeRect ? routeRect.left + (endPoint.x / 1920) * routeRect.width : 0
    const endY = routeRect ? routeRect.top + (endPoint.y / 1080) * routeRect.height : 0
    const markerX = markerRect ? markerRect.left + markerRect.width / 2 : 0
    const markerY = markerRect ? markerRect.top + markerRect.height / 2 : 0
    return {
      chapter,
      d: path.getAttribute('d'),
      endpointError: Math.hypot(endX - markerX, endY - markerY),
    }
  })
  const tangentAngle = (x, y) => Math.atan2(y, x) * 180 / Math.PI
  const tangentDifference = (a, b) => {
    const difference = Math.abs(a - b) % 360
    return difference > 180 ? 360 - difference : difference
  }
  const pathNumbers = (chapter) => (contents?.querySelector(`.archive-selection-link-${chapter}`)?.getAttribute('d')?.match(/-?\d+(?:\.\d+)?/g) || []).map(Number)
  const tangentAudit = ['03', '06', '08'].map((chapter) => {
    const outgoingChapter = String(Number(chapter) + 1).padStart(2, '0')
    const incoming = pathNumbers(chapter)
    const outgoing = pathNumbers(outgoingChapter)
    const incomingAngle = tangentAngle(incoming.at(-2) - incoming.at(-4), incoming.at(-1) - incoming.at(-3))
    const outgoingAngle = tangentAngle(outgoing[2] - outgoing[0], outgoing[3] - outgoing[1])
    return { chapter, incomingAngle, outgoingAngle, mismatch: tangentDifference(incomingAngle, outgoingAngle) }
  })
  const marker05Rect = contents?.querySelector('.v6-master-node[data-chapter="05"] .v6-master-marker')?.getBoundingClientRect()
  const window05Rect = contents?.querySelector('.v6-master-node[data-chapter="05"] .v6-master-window')?.getBoundingClientRect()
  const marker05WindowOverlap = Boolean(marker05Rect && window05Rect && marker05Rect.left < window05Rect.right && marker05Rect.right > window05Rect.left && marker05Rect.top < window05Rect.bottom && marker05Rect.bottom > window05Rect.top)
  return {
    visual: contents?.dataset.contentsVisual || 'production',
    phase: contents?.dataset.archivePhase || '',
    chapterLinks: contents?.querySelectorAll('a.archive-route-node').length || 0,
    uniqueChapters: new Set(Array.from(contents?.querySelectorAll('a.archive-route-node') || [], (node) => node.dataset.chapter)).size,
    platePresent: Boolean(plate),
    plateLoaded: Boolean(plate?.complete && plate?.naturalWidth),
    plateSrc: plate?.currentSrc || null,
    cleanPlateActive: Boolean(plate?.currentSrc?.includes('/assets/contents-v6-4/contents-v6-4-clean-atmosphere-plate.png')),
    oldMasterRendered: Boolean(contents?.querySelector('img[src*="contents-v6-1-visual-master"]')),
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    frameRect: frame?.getBoundingClientRect().toJSON() || null,
    selected04: Boolean(contents?.querySelector('[data-chapter="04"]')),
    terminal08: Boolean(contents?.querySelector('[data-chapter="08"]')),
    terminal09: Boolean(contents?.querySelector('[data-chapter="09"]')),
    systemHeadPresent: Boolean(contents?.querySelector('.v6-master-system-head')),
    terminal09InsideViewport: (() => {
      const terminal = contents?.querySelector('[data-chapter="09"] .v6-master-terminal')
      if (!terminal) return false
      const rect = terminal.getBoundingClientRect()
      return rect.left >= 0 && rect.right <= document.documentElement.clientWidth
    })(),
    routePathCount: routeGeometry.length,
    routeEndpointMaxError: routeGeometry.length ? Math.max(...routeGeometry.map((route) => route.endpointError)) : null,
    routeGeometry,
    tangentAudit,
    tangentMismatchMax: Math.max(...tangentAudit.map((entry) => entry.mismatch)),
    marker05WindowOverlap,
    marker05Rect: marker05Rect?.toJSON() || null,
    window05Rect: window05Rect?.toJSON() || null,
  }
})

const browser = await chromium.launch({ headless: true })
const stateValidation = []
let desktop1440
let mobile390
let reducedMotion
let interactionValidation
let normalMotionDurationMs

try {
  const desktopContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  for (const [reviewState, expectedPhase] of fixedStates) {
    const page = await desktopContext.newPage()
    const diagnostics = attachDiagnostics(page)
    const response = await page.goto(url(reviewState), { waitUntil: 'networkidle' })
    await waitForPhase(page, expectedPhase)
    await page.waitForFunction(() => Array.from(document.querySelectorAll('#contents img')).every((image) => image.complete))
    const metrics = await inspectPage(page)
    if (screenshotStates.has(reviewState)) {
      await page.locator('.archive-selection-frame').screenshot({ path: path.join(screenshotDir, screenshotName(reviewState)) })
    }
    if (reviewState === 'end') {
      await page.locator('.archive-selection-frame').screenshot({ path: path.join(screenshotDir, 'contents-v6-46-route-tangent-audit-1920.png') })
    }
    stateValidation.push({
      reviewState,
      expectedPhase,
      httpStatus: response?.status() || null,
      ...metrics,
      ...diagnostics,
      pass: response?.ok() && metrics.visual === 'v6master' && metrics.phase === expectedPhase && metrics.chapterLinks === 9 && metrics.uniqueChapters === 9 && metrics.plateLoaded && metrics.cleanPlateActive && !metrics.oldMasterRendered && !metrics.systemHeadPresent && metrics.terminal09InsideViewport && metrics.routePathCount === 9 && metrics.routeEndpointMaxError <= 2 && metrics.tangentMismatchMax <= 18 && !metrics.marker05WindowOverlap && metrics.horizontalOverflow === 0 && diagnostics.consoleErrors.length === 0 && diagnostics.failedRequests.length === 0,
    })
    await page.close()
  }
  await desktopContext.close()

  const context1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  {
    const page = await context1440.newPage()
    const diagnostics = attachDiagnostics(page)
    await page.goto(url('end'), { waitUntil: 'networkidle' })
    await waitForPhase(page, 'complete')
    desktop1440 = { ...(await inspectPage(page)), ...diagnostics }
    await page.locator('.archive-selection-frame').screenshot({ path: path.join(screenshotDir, screenshotName('end', 1440)) })
    desktop1440.pass = desktop1440.visual === 'v6master' && desktop1440.plateLoaded && desktop1440.cleanPlateActive && !desktop1440.oldMasterRendered && desktop1440.chapterLinks === 9 && !desktop1440.systemHeadPresent && desktop1440.terminal09InsideViewport && desktop1440.routePathCount === 9 && desktop1440.routeEndpointMaxError <= 2 && desktop1440.tangentMismatchMax <= 18 && !desktop1440.marker05WindowOverlap && desktop1440.horizontalOverflow === 0 && desktop1440.consoleErrors.length === 0 && desktop1440.failedRequests.length === 0
    await page.close()
  }
  await context1440.close()

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  {
    const page = await mobileContext.newPage()
    const diagnostics = attachDiagnostics(page)
    await page.goto(url('end'), { waitUntil: 'networkidle' })
    await waitForPhase(page, 'complete')
    mobile390 = await page.evaluate(() => {
      const desktopCore = document.querySelector('.archive-selection-core')
      return {
        visual: document.querySelector('#contents')?.dataset.contentsVisual || 'production-mobile',
        masterPlatePresent: Boolean(document.querySelector('.v6-master-plate')),
        chapterLinks: document.querySelectorAll('#contents a.archive-route-node').length,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        desktopCoreDisplay: desktopCore ? getComputedStyle(desktopCore).display : 'none',
      }
    })
    Object.assign(mobile390, diagnostics)
    await page.screenshot({ path: path.join(screenshotDir, 'contents-v6-46-mobile-390.png'), fullPage: false })
    mobile390.pass = mobile390.visual === 'v6master-mobile' && !mobile390.masterPlatePresent && mobile390.chapterLinks === 9 && mobile390.horizontalOverflow === 0 && mobile390.consoleErrors.length === 0 && mobile390.failedRequests.length === 0
    await page.close()
  }
  await mobileContext.close()

  const reducedContext = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' })
  {
    const page = await reducedContext.newPage()
    const diagnostics = attachDiagnostics(page)
    await page.goto(`${baseUrl}/?contentsVisual=v6master#contents`, { waitUntil: 'networkidle' })
    await waitForPhase(page, 'complete')
    reducedMotion = await page.evaluate(() => ({
      visual: document.querySelector('#contents')?.dataset.contentsVisual,
      phase: document.querySelector('#contents')?.dataset.archivePhase,
      links: document.querySelectorAll('#contents a.archive-route-node').length,
      plateAnimation: getComputedStyle(document.querySelector('.v6-master-plate')).animationName,
      markerAnimations: Array.from(document.querySelectorAll('.v6-master-marker'), (node) => getComputedStyle(node).animationName),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))
    Object.assign(reducedMotion, diagnostics)
    reducedMotion.pass = reducedMotion.phase === 'complete' && reducedMotion.links === 9 && reducedMotion.plateAnimation === 'none' && reducedMotion.markerAnimations.every((value) => value === 'none') && reducedMotion.horizontalOverflow === 0 && reducedMotion.consoleErrors.length === 0 && reducedMotion.failedRequests.length === 0
    await page.close()
  }
  await reducedContext.close()

  await rm(videoTemp, { recursive: true, force: true })
  await mkdir(videoTemp, { recursive: true })
  const normalContext = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: videoTemp, size: { width: 1920, height: 1080 } } })
  {
    const page = await normalContext.newPage()
    const diagnostics = attachDiagnostics(page)
    const startedAt = Date.now()
    await page.goto(`${baseUrl}/?contentsVisual=v6master&contentsCapture=1&archiveMotion=replay#contents`, { waitUntil: 'domcontentloaded' })
    await waitForPhase(page, 'complete')
    normalMotionDurationMs = Date.now() - startedAt
    await page.waitForTimeout(1400)
    const phase = await page.locator('#contents').getAttribute('data-archive-phase')
    if (phase !== 'complete' || diagnostics.consoleErrors.length || diagnostics.failedRequests.length) throw new Error('Normal V6.46 recording validation failed')
    const video = page.video()
    await page.close()
    const temporaryPath = await video.path()
    await normalContext.close()
    await rm(normalRecording, { force: true })
    await rename(temporaryPath, normalRecording)
  }

  await rm(videoTemp, { recursive: true, force: true })
  await mkdir(videoTemp, { recursive: true })
  const interactionContext = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: videoTemp, size: { width: 1920, height: 1080 } } })
  {
    const page = await interactionContext.newPage()
    const diagnostics = attachDiagnostics(page)
    await page.goto(url('end'), { waitUntil: 'networkidle' })
    await waitForPhase(page, 'complete')
    const geometry = async (chapter) => page.evaluate((number) => {
      const node = document.querySelector(`.v6-master-node[data-chapter="${number}"]`)
      const pick = (selector) => {
        const element = node?.querySelector(selector)
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      }
      return { marker: pick('.v6-master-marker'), window: pick('.v6-master-window'), label: pick('.v6-master-label, .v6-master-terminal') }
    }, chapter)
    const stable = (before, after) => JSON.stringify(before) === JSON.stringify(after)

    const before03 = await geometry('03')
    await page.locator('.v6-master-node[data-chapter="03"] .v6-master-marker').hover()
    await page.waitForTimeout(900)
    const hover03 = await page.evaluate(() => ({ active: document.querySelector('#contents')?.dataset.archiveActive, activeRoutes: document.querySelectorAll('.archive-selection-link.is-route-active').length }))
    const after03 = await geometry('03')

    const before07 = await geometry('07')
    await page.locator('.v6-master-node[data-chapter="07"] .v6-master-marker').hover()
    await page.waitForTimeout(900)
    const hover07 = await page.evaluate(() => ({ active: document.querySelector('#contents')?.dataset.archiveActive, activeRoutes: document.querySelectorAll('.archive-selection-link.is-route-active').length }))
    const after07 = await geometry('07')

    const node08 = page.locator('.v6-master-node[data-chapter="08"]')
    await page.mouse.move(12, 12)
    await page.waitForTimeout(120)
    await page.keyboard.press('Tab')
    await node08.focus()
    await page.waitForTimeout(900)
    const focus08 = await page.evaluate(() => ({ active: document.querySelector('#contents')?.dataset.archiveActive, focused: document.activeElement?.dataset.chapter, focusVisible: document.activeElement?.matches(':focus-visible') }))
    const before09 = await geometry('09')
    const node09 = page.locator('.v6-master-node[data-chapter="09"]')
    await node09.focus()
    await page.waitForTimeout(900)
    const focus09 = await page.evaluate(() => ({ active: document.querySelector('#contents')?.dataset.archiveActive, focused: document.activeElement?.dataset.chapter, focusVisible: document.activeElement?.matches(':focus-visible') }))
    const after09 = await geometry('09')
    await page.waitForTimeout(500)

    interactionValidation = {
      hover03,
      hover07,
      focus08,
      focus09,
      chapter03GeometryStable: stable(before03, after03),
      chapter07GeometryStable: stable(before07, after07),
      chapter09GeometryStable: stable(before09, after09),
      consoleErrors: diagnostics.consoleErrors,
      failedRequests: diagnostics.failedRequests,
    }
    interactionValidation.pass = hover03.active === '03' && hover03.activeRoutes === 1 && hover07.active === '07' && hover07.activeRoutes === 1 && focus08.active === '08' && focus08.focused === '08' && focus08.focusVisible && focus09.active === '09' && focus09.focused === '09' && focus09.focusVisible && interactionValidation.chapter03GeometryStable && interactionValidation.chapter07GeometryStable && interactionValidation.chapter09GeometryStable && diagnostics.consoleErrors.length === 0 && diagnostics.failedRequests.length === 0
    const video = page.video()
    await page.close()
    const temporaryPath = await video.path()
    await interactionContext.close()
    await rm(interactionRecording, { force: true })
    await rename(temporaryPath, interactionRecording)
  }
  await rm(videoTemp, { recursive: true, force: true })
} finally {
  await browser.close()
}

const implementationEnd = path.join(screenshotDir, screenshotName('end'))
const comparisonPath = path.join(screenshotDir, 'v6-46-route-junctions-before-vs-after.png')
const comparisonWidth = 1920
const comparisonHeight = 1510
const comparisonRows = [
  { label: 'NODE 03 / TANGENT', left: 300, top: 560, width: 520, height: 260 },
  { label: 'NODE 06 / TANGENT', left: 880, top: 480, width: 520, height: 280 },
  { label: 'NODE 08 / TANGENT', left: 1280, top: 540, width: 520, height: 280 },
  { label: 'NODE 05 / WINDOW', left: 760, top: 620, width: 520, height: 260 },
]
const comparisonComposites = []
for (const [index, row] of comparisonRows.entries()) {
  const [beforeBuffer, afterBuffer] = await Promise.all([
    sharp(v645ImplementationPath).extract({ left: row.left, top: row.top, width: row.width, height: row.height }).resize(850, 300, { fit: 'cover' }).png().toBuffer(),
    sharp(implementationEnd).extract({ left: row.left, top: row.top, width: row.width, height: row.height }).resize(850, 300, { fit: 'cover' }).png().toBuffer(),
  ])
  const top = 145 + index * 340
  comparisonComposites.push({ input: beforeBuffer, left: 40, top }, { input: afterBuffer, left: 1030, top })
}
const rowLabels = comparisonRows.map((row, index) => `<text x="40" y="${132 + index * 340}" fill="#607384" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="2">${row.label}</text>`).join('')
const labelSvg = Buffer.from(`<svg width="${comparisonWidth}" height="${comparisonHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f4f7fa"/>
  <text x="40" y="44" fill="#617383" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="3">V6.46 / ROUTE TANGENT + COLLISION MICROFIX</text>
  <text x="40" y="91" fill="#4f88e8" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2">V6.45 BEFORE</text>
  <text x="1030" y="91" fill="#4f88e8" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2">V6.46 AFTER</text>
  <line x1="40" y1="104" x2="890" y2="104" stroke="#a6b2bd"/><line x1="1030" y1="104" x2="1880" y2="104" stroke="#a6b2bd"/>
  ${rowLabels}
  <text x="1880" y="1490" fill="#8594a1" font-family="Arial, sans-serif" font-size="10" text-anchor="end" letter-spacing="2">EQUAL-SCALE JUNCTION CROPS / NO DEBUG HANDLES</text>
</svg>`)
await sharp(labelSvg).composite(comparisonComposites).png().toFile(comparisonPath)

const output = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  normalMotionDurationMs,
  fixedStates: stateValidation,
  desktop1440,
  mobile390,
  reducedMotion,
  interactionValidation,
  screenshots: [...screenshotStates].map((state) => `review/screenshots/${screenshotName(state)}`).concat([
    'review/screenshots/contents-v6-46-end-1440.png',
    'review/screenshots/contents-v6-46-mobile-390.png',
    'review/screenshots/contents-v6-46-route-tangent-audit-1920.png',
    'review/screenshots/v6-46-route-junctions-before-vs-after.png',
  ]),
  recordings: [
    'review/motion-capture/v6-46-route-tangent-motion-1920.webm',
    'review/motion-capture/v6-46-route-tangent-interaction-1920.webm',
  ],
}
output.pass = stateValidation.every((state) => state.pass) && desktop1440.pass && mobile390.pass && reducedMotion.pass && interactionValidation.pass
await writeFile(path.join(reportDir, 'v6-46-route-tangent-validation.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(JSON.stringify(output, null, 2))
if (!output.pass) process.exitCode = 1
