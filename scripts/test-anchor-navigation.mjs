import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const baseUrl = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4173'
const reviewDir = path.join(root, 'review', 'd10-01')
const validationPath = path.join(reviewDir, 'navigation-validation.json')

const routes = [
  ['#contents', 'contents'],
  ['#key-visual-01', 'key-visual-01'],
  ['#key-visual-02', 'key-visual-02'],
  ['#page-02', 'key-visual-02'],
  ['#key-visual-03', 'key-visual-03'],
  ['#character-sheets', 'character-sheets'],
  ['#costume-detail', 'costume-detail'],
  ['#portrait-studies', 'portrait-studies'],
  ['#selected-works', 'selected-works'],
  ['#additional-designs', 'additional-designs'],
  ['#professional-profile', 'professional-profile'],
  ['#resume-contact-resume', 'professional-profile'],
  ['#about-the-creator', 'about-the-creator'],
  ['#end', 'about-the-creator'],
  ['#resume-contact-contact', 'about-the-creator'],
]

const directoryDestinations = [
  '#key-visual-01',
  '#key-visual-02',
  '#key-visual-03',
  '#costume-detail',
  '#character-sheets',
  '#professional-profile',
  '#about-the-creator',
]

const canonicalIdentity = Object.freeze({
  name: '黄国泰',
  role: '角色概念设计师',
  location: '中国：广东',
  email: '2488731102@qq.com',
  wechat: 'Veiko_9029',
  software: [
    'Adobe Photoshop',
    'Clip Studio Paint',
    'Adobe After Effects',
    'Adobe Premiere Pro',
    'SAI Ver.2',
  ],
})

await mkdir(reviewDir, { recursive: true })

const results = []
const record = (name, pass, detail = {}) => results.push({ name, pass, ...detail })

async function waitForRoute(page, canonicalId) {
  await page.waitForFunction((id) => {
    const section = document.getElementById(id)
    return section && !section.classList.contains('performance-section-placeholder')
  }, canonicalId)
  await page.waitForTimeout(180)
}

async function inspectRoute(page, hash, canonicalId) {
  await page.goto(`${baseUrl}/${hash}`, { waitUntil: 'networkidle' })
  await waitForRoute(page, canonicalId)
  return page.evaluate(({ hashValue, id }) => {
    const section = document.getElementById(id)
    const rect = section.getBoundingClientRect()
    const page02 = document.getElementById('key-visual-02')?.getBoundingClientRect()
    return {
      hash: location.hash,
      canonicalId: id,
      className: section.className,
      top: rect.top,
      height: rect.height,
      textLength: section.textContent.trim().length,
      page02AtTop: id !== 'key-visual-02' && page02 ? Math.abs(page02.top) < 3 : false,
      placeholder: section.classList.contains('performance-section-placeholder'),
      requestedHashPresent: Boolean(document.getElementById(hashValue.slice(1))),
    }
  }, { hashValue: hash, id: canonicalId })
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  for (const [hash, canonicalId] of routes) {
    const state = await inspectRoute(page, hash, canonicalId)
    const pass = state.hash === hash
      && state.requestedHashPresent
      && !state.placeholder
      && Math.abs(state.top) < 3
      && state.height >= 700
      && state.textLength > 20
      && !state.page02AtTop
    record(`direct refresh ${hash}`, pass, state)
  }
  await context.close()

  const directoryContext = await browser.newContext({ viewport: { width: 1672, height: 941 } })
  const directoryPage = await directoryContext.newPage()
  await directoryPage.goto(`${baseUrl}/#contents`, { waitUntil: 'networkidle' })
  await waitForRoute(directoryPage, 'contents')
  const hrefs = await directoryPage.locator('.d1001-directory-card').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  record('directory card destinations', JSON.stringify(hrefs) === JSON.stringify(directoryDestinations), { hrefs })

  for (let index = 0; index < directoryDestinations.length; index += 1) {
    await directoryPage.goto(`${baseUrl}/#contents`, { waitUntil: 'networkidle' })
    await waitForRoute(directoryPage, 'contents')
    await directoryPage.locator('.d1001-directory-card').nth(index).click()
    const destination = directoryDestinations[index]
    const canonicalId = routes.find(([hash]) => hash === destination)?.[1]
    await waitForRoute(directoryPage, canonicalId)
    const top = await directoryPage.locator(`#${canonicalId}`).evaluate((node) => node.getBoundingClientRect().top)
    record(`directory click ${destination}`, directoryPage.url().endsWith(destination) && Math.abs(top) < 3, { top })
  }

  for (const [navSelector, expected, canonicalId] of [
    ['.d1001-nav-resume', '#professional-profile', 'professional-profile'],
    ['.d1001-nav-contact', '#about-the-creator', 'about-the-creator'],
  ]) {
    await directoryPage.goto(`${baseUrl}/#contents`, { waitUntil: 'networkidle' })
    await waitForRoute(directoryPage, 'contents')
    await directoryPage.locator('.d1001-directory-top details').evaluate((details) => { details.open = true })
    await directoryPage.locator(navSelector).click()
    await waitForRoute(directoryPage, canonicalId)
    record(`${expected.slice(1).toUpperCase()} top navigation`, directoryPage.url().endsWith(expected))
  }

  await directoryPage.goto(`${baseUrl}/#contents`, { waitUntil: 'networkidle' })
  await waitForRoute(directoryPage, 'contents')
  await directoryPage.locator('.d1001-directory-card').first().click()
  await waitForRoute(directoryPage, 'key-visual-01')
  await directoryPage.goBack({ waitUntil: 'networkidle' })
  await waitForRoute(directoryPage, 'contents')
  const backHash = await directoryPage.evaluate(() => location.hash)
  await directoryPage.goForward({ waitUntil: 'networkidle' })
  await waitForRoute(directoryPage, 'key-visual-01')
  const forwardHash = await directoryPage.evaluate(() => location.hash)
  record('browser back and forward', backHash === '#contents' && forwardHash === '#key-visual-01', { backHash, forwardHash })
  await directoryContext.close()

  const reducedContext = await browser.newContext({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' })
  const reducedPage = await reducedContext.newPage()
  for (const [hash, canonicalId] of routes.filter(([, id], index, all) => all.findIndex((entry) => entry[1] === id) === index)) {
    const state = await inspectRoute(reducedPage, hash, canonicalId)
    const visible = await reducedPage.locator(`#${canonicalId}`).evaluate((section) => {
      const important = [...section.querySelectorAll('h1,h2,h3,figure,img,a')].filter((node) => !node.classList.contains('page-deep-link-alias'))
      return important.length > 0 && important.some((node) => {
        const style = getComputedStyle(node)
        return style.display !== 'none' && style.visibility !== 'hidden' && Number.parseFloat(style.opacity || '1') > 0
      })
    })
    record(`reduced motion ${hash}`, visible && state.textLength > 20, { visible, textLength: state.textLength })
  }
  await reducedContext.close()

  const screenshotContext = await browser.newContext({ viewport: { width: 1672, height: 941 }, deviceScaleFactor: 1 })
  const screenshotPage = await screenshotContext.newPage()
  await screenshotPage.goto(`${baseUrl}/#contents`, { waitUntil: 'networkidle' })
  await waitForRoute(screenshotPage, 'contents')
  const png = await screenshotPage.screenshot({ animations: 'disabled' })
  record('desktop screenshot dimensions 1672x941', png.readUInt32BE(16) === 1672 && png.readUInt32BE(20) === 941)
  await screenshotContext.close()

  const profileContext = await browser.newContext({ viewport: { width: 1586, height: 992 }, deviceScaleFactor: 1 })
  const profilePage = await profileContext.newPage()
  await profilePage.goto(`${baseUrl}/#professional-profile`, { waitUntil: 'networkidle' })
  await waitForRoute(profilePage, 'professional-profile')
  const profilePng = await profilePage.screenshot({ animations: 'disabled' })
  record('profile screenshot dimensions 1586x992', profilePng.readUInt32BE(16) === 1586 && profilePng.readUInt32BE(20) === 992)
  await profileContext.close()

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const mobilePage = await mobileContext.newPage()
  for (const [hash, canonicalId] of routes.filter(([, id], index, all) => all.findIndex((entry) => entry[1] === id) === index)) {
    await mobilePage.goto(`${baseUrl}/${hash}`, { waitUntil: 'networkidle' })
    await waitForRoute(mobilePage, canonicalId)
    const state = await mobilePage.evaluate((id) => ({
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      textLength: document.getElementById(id)?.innerText.trim().length || 0,
      placeholder: document.getElementById(id)?.classList.contains('performance-section-placeholder'),
    }), canonicalId)
    record(`mobile overflow ${hash}`, !state.placeholder && state.textLength > 20 && state.scrollWidth <= state.innerWidth + 1, state)
  }
  await mobileContext.close()

  const identityContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const identityPage = await identityContext.newPage()
  await identityPage.goto(`${baseUrl}/#professional-profile`, { waitUntil: 'networkidle' })
  await waitForRoute(identityPage, 'professional-profile')
  await identityPage.evaluate(() => window.__portfolioEnsureSection?.('about-the-creator'))
  await waitForRoute(identityPage, 'about-the-creator')

  const identityState = await identityPage.evaluate((canonical) => {
    const profile = document.getElementById('professional-profile')
    const about = document.getElementById('about-the-creator')
    const definitionList = (container) => Object.fromEntries([...container.querySelectorAll('dl > div')].map((row) => [
      row.querySelector('dt')?.textContent.trim() || '',
      row.querySelector('dd')?.textContent.trim() || '',
    ]))
    const profileFields = definitionList(profile.querySelector('.d1001-profile-identity'))
    const aboutFields = definitionList(about.querySelector('.d1001-about-window'))
    const identityNames = [
      profile.querySelector('.d1001-profile-identity h3')?.textContent.trim() || '',
      about.querySelector('.d1001-about-window h3')?.textContent.trim() || '',
    ]
    const identityRoles = [
      profile.querySelector('.d1001-profile-identity > p')?.textContent.trim() || '',
      about.querySelector('.d1001-about-window h3 + p')?.textContent.trim() || '',
    ]
    const contactSections = [profile, about]
    const renderedEmails = contactSections.flatMap((section) => [...section.querySelectorAll('a[href^="mailto:"]')].map((link) => ({
      text: link.textContent.trim(),
      href: link.getAttribute('href')?.slice('mailto:'.length) || '',
    })))
    const extractedEmails = contactSections.flatMap((section) => section.innerText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])
    const telephoneLinks = contactSections.flatMap((section) => [...section.querySelectorAll('a[href^="tel:"]')].map((link) => link.getAttribute('href')))
    const contactText = contactSections.map((section) => section.innerText).join('\n')
    const telephoneLabels = contactText.match(/电话|手机|联系电话|telephone|phone|mobile/gi) || []
    const mainlandTelephoneValues = contactText.match(/(?:\+?86[-\s]?)?1[3-9]\d{9}/g) || []
    const software = [...profile.querySelectorAll('.d1001-profile-tools article strong')].map((node) => node.textContent.trim())

    return {
      identityNames,
      identityRoles,
      profileFields,
      aboutFields,
      renderedEmails,
      extractedEmails,
      telephoneLinks,
      telephoneLabels,
      mainlandTelephoneValues,
      software,
      checks: {
        exactNames: identityNames.length === 2 && identityNames.every((value) => value === canonical.name),
        exactRoles: identityRoles.length === 2 && identityRoles.every((value) => value === canonical.role),
        exactLocation: profileFields['所在地'] === canonical.location,
        exactEmails: renderedEmails.length === 2
          && renderedEmails.every(({ text, href }) => text === canonical.email && href === canonical.email)
          && extractedEmails.length === 2
          && extractedEmails.every((value) => value === canonical.email),
        exactWechat: profileFields['微信'] === canonical.wechat && aboutFields['微信'] === canonical.wechat,
        noTelephone: telephoneLinks.length === 0 && telephoneLabels.length === 0 && mainlandTelephoneValues.length === 0,
        exactSoftware: JSON.stringify(software) === JSON.stringify(canonical.software),
        noAdditionalIdentityFields: JSON.stringify(Object.keys(profileFields)) === JSON.stringify(['所在地', '邮箱', '微信', '可合作时间'])
          && JSON.stringify(Object.keys(aboutFields)) === JSON.stringify(['擅长方向', '邮箱', '微信']),
      },
    }
  }, canonicalIdentity)

  for (const [name, pass] of Object.entries(identityState.checks)) record(`canonical profile allowlist: ${name}`, pass, identityState)
  await identityContext.close()

  const lazyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const lazyPage = await lazyContext.newPage()
  await lazyPage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
  await lazyPage.evaluate(() => window.__portfolioEnsureSection?.('additional-designs'))
  await waitForRoute(lazyPage, 'additional-designs')
  record('lazy-mounted section becomes visible', await lazyPage.locator('#additional-designs').evaluate((node) => !node.classList.contains('performance-section-placeholder')))
  await lazyContext.close()
} finally {
  await browser.close()
}

const output = {
  generatedAt: new Date().toISOString(),
  suite: 'D10.01 R2 route, navigation, reduced-motion, responsive, and identity validation',
  baseUrl,
  pass: results.every((result) => result.pass),
  tests: results,
}

await writeFile(validationPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ pass: output.pass, tests: results.map(({ name, pass }) => ({ name, pass })) }, null, 2))
if (!output.pass) process.exitCode = 1
