import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
const out = new URL('../review/entry-fix-20260911/', import.meta.url)
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.addInitScript(() => {
  window.entryFrames = { cleared: 0, samples: 0, scales: [], overlap: 0 }
  const dirty = new WeakSet()
  for (const key of ['width', 'height']) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, key)
    Object.defineProperty(HTMLCanvasElement.prototype, key, { ...descriptor, set(value) { descriptor.set.call(this, value); dirty.add(this) } })
  }
  const draw = WebGLRenderingContext.prototype.drawArrays
  WebGLRenderingContext.prototype.drawArrays = function (...args) { const result = draw.apply(this, args); dirty.delete(this.canvas); return result }
  function sample() {
    const ocean = document.querySelector('.marlsa-entry-ocean-canvas')
    if (ocean?.dataset.running === 'true') {
      window.entryFrames.samples++
      if (dirty.has(ocean)) window.entryFrames.cleared++
      const scale = ocean.dataset.renderScale
      if (window.entryFrames.scales.at(-1) !== scale) window.entryFrames.scales.push(scale)
      if (document.querySelector('.marlsa-memory-structure')?.dataset.running === 'true') window.entryFrames.overlap++
    }
    requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
})
try {
  await page.goto('http://127.0.0.1:5194/', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('#title')?.dataset.d1101Opening === 'complete', null, { timeout: 45000 })
  const frames = await page.evaluate(() => window.entryFrames)
  assert.ok(frames.samples > 10)
  assert.equal(frames.cleared, 0, 'A resized canvas must be redrawn in the same frame')
  assert.equal(frames.overlap, 0, 'Home structure must wait until ocean completes')
  await page.goto('http://127.0.0.1:5194/#costume-detail', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  assert.equal(await page.locator('.d06-costume-scan').count(), 0)
  await page.screenshot({ path: fileURLToPath(new URL('costume-clean.png', out)) })
  assert.equal(await page.locator('.marlsa-memory-structure').getAttribute('data-running'), 'false')
  assert.deepEqual(errors, [])
  await writeFile(new URL('validation.json', out), JSON.stringify({ pass: true, frames, errors }, null, 2))
  console.log(JSON.stringify({ pass: true, frames, errors }))
} finally { await browser.close() }
