import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const out = 'review/site-fluidity'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []
const errors = []
try {
  for (const [width, reducedMotion] of [[1600, 'reduce'], [390, 'reduce'], [1600, 'no-preference']]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion })
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://127.0.0.1:5194/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.querySelector('#contents') && !document.querySelector('#contents').classList.contains('performance-section-placeholder'))
    const ids = await page.locator('.marlsa-site > section').evaluateAll(nodes => nodes.map(node => node.id))
    for (const id of ids) {
      await page.evaluate(id => { window.__portfolioEnsureSection?.(id); document.getElementById(id)?.scrollIntoView() }, id)
      await page.waitForTimeout(350)
      const state = await page.evaluate(id => {
        const section = document.getElementById(id)
        return { id, top: section.getBoundingClientRect().top, mounted: !section.classList.contains('performance-section-placeholder'), active: section.dataset.viewportActive, overflow: document.documentElement.scrollWidth - innerWidth,
          offscreenRunning: [...document.querySelectorAll('.marlsa-site > [data-viewport-active="false"] *')].filter(el => getComputedStyle(el).animationName !== 'none' && getComputedStyle(el).animationPlayState !== 'paused').length }
      }, id)
      results.push({ width, reducedMotion, ...state })
      assert.ok(state.mounted, `${id}: still placeholder`)
      assert.ok(Math.abs(state.top) < 4, `${id}: misaligned ${state.top}`)
      assert.equal(state.active, 'true')
      assert.equal(state.offscreenRunning, 0)
      assert.ok(state.overflow < 2, `${id}: horizontal overflow`)
      if (['title', 'contents', 'costume-detail', 'about-the-creator'].includes(id)) await page.screenshot({ path: `${out}/${width}-${reducedMotion}-${id}.png` })
    }
    await page.close()
  }
  assert.deepEqual(errors, [])
  await writeFile(`${out}/validation.json`, JSON.stringify({ pass: true, results, errors }, null, 2))
  console.log(JSON.stringify({ pass: true, checked: results.length, errors }))
} finally { await browser.close() }
