import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'
import sharp from 'sharp'

const root = process.cwd()
const outputRoot = path.join(root, 'output', 'pdf')
const pdfDir = path.join(outputRoot, 'PDF')
const workRoot = path.join(outputRoot, 'final-work')
const optimizedRoot = path.join(root, 'dist', 'pdf-final-assets')
const validationDir = path.join(outputRoot, 'final-validation')
const previewPort = 4196
const previewUrl = `http://127.0.0.1:${previewPort}/portfolio-pdf/`
const python = process.env.PORTFOLIO_PYTHON || 'python'
const metadataScript = path.join(root, 'scripts', 'set-portfolio-pdf-metadata.py')
const standardOptimizerScript = path.join(root, 'scripts', 'optimize-portfolio-standard-pdf.py')
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
const variants = {
  master: {
    filename: '黄国泰_角色概念设计作品集_MASTER_FINAL.pdf',
    sourceMode: 'master',
    optimization: null,
  },
  high: {
    filename: '黄国泰_角色概念设计作品集_投递高清版_FINAL.pdf',
    sourceMode: 'delivery',
    optimization: 'high',
  },
  standard: {
    filename: '黄国泰_角色概念设计作品集_标准投递版_FINAL.pdf',
    sourceMode: 'delivery',
    optimization: 'standard',
  },
}

await rm(workRoot, { recursive: true, force: true })
await rm(optimizedRoot, { recursive: true, force: true })
await rm(validationDir, { recursive: true, force: true })
await Promise.all([
  mkdir(pdfDir, { recursive: true }),
  mkdir(workRoot, { recursive: true }),
  mkdir(optimizedRoot, { recursive: true }),
  mkdir(validationDir, { recursive: true }),
])
for (const variant of Object.values(variants)) {
  await rm(path.join(pdfDir, variant.filename), { force: true })
}

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
      // Wait for the local Vite preview.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
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

async function setImageSourceMode(page, mode) {
  await page.evaluate(async (requestedMode) => {
    const images = Array.from(document.querySelectorAll('.portfolio-pdf-root img'))
    for (const image of images) {
      image.loading = 'eager'
      if (image.dataset.approvedSrc) {
        image.src = new URL(image.dataset.approvedSrc, document.baseURI).href
      }
      const source = image.getAttribute('src')
      const srcSet = image.getAttribute('srcset')
      if (requestedMode === 'master' && srcSet) {
        const candidates = srcSet
          .split(',')
          .map((entry) => entry.trim().split(/\s+/))
          .map(([url, descriptor = '0w']) => ({
            url,
            width: Number.parseFloat(descriptor) || 0,
          }))
          .sort((a, b) => b.width - a.width)
        if (candidates[0]?.url) {
          image.src = new URL(candidates[0].url, document.baseURI).href
        }
      } else if (requestedMode === 'delivery' && source) {
        image.src = source
      }
      image.removeAttribute('srcset')
      image.removeAttribute('sizes')
      if (typeof image.decode === 'function') await image.decode().catch(() => {})
    }
  }, mode)
}

function qualityFor(filename, profile) {
  const critical = /character-sheet|character-design|page01|kv02|costume|presentation|end-page|directory-end/i
  if (profile === 'high') return critical.test(filename) ? 97 : 96
  return critical.test(filename) ? 92 : 89
}

async function createOptimizedAssets(page, profile) {
  const sources = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.portfolio-pdf-root img'))
      .map((image) => image.currentSrc || image.src)
      .filter(Boolean),
  )
  const uniqueSources = [...new Set(sources)]
  const replacements = {}
  const ledger = []
  const profileDir = path.join(optimizedRoot, profile)
  await mkdir(profileDir, { recursive: true })

  for (const source of uniqueSources) {
    const url = new URL(source)
    const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    if (/\.svg$/i.test(pathname)) continue
    const input = path.join(root, 'dist', pathname)
    let metadata
    try {
      metadata = await sharp(input).metadata()
    } catch {
      continue
    }
    const pixelStats = metadata.hasAlpha ? await sharp(input).stats() : null
    if (metadata.hasAlpha && !pixelStats?.isOpaque) {
      ledger.push({
        source,
        action: 'kept lossless because transparency is required',
        width: metadata.width,
        height: metadata.height,
      })
      continue
    }

    const digest = createHash('sha1').update(source).digest('hex').slice(0, 12)
    const outputName = `${path.basename(pathname, path.extname(pathname))}-${digest}.jpg`
    const output = path.join(profileDir, outputName)
    const quality = qualityFor(path.basename(pathname), profile)
    let pipeline = sharp(input, { failOn: 'none' })
      .flatten({ background: '#f6f8fb' })
      .jpeg({
        quality,
        chromaSubsampling: '4:4:4',
        progressive: true,
        mozjpeg: true,
      })
    if (
      profile === 'standard'
      && metadata.width
      && metadata.width > 2400
      && !/end-page|character-sheet|character-design|page01/i.test(pathname)
    ) {
      pipeline = pipeline.resize({ width: 2400, withoutEnlargement: true })
    }
    await pipeline.toFile(output)
    const outputInfo = await stat(output)
    const inputInfo = await stat(input)
    replacements[source] = new URL(
      `/pdf-final-assets/${profile}/${outputName}`,
      previewUrl,
    ).href
    ledger.push({
      source,
      replacement: replacements[source],
      action: `JPEG ${quality}, 4:4:4`,
      width: metadata.width,
      height: metadata.height,
      inputBytes: inputInfo.size,
      outputBytes: outputInfo.size,
    })
  }

  await page.evaluate(async (map) => {
    const images = Array.from(document.querySelectorAll('.portfolio-pdf-root img'))
    for (const image of images) {
      const current = image.currentSrc || image.src
      if (map[current]) image.src = map[current]
      image.removeAttribute('srcset')
      image.removeAttribute('sizes')
      if (typeof image.decode === 'function') await image.decode().catch(() => {})
    }
  }, replacements)
  return ledger
}

async function waitForAssets(page) {
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('.portfolio-pdf-root img'))
      .every((image) => image.complete),
    undefined,
    { timeout: 60_000 },
  )
  const failed = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.portfolio-pdf-root img'))
      .filter((image) => image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
  )
  if (failed.length) throw new Error(`Image decode failed: ${failed.join(', ')}`)
  await page.evaluate(() => document.fonts.ready)
}

async function preparePage(browser, name, configuration) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' })
  const result = {
    name,
    configuration,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
    optimizedAssets: [],
  }
  attachDiagnostics(page, result)
  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await setImageSourceMode(page, configuration.sourceMode)
  await waitForAssets(page)
  if (configuration.optimization) {
    result.optimizedAssets = await createOptimizedAssets(page, configuration.optimization)
    await waitForAssets(page)
  }
  await page.evaluate(() => {
    document.title = '黄国泰｜角色概念设计作品集'
    const metadata = {
      author: '黄国泰',
      description: 'Character Concept Art Portfolio',
      keywords: '角色概念设计, 游戏原画, 角色立绘, 角色三视图, Character Concept Art, Portfolio',
    }
    for (const [name, content] of Object.entries(metadata)) {
      let tag = document.head.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.name = name
        document.head.append(tag)
      }
      tag.content = content
    }
    document.documentElement.classList.add('portfolio-pdf-capture', 'portfolio-pdf-direct')
    document.querySelectorAll('.portfolio-pdf-root a').forEach((link) => {
      link.removeAttribute('href')
      link.setAttribute('tabindex', '-1')
    })
    window.scrollTo(0, 0)
  })
  const count = await page.locator('.portfolio-pdf-root > section').count()
  if (count !== pageNames.length) throw new Error(`Expected 12 pages, found ${count}`)
  result.pageCount = count
  result.softwareHeading = await page.locator('.pdf-resume-software h3').innerText()
  result.wechat = await page.locator('#end').innerText()
  result.imageSources = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.portfolio-pdf-root img')).map((image) => ({
      src: image.currentSrc || image.src,
      width: image.naturalWidth,
      height: image.naturalHeight,
      complete: image.complete,
    })),
  )
  return { context, page, result }
}

async function printPdf(page, temporaryPath, finalPath, variantName) {
  await page.pdf({
    path: temporaryPath,
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
  let metadataSource = temporaryPath
  if (variantName === 'standard') {
    const optimizedPath = path.join(workRoot, 'standard-image-optimized.pdf')
    execFileSync(python, [standardOptimizerScript, temporaryPath, optimizedPath], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })
    metadataSource = optimizedPath
  }
  execFileSync(python, [metadataScript, metadataSource, finalPath], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  })
}

let browser
try {
  await waitForPreview()
  browser = await chromium.launch({ headless: true })
  const results = {}
  for (const [name, configuration] of Object.entries(variants)) {
    console.log(`[portfolio-pdf-final] preparing ${name}`)
    const prepared = await preparePage(browser, name, configuration)
    const temporaryPath = path.join(workRoot, `${name}-without-final-metadata.pdf`)
    const finalPath = path.join(pdfDir, configuration.filename)
    await printPdf(prepared.page, temporaryPath, finalPath, name)
    await prepared.context.close()
    const buffer = await readFile(finalPath)
    results[name] = {
      ...prepared.result,
      path: path.relative(root, finalPath).replaceAll('\\', '/'),
      bytes: (await stat(finalPath)).size,
      sha256: createHash('sha256').update(buffer).digest('hex').toUpperCase(),
    }
  }
  const pass = Object.values(results).every((result) => (
    result.pageCount === 12
    && result.softwareHeading.trim() === 'SOFTWARE / TOOLS'
    && result.wechat.includes('Veiko_9029')
    && result.consoleErrors.length === 0
    && result.pageErrors.length === 0
    && result.failedRequests.length === 0
    && result.badResponses.length === 0
  ))
  await writeFile(
    path.join(validationDir, 'export-validation.json'),
    `${JSON.stringify({ pass, previewUrl, pageNames, results }, null, 2)}\n`,
    'utf8',
  )
  if (!pass) throw new Error('FINAL PDF export validation failed')
  console.log(JSON.stringify({ pass, outputs: results }, null, 2))
} finally {
  if (browser) await browser.close()
  previewProcess.kill()
}
