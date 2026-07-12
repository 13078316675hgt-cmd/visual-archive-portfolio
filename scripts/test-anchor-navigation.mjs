import { chromium } from 'playwright'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const baseUrl = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4173'
const contentsVisual = process.env.CONTENTS_VISUAL || ''
const visualQuery = contentsVisual ? `contentsVisual=${encodeURIComponent(contentsVisual)}&` : ''
const reviewDir = path.join(root, 'review', 'navigation')
const videoDir = path.join(reviewDir, '.video-temp')
const recordingPath = path.join(reviewDir, process.env.NAVIGATION_RECORDING_FILE || 'v5-20-anchor-scroll-stability-1920.webm')
const validationPath = path.join(reviewDir, process.env.NAVIGATION_VALIDATION_FILE || 'v5-20-anchor-scroll-validation.json')
const commandLogPath = path.join(reviewDir, process.env.NAVIGATION_LOG_FILE || 'v5-20-scroll-command-log.json')
const skipRecording = process.env.SKIP_NAVIGATION_RECORDING === '1'

const reviewUrl = (motion, hash) => `${baseUrl}/?${visualQuery}archiveMotion=${motion}${hash}`

await mkdir(reviewDir, { recursive: true })

const installInstrumentation = () => {
  const state = {
    logs: [],
    manualStarted: false,
    animationPhases: [],
  }
  window.__v520Navigation = state

  const identify = (element) => {
    if (!element) return null
    return element.id || element.getAttribute?.('href') || element.getAttribute?.('data-chapter') || element.tagName || null
  }
  const record = (method, target, extra = {}) => {
    state.logs.push({
      timestamp: performance.now(),
      method,
      target: identify(target),
      afterManualScroll: state.manualStarted,
      ...extra,
    })
  }

  const originalScrollIntoView = Element.prototype.scrollIntoView
  Element.prototype.scrollIntoView = function (...args) {
    record('scrollIntoView', this, { args, stack: new Error().stack?.split('\n').slice(1, 6).join('\n') })
    return originalScrollIntoView.apply(this, args)
  }

  const originalScrollTo = window.scrollTo.bind(window)
  window.scrollTo = (...args) => {
    record('window.scrollTo', document.scrollingElement, { args, stack: new Error().stack?.split('\n').slice(1, 6).join('\n') })
    return originalScrollTo(...args)
  }

  const originalFocus = HTMLElement.prototype.focus
  HTMLElement.prototype.focus = function (...args) {
    record('focus', this, { args })
    return originalFocus.apply(this, args)
  }

  window.addEventListener('hashchange', () => record('hashchange', document.getElementById(location.hash.slice(1))))
  window.addEventListener('popstate', () => record('popstate', document.getElementById(location.hash.slice(1))))

  const watchScene = () => {
    const scene = document.querySelector('.archive-selection-scene')
    if (!scene) return
    const capture = () => {
      const phase = scene.dataset.archivePhase || ''
      if (state.animationPhases.at(-1) !== phase) state.animationPhases.push(phase)
    }
    capture()
    new MutationObserver(capture).observe(scene, { attributes: true, attributeFilter: ['data-archive-phase'] })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchScene, { once: true })
  else watchScene()
}

const instrumentContext = async (browser, options) => {
  const context = await browser.newContext(options)
  await context.addInitScript(installInstrumentation)
  return context
}

const pageErrors = (page) => {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ''}`))
  return errors
}

const waitForArchiveComplete = async (page) => {
  await page.waitForFunction(() => document.querySelector('.archive-selection-scene')?.dataset.archivePhase === 'complete')
}

const waitForAnchorSettled = async (page, hash) => {
  await page.waitForFunction((targetHash) => {
    const target = document.getElementById(targetHash.slice(1))
    const scrollCalls = window.__v520Navigation?.logs.filter((entry) => entry.method === 'scrollIntoView').length || 0
    return scrollCalls >= 1 && target && Math.abs(target.getBoundingClientRect().top) < 180
  }, hash, { timeout: 15000 })
  await page.waitForTimeout(250)
}

const resetInstrumentation = async (page) => page.evaluate(() => {
  window.__v520Navigation.logs = []
  window.__v520Navigation.manualStarted = false
  window.__v520Navigation.animationPhases = [document.querySelector('.archive-selection-scene')?.dataset.archivePhase || '']
})

const getScrollState = async (page, hash) => page.evaluate((targetHash) => {
  const target = document.getElementById(targetHash.slice(1))
  return {
    scrollY: window.scrollY,
    maxScroll: document.documentElement.scrollHeight - window.innerHeight,
    targetViewportTop: target?.getBoundingClientRect().top ?? null,
    phase: document.querySelector('.archive-selection-scene')?.dataset.archivePhase || '',
  }
}, hash)

const collectCounts = (logs) => ({
  scrollIntoView: logs.filter((entry) => entry.method === 'scrollIntoView').length,
  scrollTo: logs.filter((entry) => entry.method === 'window.scrollTo').length,
  hashchange: logs.filter((entry) => entry.method === 'hashchange').length,
  popstate: logs.filter((entry) => entry.method === 'popstate').length,
  focus: logs.filter((entry) => entry.method === 'focus').length,
  forcedAfterManual: logs.filter((entry) => entry.afterManualScroll && ['scrollIntoView', 'window.scrollTo'].includes(entry.method)).length,
})

const clickChapter = async (page, chapter) => {
  const locator = page.locator(`.archive-route-node[data-chapter="${chapter}"] .archive-route-anchor`)
  if (await locator.count() !== 1) throw new Error(`Expected one clickable anchor marker for chapter ${chapter}`)
  await locator.click()
}

const runDestinationTest = async (browser, destination) => {
  const context = await instrumentContext(browser, { viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()
  const errors = pageErrors(page)
  await page.goto(reviewUrl('end', '#contents'), { waitUntil: 'networkidle' })
  await waitForArchiveComplete(page)
  await resetInstrumentation(page)

  await clickChapter(page, destination.chapter)
  await page.waitForFunction((hash) => location.hash === hash, destination.hash)
  await waitForAnchorSettled(page, destination.hash)
  const initial = await getScrollState(page, destination.hash)

  await page.evaluate(() => { window.__v520Navigation.manualStarted = true })
  const firstDelta = Math.min(900, Math.max(0, initial.maxScroll - initial.scrollY - 20))
  await page.mouse.wheel(0, firstDelta)
  const manualTarget = Math.min(initial.maxScroll, initial.scrollY + firstDelta)
  await page.waitForTimeout(500)
  const after500 = await getScrollState(page, destination.hash)
  await page.waitForTimeout(1500)
  const after2000 = await getScrollState(page, destination.hash)

  const secondDelta = Math.min(700, Math.max(0, after2000.maxScroll - after2000.scrollY - 20))
  await page.mouse.wheel(0, secondDelta)
  await page.waitForTimeout(2100)
  const afterSecondDown = await getScrollState(page, destination.hash)
  await page.mouse.wheel(0, -500)
  await page.waitForTimeout(900)
  const afterUp = await getScrollState(page, destination.hash)

  const instrumentation = await page.evaluate(() => window.__v520Navigation)
  const counts = collectCounts(instrumentation.logs)
  const movedDown = after2000.scrollY > initial.scrollY + Math.min(300, firstDelta * .55)
  const stayedDown = Math.abs(after2000.scrollY - manualTarget) < 180
  const movedDownAgain = secondDelta < 50 || afterSecondDown.scrollY > after2000.scrollY + Math.min(240, secondDelta * .5)
  const movedUp = afterUp.scrollY < afterSecondDown.scrollY - 250
  const snapback = !movedDown || !stayedDown || counts.forcedAfterManual > 0
  const animationReplay = instrumentation.animationPhases.some((phase, index) => index > 0 && phase !== 'complete')

  const result = {
    viewport: '1920x1080',
    destination: destination.hash,
    navigationMethod: 'pointer click',
    initialTargetScrollY: initial.scrollY,
    manualScrollTarget: manualTarget,
    scrollYAfter500ms: after500.scrollY,
    scrollYAfter2000ms: after2000.scrollY,
    scrollYAfterSecondDown: afterSecondDown.scrollY,
    scrollYAfterUp: afterUp.scrollY,
    snapbackDetected: snapback,
    scrollIntoViewCallCount: counts.scrollIntoView,
    windowScrollToCallCount: counts.scrollTo,
    hashchangeCount: counts.hashchange,
    popstateCount: counts.popstate,
    focusCallCount: counts.focus,
    forcedScrollCallsAfterManualScroll: counts.forcedAfterManual,
    animationReplayDetected: animationReplay,
    consoleErrors: errors,
    pass: !snapback && movedDownAgain && movedUp && !animationReplay && counts.scrollIntoView === 1 && counts.scrollTo === 0 && errors.length === 0,
  }
  const logs = instrumentation.logs.map((entry) => ({ test: destination.hash, viewport: '1920x1080', ...entry }))
  await context.close()
  return { result, logs }
}

const runDirectHashTest = async (browser) => {
  const context = await instrumentContext(browser, { viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()
  const errors = pageErrors(page)
  const hash = '#costume-detail'
  await page.goto(reviewUrl('end', hash), { waitUntil: 'networkidle' })
  await waitForArchiveComplete(page)
  await waitForAnchorSettled(page, hash)
  const initial = await getScrollState(page, hash)
  await page.evaluate(() => { window.__v520Navigation.manualStarted = true })
  await page.mouse.wheel(0, 850)
  await page.waitForTimeout(2100)
  const after = await getScrollState(page, hash)
  const instrumentation = await page.evaluate(() => window.__v520Navigation)
  const counts = collectCounts(instrumentation.logs)
  const result = {
    viewport: '1920x1080', destination: hash, navigationMethod: 'direct URL hash',
    initialTargetScrollY: initial.scrollY, manualScrollTarget: Math.min(initial.maxScroll, initial.scrollY + 850),
    initialTargetViewportTop: initial.targetViewportTop,
    scrollYAfter500ms: null, scrollYAfter2000ms: after.scrollY,
    snapbackDetected: after.scrollY < initial.scrollY + 400,
    scrollIntoViewCallCount: counts.scrollIntoView, windowScrollToCallCount: counts.scrollTo,
    hashchangeCount: counts.hashchange, popstateCount: counts.popstate, focusCallCount: counts.focus,
    forcedScrollCallsAfterManualScroll: counts.forcedAfterManual,
    animationReplayDetected: false, consoleErrors: errors,
    pass: Math.abs(initial.targetViewportTop) < 160 && after.scrollY > initial.scrollY + 400 && counts.scrollIntoView === 1 && counts.forcedAfterManual === 0 && errors.length === 0,
  }
  const logs = instrumentation.logs.map((entry) => ({ test: 'direct-hash', viewport: '1920x1080', ...entry }))
  await context.close()
  return { result, logs }
}

const runHistoryTest = async (browser) => {
  const context = await instrumentContext(browser, { viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()
  const errors = pageErrors(page)
  await page.goto(reviewUrl('end', '#contents'), { waitUntil: 'networkidle' })
  await waitForArchiveComplete(page)
  await resetInstrumentation(page)
  await clickChapter(page, '01')
  await page.waitForFunction(() => location.hash === '#key-visual-01')
  await waitForAnchorSettled(page, '#key-visual-01')
  await page.goBack({ waitUntil: 'commit' })
  await page.waitForFunction(() => location.hash === '#contents')
  await page.waitForTimeout(700)
  const back = await getScrollState(page, '#contents')
  await page.goForward({ waitUntil: 'commit' })
  await page.waitForFunction(() => location.hash === '#key-visual-01')
  await page.waitForTimeout(700)
  const forward = await getScrollState(page, '#key-visual-01')
  const instrumentation = await page.evaluate(() => window.__v520Navigation)
  const counts = collectCounts(instrumentation.logs)
  const result = {
    viewport: '1920x1080', destination: '#contents ⇄ #key-visual-01', navigationMethod: 'Back / Forward',
    initialTargetScrollY: back.scrollY, manualScrollTarget: null, scrollYAfter500ms: forward.scrollY, scrollYAfter2000ms: forward.scrollY,
    snapbackDetected: false, scrollIntoViewCallCount: counts.scrollIntoView, windowScrollToCallCount: counts.scrollTo,
    hashchangeCount: counts.hashchange, popstateCount: counts.popstate, focusCallCount: counts.focus,
    forcedScrollCallsAfterManualScroll: counts.forcedAfterManual, animationReplayDetected: false, consoleErrors: errors,
    backHash: '#contents', forwardHash: '#key-visual-01', backTargetViewportTop: back.targetViewportTop, forwardTargetViewportTop: forward.targetViewportTop,
    pass: Math.abs(back.targetViewportTop) < 180 && Math.abs(forward.targetViewportTop) < 180 && counts.popstate === 2 && errors.length === 0,
  }
  const logs = instrumentation.logs.map((entry) => ({ test: 'back-forward', viewport: '1920x1080', ...entry }))
  await context.close()
  return { result, logs }
}

const runKeyboardTest = async (browser) => {
  const context = await instrumentContext(browser, { viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()
  const errors = pageErrors(page)
  await page.goto(reviewUrl('end', '#contents'), { waitUntil: 'networkidle' })
  await waitForArchiveComplete(page)
  await resetInstrumentation(page)
  const link = page.locator('.archive-route-node[data-chapter="04"]')
  if (await link.count() !== 1) throw new Error('Expected one chapter 04 link')
  await link.press('Enter')
  await page.waitForFunction(() => location.hash === '#character-sheets')
  await waitForAnchorSettled(page, '#character-sheets')
  const target = await getScrollState(page, '#character-sheets')
  const instrumentation = await page.evaluate(() => window.__v520Navigation)
  const counts = collectCounts(instrumentation.logs)
  const result = {
    viewport: '1920x1080', destination: '#character-sheets', navigationMethod: 'keyboard Enter',
    initialTargetScrollY: target.scrollY, manualScrollTarget: null, scrollYAfter500ms: target.scrollY, scrollYAfter2000ms: target.scrollY,
    initialTargetViewportTop: target.targetViewportTop,
    snapbackDetected: false, scrollIntoViewCallCount: counts.scrollIntoView, windowScrollToCallCount: counts.scrollTo,
    hashchangeCount: counts.hashchange, popstateCount: counts.popstate, focusCallCount: counts.focus,
    forcedScrollCallsAfterManualScroll: counts.forcedAfterManual, animationReplayDetected: false, consoleErrors: errors,
    pass: Math.abs(target.targetViewportTop) < 180 && counts.scrollIntoView === 1 && errors.length === 0,
  }
  const logs = instrumentation.logs.map((entry) => ({ test: 'keyboard', viewport: '1920x1080', ...entry }))
  await context.close()
  return { result, logs }
}

const runReducedOrMobileTest = async (browser, { mobile = false, reduced = false }) => {
  const viewport = mobile ? { width: 390, height: 844 } : { width: 1920, height: 1080 }
  const context = await instrumentContext(browser, { viewport, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const page = await context.newPage()
  const errors = pageErrors(page)
  await page.goto(reviewUrl('end', '#contents'), { waitUntil: 'networkidle' })
  await waitForArchiveComplete(page)
  await resetInstrumentation(page)
  await clickChapter(page, '05')
  await page.waitForFunction(() => location.hash === '#costume-detail')
  await waitForAnchorSettled(page, '#costume-detail')
  const initial = await getScrollState(page, '#costume-detail')
  await page.evaluate(() => { window.__v520Navigation.manualStarted = true })
  await page.mouse.wheel(0, 800)
  await page.waitForTimeout(2100)
  const after = await getScrollState(page, '#costume-detail')
  const instrumentation = await page.evaluate(() => {
    const core = document.querySelector('.archive-selection-core')
    return {
      ...window.__v520Navigation,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      coreDisplay: core ? getComputedStyle(core).display : 'none',
    }
  })
  const counts = collectCounts(instrumentation.logs)
  const result = {
    viewport: `${viewport.width}x${viewport.height}`, destination: '#costume-detail',
    navigationMethod: reduced ? 'reduced-motion pointer click' : 'mobile pointer click',
    initialTargetScrollY: initial.scrollY, manualScrollTarget: Math.min(initial.maxScroll, initial.scrollY + 800),
    scrollYAfter500ms: null, scrollYAfter2000ms: after.scrollY,
    snapbackDetected: after.scrollY < initial.scrollY + 350,
    scrollIntoViewCallCount: counts.scrollIntoView, windowScrollToCallCount: counts.scrollTo,
    hashchangeCount: counts.hashchange, popstateCount: counts.popstate, focusCallCount: counts.focus,
    forcedScrollCallsAfterManualScroll: counts.forcedAfterManual,
    animationReplayDetected: instrumentation.animationPhases.some((phase, index) => index > 0 && phase !== 'complete'),
    consoleErrors: errors, horizontalOverflow: instrumentation.overflow,
    desktopCoreDisplay: instrumentation.coreDisplay,
    pass: after.scrollY > initial.scrollY + 350 && counts.scrollIntoView === 1 && counts.forcedAfterManual === 0 && instrumentation.overflow <= 1 && (!mobile || instrumentation.coreDisplay === 'none') && errors.length === 0,
  }
  const logs = instrumentation.logs.map((entry) => ({ test: reduced ? 'reduced-motion' : 'mobile', viewport: result.viewport, ...entry }))
  await context.close()
  return { result, logs }
}

const runQuerySafetyTest = async (browser) => {
  const context = await instrumentContext(browser, { viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()
  const errors = pageErrors(page)
  await page.goto(reviewUrl('replay', '#contents'), { waitUntil: 'networkidle' })
  await waitForArchiveComplete(page)
  await resetInstrumentation(page)
  await clickChapter(page, '03')
  await page.waitForFunction(() => location.hash === '#key-visual-03')
  await waitForAnchorSettled(page, '#key-visual-03')
  const instrumentation = await page.evaluate(() => window.__v520Navigation)
  const counts = collectCounts(instrumentation.logs)
  const phase = await page.locator('.archive-selection-scene').getAttribute('data-archive-phase')
  const result = {
    viewport: '1920x1080', destination: '?archiveMotion=replay#key-visual-03', navigationMethod: 'review query + pointer click',
    initialTargetScrollY: null, manualScrollTarget: null, scrollYAfter500ms: null, scrollYAfter2000ms: null,
    snapbackDetected: false, scrollIntoViewCallCount: counts.scrollIntoView, windowScrollToCallCount: counts.scrollTo,
    hashchangeCount: counts.hashchange, popstateCount: counts.popstate, focusCallCount: counts.focus,
    forcedScrollCallsAfterManualScroll: counts.forcedAfterManual,
    animationReplayDetected: instrumentation.animationPhases.some((value, index) => index > 0 && value !== 'complete'),
    consoleErrors: errors, finalPhase: phase,
    pass: phase === 'complete' && counts.scrollIntoView === 1 && errors.length === 0,
  }
  const logs = instrumentation.logs.map((entry) => ({ test: 'review-query-safety', viewport: '1920x1080', ...entry }))
  await context.close()
  return { result, logs }
}

const recordStability = async (browser) => {
  await rm(videoDir, { recursive: true, force: true })
  await mkdir(videoDir, { recursive: true })
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: videoDir, size: { width: 1920, height: 1080 } } })
  const page = await context.newPage()
  await page.goto(reviewUrl('end', '#contents'), { waitUntil: 'networkidle' })
  await waitForArchiveComplete(page)
  await page.waitForTimeout(700)
  await clickChapter(page, '05')
  await page.waitForFunction(() => location.hash === '#costume-detail')
  await page.waitForFunction(() => {
    const target = document.getElementById('costume-detail')
    return target && Math.abs(target.getBoundingClientRect().top) < 180
  }, null, { timeout: 15000 })
  await page.waitForTimeout(250)
  await page.mouse.wheel(0, 900)
  await page.waitForTimeout(2100)
  await page.mouse.wheel(0, 700)
  await page.waitForTimeout(2100)
  await page.mouse.wheel(0, -550)
  await page.waitForTimeout(1500)
  const video = page.video()
  await page.close()
  const temporaryPath = await video.path()
  await context.close()
  await rm(recordingPath, { force: true })
  await rename(temporaryPath, recordingPath)
  await rm(videoDir, { recursive: true, force: true })
}

const browser = await chromium.launch({ headless: true })
const validations = []
const commandLog = []
try {
  for (const destination of [
    { chapter: '01', hash: '#key-visual-01' },
    { chapter: '05', hash: '#costume-detail' },
    { chapter: '07', hash: '#additional-designs' },
  ]) {
    const test = await runDestinationTest(browser, destination)
    validations.push(test.result)
    commandLog.push(...test.logs)
  }

  for (const runner of [
    runDirectHashTest,
    runHistoryTest,
    runKeyboardTest,
  ]) {
    const test = await runner(browser)
    validations.push(test.result)
    commandLog.push(...test.logs)
  }

  for (const options of [{ reduced: true }, { mobile: true }]) {
    const test = await runReducedOrMobileTest(browser, options)
    validations.push(test.result)
    commandLog.push(...test.logs)
  }

  const querySafety = await runQuerySafetyTest(browser)
  validations.push(querySafety.result)
  commandLog.push(...querySafety.logs)
  if (!skipRecording) await recordStability(browser)
} finally {
  await browser.close()
}

const validationOutput = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  suite: 'V5.2 desktop anchor navigation scroll stability',
  pass: validations.every((test) => test.pass),
  tests: validations,
}

await writeFile(validationPath, `${JSON.stringify(validationOutput, null, 2)}\n`, 'utf8')
await writeFile(commandLogPath, `${JSON.stringify({ generatedAt: validationOutput.generatedAt, contentsVisual, entries: commandLog }, null, 2)}\n`, 'utf8')

console.log(JSON.stringify({
  pass: validationOutput.pass,
  tests: validations.map(({ destination, navigationMethod, pass, snapbackDetected, scrollIntoViewCallCount, forcedScrollCallsAfterManualScroll }) => ({ destination, navigationMethod, pass, snapbackDetected, scrollIntoViewCallCount, forcedScrollCallsAfterManualScroll })),
  recording: skipRecording ? null : path.relative(root, recordingPath).replaceAll(path.sep, '/'),
}, null, 2))

if (!validationOutput.pass) process.exitCode = 1
