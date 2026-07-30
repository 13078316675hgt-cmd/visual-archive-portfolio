import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'
import sharp from 'sharp'

const root = process.cwd()
const outputRoot = path.join(root, 'output', 'pdf')
const pdfDir = path.join(outputRoot, 'PDF')
const masterCaptureDir = path.join(outputRoot, 'captures', 'master')
const deliveryCaptureDir = path.join(outputRoot, 'captures', 'delivery')
const previewDir = path.join(outputRoot, 'website-page-previews')
const validationDir = path.join(outputRoot, 'validation')
const previewPort = 4195
const previewUrl = `http://127.0.0.1:${previewPort}/portfolio-pdf/`
const pageNames = [
  '01-home',
  '02-directory',
  '03-page-01',
  '04-page-02',
  '05-page-03',
  '06-page-04',
  '07-page-05',
  '08-page-06-portrait',
  '09-page-06-presentation',
  '10-page-07',
  '11-full-resume-details',
  '12-resume-contact',
]

const masterPdf = path.join(pdfDir, '黄国泰_角色概念设计作品集_MASTER_v2.pdf')
const deliveryPdf = path.join(pdfDir, '黄国泰_角色概念设计作品集_投递版_v2.pdf')

await rm(outputRoot, { recursive: true, force: true })
await Promise.all([
  mkdir(pdfDir, { recursive: true }),
  mkdir(masterCaptureDir, { recursive: true }),
  mkdir(deliveryCaptureDir, { recursive: true }),
  mkdir(previewDir, { recursive: true }),
  mkdir(validationDir, { recursive: true }),
])

const viteEntry = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const previewProcess = spawn(
  process.execPath,
  [viteEntry, 'preview', '--host', '127.0.0.1', '--port', String(previewPort)],
  {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  },
)

let previewLog = ''
previewProcess.stdout.on('data', (chunk) => { previewLog += chunk.toString() })
previewProcess.stderr.on('data', (chunk) => { previewLog += chunk.toString() })

async function waitForPreview() {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(previewUrl)
      if (response.ok) return
    } catch {
      // Retry until Vite is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${previewUrl}\n${previewLog}`)
}

function attachDiagnostics(page, result) {
  page.on('console', (message) => {
    if (message.type() === 'error') result.consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => result.pageErrors.push(error.message))
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
      result.failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText || 'unknown',
      })
    }
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      result.badResponses.push({ status: response.status(), url: response.url() })
    }
  })
}

async function normalizeImageSources(page, variant) {
  await page.evaluate(async (requestedVariant) => {
    const images = Array.from(document.querySelectorAll('.portfolio-pdf-root img'))
    for (const image of images) {
      image.loading = 'eager'
      if (image.dataset.approvedSrc) {
        image.src = new URL(image.dataset.approvedSrc, document.baseURI).href
      }
      const source = image.getAttribute('src')
      const srcSet = image.getAttribute('srcset')
      if (requestedVariant === 'master' && srcSet) {
        const candidates = srcSet
          .split(',')
          .map((entry) => entry.trim().split(/\s+/))
          .map(([url, descriptor = '0w']) => ({
            url,
            width: Number.parseFloat(descriptor) || 0,
          }))
          .sort((a, b) => b.width - a.width)
        if (candidates[0]?.url) {
          image.removeAttribute('srcset')
          image.removeAttribute('sizes')
          image.src = new URL(candidates[0].url, document.baseURI).href
        }
      } else if (requestedVariant === 'delivery' && srcSet) {
        image.removeAttribute('srcset')
        image.removeAttribute('sizes')
        if (source) image.src = source
      }
      if (typeof image.decode === 'function') await image.decode().catch(() => {})
    }
  }, variant)
}

async function waitForAssets(page) {
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('.portfolio-pdf-root img'))
      .every((image) => image.complete),
    undefined,
    { timeout: 60_000 },
  )
  const failedImages = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.portfolio-pdf-root img'))
      .filter((image) => image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
  )
  if (failedImages.length) {
    throw new Error(`Images failed before PDF export: ${failedImages.join(', ')}`)
  }
  await page.evaluate(() => document.fonts.ready)
}

async function inspectSection(section) {
  const box = await section.boundingBox()
  const metrics = await section.evaluate((node) => {
    const sectionRect = node.getBoundingClientRect()
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
    const textLayer = []
    let textNode = walker.nextNode()
    while (textNode) {
      const text = textNode.textContent?.replace(/\s+/g, ' ').trim()
      const parent = textNode.parentElement
      if (text && parent) {
        const style = getComputedStyle(parent)
        const range = document.createRange()
        range.selectNodeContents(textNode)
        const rect = range.getBoundingClientRect()
        const visible = (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number.parseFloat(style.opacity || '1') > 0 &&
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > sectionRect.top &&
          rect.top < sectionRect.bottom
        )
        if (visible) {
          textLayer.push({
            text,
            x: rect.left - sectionRect.left,
            y: rect.top - sectionRect.top,
            width: rect.width,
            height: rect.height,
            fontSize: Number.parseFloat(style.fontSize) || 12,
          })
        }
      }
      textNode = walker.nextNode()
    }
    return {
      id: node.id,
      width: sectionRect.width,
      height: sectionRect.height,
      scrollWidth: node.scrollWidth,
      scrollHeight: node.scrollHeight,
      innerText: node.innerText,
      textLayer,
    }
  })
  return { box, ...metrics }
}

async function preparePage(browser, variant) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' })
  const result = {
    variant,
    exportMethod: variant === 'master'
      ? 'Chromium direct DOM/CSS PDF print'
      : 'Chromium direct DOM/CSS PDF print with controlled source resolution',
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
    sections: [],
    assets: [],
  }
  attachDiagnostics(page, result)

  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await normalizeImageSources(page, variant)
  await waitForAssets(page)
  await page.evaluate(() => {
    document.documentElement.classList.add('portfolio-pdf-capture')
    document.querySelectorAll('.portfolio-pdf-root a').forEach((link) => {
      link.removeAttribute('href')
      link.setAttribute('tabindex', '-1')
    })
    window.scrollTo(0, 0)
  })

  const sections = page.locator('.portfolio-pdf-root > section')
  const count = await sections.count()
  if (count !== pageNames.length) {
    throw new Error(`Expected ${pageNames.length} sections, found ${count}`)
  }

  for (let index = 0; index < count; index += 1) {
    const section = sections.nth(index)
    console.log(`[portfolio-pdf] ${variant}: ${pageNames[index]}`)
    await section.scrollIntoViewIfNeeded()
    await page.waitForTimeout(80)
    result.sections.push({
      name: pageNames[index],
      ...(await inspectSection(section)),
    })

    const captureDir = variant === 'master' ? masterCaptureDir : deliveryCaptureDir
    const pngPath = path.join(captureDir, `${pageNames[index]}.png`)
    await section.screenshot({ path: pngPath, animations: 'disabled' })
    if (variant === 'delivery') {
      await sharp(pngPath).toFile(path.join(previewDir, `${pageNames[index]}.png`))
    }
  }

  result.assets = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.portfolio-pdf-root img')).map((image) => ({
      alt: image.alt,
      src: image.getAttribute('src'),
      currentSrc: image.currentSrc,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      complete: image.complete,
      filter: getComputedStyle(image).filter,
      mixBlendMode: getComputedStyle(image).mixBlendMode,
    })),
  )

  const page01 = result.assets.find((asset) =>
    asset.currentSrc.includes('page01-original-art-crop-1515x1780.png'),
  )
  result.page01Integrity = {
    found: Boolean(page01),
    currentSrc: page01?.currentSrc,
    naturalWidth: page01?.naturalWidth,
    naturalHeight: page01?.naturalHeight,
    filter: page01?.filter,
    mixBlendMode: page01?.mixBlendMode,
    canvasCount: await page.locator('#key-visual-01 canvas').count(),
  }

  result.documentMetrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    bodyWidth: document.body.scrollWidth,
    bodyHeight: document.body.scrollHeight,
    title: document.title,
    pdfMode: document.documentElement.classList.contains('portfolio-pdf-mode'),
    motionReduced: document.documentElement.classList.contains('motion-reduced'),
  }))

  return { context, page, result }
}

async function printDirectPdf(page, destination) {
  await page.evaluate(() => {
    document.documentElement.classList.add('portfolio-pdf-direct')
    window.scrollTo(0, 0)
  })
  await page.pdf({
    path: destination,
    width: '13.333in',
    height: '7.5in',
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: false,
    tagged: true,
    outline: true,
    scale: 2 / 3,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })
}

let browser
try {
  await waitForPreview()
  browser = await chromium.launch({ headless: true })

  const preparedMaster = await preparePage(browser, 'master')
  await printDirectPdf(preparedMaster.page, masterPdf)
  await preparedMaster.context.close()
  const masterResult = preparedMaster.result

  const preparedDelivery = await preparePage(browser, 'delivery')
  const deliveryResult = preparedDelivery.result
  await printDirectPdf(preparedDelivery.page, deliveryPdf)
  await preparedDelivery.context.close()

  const textLayerPath = path.join(validationDir, 'page-text-layer.json')
  await writeFile(
    textLayerPath,
    `${JSON.stringify({
      source: 'DOM inspection only; no overlay text layer is added to either PDF',
      master: masterResult.sections,
      delivery: deliveryResult.sections,
    }, null, 2)}\n`,
  )

  const outputs = {}
  for (const [name, filename] of [['master', masterPdf], ['delivery', deliveryPdf]]) {
    const buffer = await readFile(filename)
    outputs[name] = {
      path: path.relative(root, filename).replaceAll('\\', '/'),
      bytes: (await stat(filename)).size,
      sha256: createHash('sha256').update(buffer).digest('hex').toUpperCase(),
    }
  }

  const resultPass = (result) => (
    result.consoleErrors.length === 0 &&
    result.pageErrors.length === 0 &&
    result.failedRequests.length === 0 &&
    result.badResponses.length === 0 &&
    result.sections.length === pageNames.length &&
    result.sections.every((section) => section.width === 1920 && section.height === 1080) &&
    result.page01Integrity.found &&
    result.page01Integrity.filter === 'none' &&
    result.page01Integrity.mixBlendMode === 'normal' &&
    result.page01Integrity.canvasCount === 0
  )
  const validation = {
    pass: resultPass(masterResult) && resultPass(deliveryResult),
    previewUrl,
    pageCount: pageNames.length,
    master: masterResult,
    delivery: deliveryResult,
    outputs,
  }
  await writeFile(
    path.join(validationDir, 'export-validation.json'),
    `${JSON.stringify(validation, null, 2)}\n`,
  )
  if (!validation.pass) throw new Error('Portfolio PDF export validation failed')
  console.log(JSON.stringify({ pass: true, outputs }, null, 2))
} finally {
  if (browser) await browser.close()
  previewProcess.kill()
}
