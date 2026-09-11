import { chromium } from 'playwright'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
const root = process.cwd()
const output = path.join(root, 'output', 'pdf', 'PDF', '黄国泰_MARLSA新版网站作品集.pdf')
await mkdir(path.dirname(output), { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('http://127.0.0.1:5194/', { waitUntil: 'networkidle' })
  const ids = await page.locator('.marlsa-site > section').evaluateAll(nodes => nodes.map(n => n.id).filter(Boolean))
  for (const id of ids) {
    await page.evaluate(id => { window.__portfolioEnsureSection?.(id); document.getElementById(id)?.scrollIntoView() }, id)
    await page.waitForTimeout(180)
  }
  await page.evaluate(() => {
    document.documentElement.classList.add('portfolio-pdf-capture')
    document.querySelector('.marlsa-entry')?.remove()
    document.querySelectorAll('.marlsa-site > section').forEach(section => { section.dataset.viewportActive = 'true' })
  })
  await page.waitForTimeout(500)
  await page.pdf({ path: output, printBackground: true, width: '1600px', height: '1000px', pageRanges: '1-13', preferCSSPageSize: false, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
  const info = await stat(output)
  if (info.size > 30 * 1024 * 1024) throw new Error(`PDF exceeds 30MB: ${info.size}`)
  console.log(JSON.stringify({ path: output, bytes: info.size, sections: ids.length }))
} finally { await browser.close() }
