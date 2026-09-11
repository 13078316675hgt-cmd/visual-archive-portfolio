import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const label = process.argv[2] || 'after'
const output = 'review/key-visual-motion'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []
try {
  for (const id of ['key-visual-01', 'key-visual-02', 'key-visual-03']) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(() => {
      window.motionSamples = []
      let previous
      function sample(now) {
        const running = document.querySelector('[data-d0919-page01-phase="running"], [data-page02-motion="running"], [data-approved-motion="page03"][data-motion-state="playing"]')
        if (running && previous) window.motionSamples.push(now - previous)
        previous = now
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    await page.goto(`http://127.0.0.1:5194/#${id}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(id => {
      const el = document.getElementById(id)
      return el?.dataset.d0919Page01Phase === 'complete' || el?.dataset.page02Motion === 'complete' || el?.querySelector('[data-motion-state="complete"]')
    }, id)
    const frames = await page.evaluate(() => window.motionSamples)
    assert.deepEqual(errors, [])
    assert.ok(frames.length > 5)
    const state = await page.evaluate(id => {
      const el = document.getElementById(id)
      return { top: el.getBoundingClientRect().top, count: el.querySelector('[data-play-count]')?.dataset.playCount }
    }, id)
    await page.screenshot({ path: `${output}/${label}-${id}.png` })
    await page.evaluate(() => document.getElementById('title').scrollIntoView())
    await page.waitForTimeout(100)
    await page.evaluate(id => document.getElementById(id).scrollIntoView(), id)
    await page.waitForTimeout(250)
    if (id === 'key-visual-03') assert.equal(await page.locator('[data-approved-motion="page03"]').getAttribute('data-play-count'), state.count)
    results.push({ id, samples: frames.length, over34ms: frames.filter(t => t > 34).length, maxMs: Math.max(...frames), ...state, errors })
    await page.close()
  }
  await writeFile(`${output}/${label}.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results))
} finally { await browser.close() }
