import { createWriteStream } from 'node:fs'
import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import archiver from 'archiver'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { auditPortfolioAssets } from './audit-portfolio-assets.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const host = '127.0.0.1'
const port = 4173
const baseUrl = 'http://' + host + ':' + port
const reviewRoot = path.join(root, 'review', 'd10-current-package')
const screenshotsRoot = path.join(reviewRoot, 'screenshots')
const reportsRoot = path.join(reviewRoot, 'reports')
const stagingRoot = path.join(reviewRoot, 'staging')
const packageName = 'portfolio_website_review_package'
const stagedPackageRoot = path.join(stagingRoot, packageName)
const zipPath = path.join(root, 'review', packageName + '.zip')

const desktopTargets = [
  ['01-home.png', '/', '#title'],
  ['02-directory.png', '#contents', '#contents'],
  ['03-page-01.png', '#key-visual-01', '#key-visual-01'],
  ['04-page-02.png', '#key-visual-02', '#key-visual-02'],
  ['05-page-03.png', '#key-visual-03', '#key-visual-03'],
  ['06-costume-detail.png', '#costume-detail', '#costume-detail'],
  ['07-character-sheets.png', '#character-sheets', '#character-sheets'],
  ['08-page-06-portrait-studies.png', '#portrait-studies', '#portrait-studies'],
  ['09-selected-works.png', '#selected-works', '#selected-works'],
  ['10-page-07-additional-designs.png', '#additional-designs', '#additional-designs'],
  ['11-professional-profile.png', '#professional-profile', '#professional-profile'],
  ['12-about-the-creator.png', '#about-the-creator', '#about-the-creator'],
]

const mobileTargets = [
  ['mobile-01-home.png', '/', '#title'],
  ['mobile-02-directory.png', '#contents', '#contents'],
  ['mobile-03-page-01.png', '#key-visual-01', '#key-visual-01'],
  ['mobile-04-page-02.png', '#key-visual-02', '#key-visual-02'],
  ['mobile-05-professional-profile.png', '#professional-profile', '#professional-profile'],
  ['mobile-06-about-the-creator.png', '#about-the-creator', '#about-the-creator'],
]

async function exists(target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

async function writeJson(target, value) {
  await writeFile(target, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

async function prepareGeneratedPaths() {
  await rm(reviewRoot, { recursive: true, force: true })
  await rm(zipPath, { force: true })
  await Promise.all([
    mkdir(screenshotsRoot, { recursive: true }),
    mkdir(reportsRoot, { recursive: true }),
    mkdir(stagingRoot, { recursive: true }),
  ])
}

async function startReviewServer() {
  const server = await createServer({
    root,
    logLevel: 'warn',
    server: { host, port, strictPort: true },
  })
  await server.listen()
  return server
}

async function stopReviewServer(server) {
  if (server) await server.close()
}

async function runNavigationValidation() {
  const script = path.join(root, 'scripts', 'test-anchor-navigation.mjs')
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: root,
      env: { ...process.env, REVIEW_BASE_URL: baseUrl },
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('close', resolve)
  })
  if (exitCode !== 0) throw new Error('Navigation validation exited with code ' + exitCode + '.')

  const source = path.join(root, 'review', 'd10-01', 'navigation-validation.json')
  if (!await exists(source)) throw new Error('Navigation result is missing: ' + source)
  const result = JSON.parse(await readFile(source, 'utf8'))
  const tests = Array.isArray(result.tests) ? result.tests : []
  if (result.pass !== true || !Array.isArray(result.tests) || tests.some((test) => test.pass !== true)) {
    throw new Error('Navigation result did not contain a complete passing test set.')
  }

  await cp(source, path.join(reportsRoot, 'navigation-validation.json'))
  await writeFile(
    path.join(reportsRoot, 'navigation-summary.md'),
    '# Navigation validation\n\n- Pass: yes\n- Tests: ' + tests.length + '\n- Failed tests: 0\n- Base URL: ' + baseUrl + '\n',
    'utf8',
  )
  return { pass: true, testCount: tests.length }
}

function attachBrowserFailureCollection(page, failures, label) {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      failures.push({ type: 'console', capture: label, message: message.text() })
    }
  })
  page.on('pageerror', (error) => {
    failures.push({ type: 'page', capture: label, message: error.message })
  })
  page.on('requestfailed', (request) => {
    failures.push({
      type: 'request',
      capture: label,
      method: request.method(),
      url: request.url(),
      message: request.failure()?.errorText || 'request failed',
    })
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failures.push({
        type: 'resource',
        capture: label,
        status: response.status(),
        url: response.url(),
      })
    }
  })
}

async function waitForCurrentSection(page, selector) {
  const sectionId = selector.slice(1)
  await page.evaluate((id) => window.__portfolioEnsureSection?.(id), sectionId)
  await page.waitForFunction(
    (id) => {
      const section = document.getElementById(id)
      return section && !section.classList.contains('performance-section-placeholder')
    },
    sectionId,
    { timeout: 45_000 },
  )
  await page.locator(selector).scrollIntoViewIfNeeded()
}

async function waitForVisibleImages(page, selector) {
  return page.locator(selector + ' img').evaluateAll(async (images) => {
    const visible = images.filter((image) => {
      const rect = image.getBoundingClientRect()
      const style = getComputedStyle(image)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    })
    const timeout = (message) => new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), 30_000)
    })
    await Promise.all(visible.map(async (image) => {
      if (!image.complete) {
        await Promise.race([
          new Promise((resolve, reject) => {
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', () => reject(new Error('Image failed: ' + (image.currentSrc || image.src))), { once: true })
          }),
          timeout('Image timed out: ' + (image.currentSrc || image.src)),
        ])
      }
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('Image is blank: ' + (image.currentSrc || image.src))
      await Promise.race([image.decode(), timeout('Image decode timed out: ' + (image.currentSrc || image.src))])
    }))
    return visible.length
  })
}

async function inspectSection(page, selector) {
  return page.locator(selector).evaluate((section) => {
    const rect = section.getBoundingClientRect()
    const text = section.textContent?.trim() || ''
    const visual = section.querySelector('img, picture, svg, canvas, video, figure')
    return {
      width: rect.width,
      height: rect.height,
      textLength: text.length,
      hasVisualContent: Boolean(visual),
      placeholder: section.classList.contains('performance-section-placeholder'),
    }
  })
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('Screenshot is not a valid PNG.')
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

async function captureOne(context, target, viewportKind, failures) {
  const [filename, route, section] = target
  const page = await context.newPage()
  attachBrowserFailureCollection(page, failures, filename)
  const output = path.join(screenshotsRoot, filename)
  const url = new URL(route, baseUrl + '/').href

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
    await waitForCurrentSection(page, section)
    const visibleImages = await waitForVisibleImages(page, section)
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready
    })
    const sectionState = await inspectSection(page, section)
    if (
      sectionState.placeholder
      || sectionState.width <= 0
      || sectionState.height <= 0
      || (!sectionState.textLength && !sectionState.hasVisualContent)
    ) {
      throw new Error('Section is missing, hidden, or blank: ' + section)
    }
    await page.screenshot({ path: output, animations: 'disabled' })
    const dimensions = pngDimensions(await readFile(output))
    return {
      pass: true,
      filename,
      viewport: viewportKind,
      route,
      sectionId: section.slice(1),
      width: dimensions.width,
      height: dimensions.height,
      visibleImages,
      section: sectionState,
    }
  } catch (error) {
    failures.push({ type: 'capture', capture: filename, message: error.message })
    return {
      pass: false,
      filename,
      viewport: viewportKind,
      route,
      sectionId: section.slice(1),
      message: error.message,
    }
  } finally {
    await page.close()
  }
}

async function captureCanonicalScreenshots() {
  const browser = await chromium.launch({ headless: true })
  const failures = []
  const captures = []
  try {
    const desktop = await browser.newContext({
      viewport: { width: 1672, height: 941 },
      deviceScaleFactor: 1,
    })
    for (const target of desktopTargets) {
      captures.push(await captureOne(desktop, target, 'desktop', failures))
    }
    await desktop.close()

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    for (const target of mobileTargets) {
      captures.push(await captureOne(mobile, target, 'mobile', failures))
    }
    await mobile.close()
  } finally {
    await browser.close()
  }

  const result = {
    pass: failures.length === 0 && captures.every((capture) => capture.pass),
    baseUrl,
    desktopViewport: { width: 1672, height: 941, deviceScaleFactor: 1 },
    mobileViewport: { width: 390, height: 844, deviceScaleFactor: 1, reducedMotion: 'reduce' },
    desktopScreenshotCount: captures.filter((capture) => capture.viewport === 'desktop' && capture.pass).length,
    mobileScreenshotCount: captures.filter((capture) => capture.viewport === 'mobile' && capture.pass).length,
    browserErrorCount: failures.length,
    failures,
    captures,
  }
  await writeJson(path.join(reportsRoot, 'browser-validation.json'), result)
  const captureRows = captures.map((capture) => (
    '| ' + capture.filename + ' | ' + capture.route + ' | ' + capture.sectionId + ' | '
    + (capture.width || 0) + '×' + (capture.height || 0) + ' | ' + (capture.pass ? 'pass' : 'fail') + ' |'
  ))
  const failureLines = failures.length
    ? failures.map((failure) => '- ' + failure.type + ' / ' + failure.capture + ': ' + (failure.message || failure.url))
    : ['- None']
  await writeFile(
    path.join(reportsRoot, 'browser-validation.md'),
    [
      '# Browser validation',
      '',
      '- Pass: ' + (result.pass ? 'yes' : 'no'),
      '- Desktop screenshots: ' + result.desktopScreenshotCount,
      '- Mobile screenshots: ' + result.mobileScreenshotCount,
      '- Browser errors: ' + result.browserErrorCount,
      '',
      '| Screenshot | Route | Section ID | Dimensions | Result |',
      '| --- | --- | --- | --- | --- |',
      ...captureRows,
      '',
      '## Browser failures',
      '',
      ...failureLines,
      '',
    ].join('\n'),
    'utf8',
  )
  return result
}

async function copyCurrentAllowlist() {
  const fixed = [
    'src',
    'public',
    'scripts',
    '.github',
    '.gitignore',
    'package.json',
    'pnpm-lock.yaml',
    'index.html',
    'README.md',
    'PORTFOLIO_MAINTENANCE.md',
    'DEPLOYMENT.md',
    'DEPLOY_GITHUB_PAGES.md',
  ]
  const rootFiles = await readdir(root)
  const configs = rootFiles.filter((name) => /^(?:vite|playwright)\.config\.[^.]+$/i.test(name))
  for (const relative of [...fixed, ...configs]) {
    const source = path.join(root, relative)
    if (await exists(source)) await cp(source, path.join(stagedPackageRoot, relative), { recursive: true })
  }
}

async function stageCurrentReviewPackage() {
  await mkdir(stagedPackageRoot, { recursive: true })
  await copyCurrentAllowlist()
  await cp(screenshotsRoot, path.join(stagedPackageRoot, 'screenshots'), { recursive: true })
  await cp(reportsRoot, path.join(stagedPackageRoot, 'review-results'), { recursive: true })
  await writeFile(
    path.join(stagedPackageRoot, 'PROJECT_INFO.md'),
    [
      '# Portfolio website review package',
      '',
      '- Install: pnpm install --frozen-lockfile',
      '- Build: pnpm run build',
      '- GitHub Pages fallback build: pnpm run build:pages',
      '- Navigation check: pnpm run review:navigation',
      '- Package review: pnpm run review:package',
      '- Current production domain: https://www.marlsa.cc.cd/',
      '',
    ].join('\n'),
    'utf8',
  )
}

async function createReviewZip() {
  await mkdir(path.dirname(zipPath), { recursive: true })
  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.once('close', resolve)
    output.once('error', reject)
    archive.once('error', reject)
    archive.pipe(output)
    archive.directory(stagedPackageRoot, packageName)
    archive.finalize().catch(reject)
  })
}

async function listZipEntries(target) {
  const buffer = await readFile(target)
  let end = -1
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65_557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      end = offset
      break
    }
  }
  if (end < 0) throw new Error('ZIP end record is missing.')
  const entryCount = buffer.readUInt16LE(end + 10)
  let offset = buffer.readUInt32LE(end + 16)
  const entries = []
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('ZIP directory is invalid.')
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    entries.push(buffer.toString('utf8', offset + 46, offset + 46 + nameLength))
    offset += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

async function verifyReviewZip() {
  if (!await exists(zipPath)) throw new Error('Review ZIP was not created.')
  const zipStat = await stat(zipPath)
  if (!zipStat.isFile() || zipStat.size <= 0) throw new Error('Review ZIP is empty.')
  const entries = await listZipEntries(zipPath)
  const rootPrefix = packageName + '/'
  if (!entries.length || entries.some((entry) => !entry.startsWith(rootPrefix))) {
    throw new Error('Review ZIP has an invalid package root.')
  }
  for (const required of ['src/', 'public/', 'scripts/', '.github/', 'screenshots/', 'review-results/']) {
    if (!entries.some((entry) => entry.startsWith(rootPrefix + required))) {
      throw new Error('Review ZIP is missing ' + required)
    }
  }
  for (const required of [...desktopTargets, ...mobileTargets].map(([filename]) => filename)) {
    if (!entries.includes(rootPrefix + 'screenshots/' + required)) throw new Error('Review ZIP is missing ' + required)
  }
  for (const required of [
    'asset-audit-summary.json',
    'navigation-validation.json',
    'navigation-summary.md',
    'browser-validation.json',
    'browser-validation.md',
    'review-summary.json',
    'review-summary.md',
  ]) {
    if (!entries.includes(rootPrefix + 'review-results/' + required)) throw new Error('Review ZIP is missing ' + required)
  }
  const excluded = entries.filter((entry) => (
    /\/(?:\.git|node_modules|dist)(?:\/|$)/.test(entry)
    || /(?:^|\/)\.env(?:\.|$)/.test(entry)
    || /\/v[45][^/]*-delivery(?:\/|\.zip$)/i.test(entry)
  ))
  if (excluded.length) throw new Error('Review ZIP contains excluded entries: ' + excluded.join(', '))
  return { entries, size: zipStat.size }
}

async function main() {
  await prepareGeneratedPaths()
  const assetAudit = { pass: true, ...await auditPortfolioAssets() }
  await writeJson(path.join(reportsRoot, 'asset-audit-summary.json'), assetAudit)

  let navigation
  let browserValidation
  let server
  try {
    server = await startReviewServer()
    browserValidation = await captureCanonicalScreenshots()
    navigation = await runNavigationValidation()
  } finally {
    await stopReviewServer(server)
  }
  if (!browserValidation.pass) throw new Error('Browser validation did not pass.')

  const reviewSummary = {
    pass: true,
    assetAuditPass: assetAudit.pass,
    navigationPass: navigation.pass,
    navigationTestCount: navigation.testCount,
    desktopScreenshotCount: browserValidation.desktopScreenshotCount,
    mobileScreenshotCount: browserValidation.mobileScreenshotCount,
    browserErrorCount: browserValidation.browserErrorCount,
    zipPath,
  }
  await writeJson(path.join(reportsRoot, 'review-summary.json'), reviewSummary)
  await writeFile(
    path.join(reportsRoot, 'review-summary.md'),
    [
      '# Current D10 review summary',
      '',
      '- Pass: yes',
      '- Asset audit: ' + (assetAudit.pass ? 'pass' : 'fail'),
      '- Navigation: ' + (navigation.pass ? 'pass' : 'fail') + ' (' + navigation.testCount + ' tests)',
      '- Desktop screenshots: ' + browserValidation.desktopScreenshotCount,
      '- Mobile screenshots: ' + browserValidation.mobileScreenshotCount,
      '- Browser errors: ' + browserValidation.browserErrorCount,
      '- Review ZIP: ' + zipPath,
      '',
    ].join('\n'),
    'utf8',
  )

  await stageCurrentReviewPackage()
  await createReviewZip()
  const verifiedZip = await verifyReviewZip()
  console.log(JSON.stringify({
    pass: true,
    zipPath,
    zipSize: verifiedZip.size,
    assetAuditPass: assetAudit.pass,
    navigationPass: navigation.pass,
    navigationTestCount: navigation.testCount,
    desktopScreenshotCount: browserValidation.desktopScreenshotCount,
    mobileScreenshotCount: browserValidation.mobileScreenshotCount,
    browserErrorCount: browserValidation.browserErrorCount,
  }))
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
