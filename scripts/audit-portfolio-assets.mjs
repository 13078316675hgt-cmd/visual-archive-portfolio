import { access, readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  additionalCharacterDesigns,
  artworkThree,
  artworkTwo,
  characterSheets,
  costumeDetailAsset,
  portraitStudies,
  selectedWorks,
} from '../src/data/artworkManifest.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicRoot = path.join(root, 'public')
const approvedRoot = path.join(root, 'public', 'assets', 'approved')
const requireDist = process.argv.includes('--dist')
const gitMetadataAvailable = existsSync(path.join(root, '.git'))
let detectedDistBase = null
const reviewPendingRuntimeAssets = new Set([
  'public/assets/d10-01/about-hand-locked-r2.png',
])
const directRuntimeAssets = [
  ['HOME approved composite fallback', 'assets/performance-v1-source/home-approved-composite-2560x1440.png'],
  ...[960, 1800, 2560].flatMap((width) => ['avif', 'webp'].map((extension) => [`HOME performance ${width}.${extension}`, `assets/performance-v1/home-clean/home-clean-${width}.${extension}`])),
  ['PAGE 01 original artwork fallback', 'assets/d09-19-page01/page01-original-art-crop-1515x1780.png'],
  ...[720, 1280, 1515].flatMap((width) => ['avif', 'webp'].map((extension) => [`PAGE 01 performance ${width}.${extension}`, `assets/performance-v1/page01-original-art/page01-original-art-${width}.${extension}`])),
  ['ABOUT approved hand isolation', 'assets/d10-01/about-hand-locked-r2.png'],
]

const srcSetCandidates = (srcSet = '') => srcSet
  .split(',')
  .map((candidate) => candidate.trim().split(/\s+/)[0])
  .filter(Boolean)

async function hasExactCase(base, relative) {
  let current = base
  for (const segment of relative.split('/').filter(Boolean)) {
    const entries = await readdir(current)
    if (!entries.includes(segment)) return false
    current = path.join(current, segment)
  }
  return true
}

function isTracked(repoRelative) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', repoRelative.replaceAll(path.sep, '/')], { cwd: root, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

function activeRoleEntries() {
  const roles = [
    ['Artwork 02 / KEY VISUAL 02', artworkTwo],
    ['Artwork 03 / KEY VISUAL 03', artworkThree],
    ...characterSheets.map((asset, index) => [`Character Sheet ${String(index + 1).padStart(2, '0')}`, asset]),
    ['Costume Detail', costumeDetailAsset],
    ...portraitStudies.map((asset, index) => [`Portrait Study ${String(index + 1).padStart(2, '0')}`, asset]),
    ...selectedWorks.map((asset, index) => [`Selected Work ${String(index + 1).padStart(2, '0')}`, asset]),
    ...additionalCharacterDesigns.map((asset, index) => [`Additional Character Design ${String(index + 1).padStart(2, '0')}`, asset]),
  ]
  return roles.map(([role, asset]) => ({ role, asset }))
}

const intentionalReuse = new Map([
  [costumeDetailAsset.src, ['Character Sheet 03', 'Costume Detail']],
])

function sameRoles(actual, expected) {
  return actual.length === expected.length && [...actual].sort().every((role, index) => role === [...expected].sort()[index])
}

export async function auditPortfolioAssets() {
  const entries = activeRoleEntries()
  const grouped = new Map()
  const candidates = new Map()
  const errors = []

  for (const { role, asset } of entries) {
    if (!asset || typeof asset.src !== 'string') {
      errors.push(`${role}: manifest asset or src is missing`)
      continue
    }
    if (!asset.src.startsWith('/assets/approved/')) errors.push(`${role}: active src must stay in /assets/approved/ (${asset.src})`)
    if (!asset.alt || !asset.alt.trim()) errors.push(`${role}: alt text is empty`)
    if (!asset.filename || !asset.resolution) errors.push(`${role}: filename or resolution metadata is missing`)

    const relative = asset.src.replace(/^\/assets\/approved\//, '')
    const target = path.resolve(approvedRoot, relative)
    if (!target.startsWith(`${approvedRoot}${path.sep}`)) errors.push(`${role}: src escapes approved asset directory (${asset.src})`)
    else {
      try { await access(target) } catch { errors.push(`${role}: file not found (${target})`) }
    }

    if (!grouped.has(asset.src)) grouped.set(asset.src, [])
    grouped.get(asset.src).push(role)

    for (const candidate of [asset.src, ...srcSetCandidates(asset.srcSet)]) {
      if (!candidates.has(candidate)) candidates.set(candidate, [])
      candidates.get(candidate).push(role)
    }
  }

  for (const [candidate, roles] of candidates) {
    if (!candidate.startsWith('/assets/approved/')) {
      errors.push(`${roles.join(' / ')}: runtime candidate must use the production root base (${candidate})`)
      continue
    }
    if (/huang-guotai|huangguotai|\/visual-archive-portfolio\//i.test(candidate)) errors.push(`${roles.join(' / ')}: incorrect deployment base in runtime candidate (${candidate})`)

    const publicRelative = candidate.replace(/^\//, '')
    const source = path.resolve(publicRoot, publicRelative)
    if (!source.startsWith(`${publicRoot}${path.sep}`)) {
      errors.push(`${roles.join(' / ')}: runtime candidate escapes public directory (${candidate})`)
      continue
    }
    try {
      if (!await hasExactCase(publicRoot, publicRelative)) errors.push(`${roles.join(' / ')}: filename case mismatch (${candidate})`)
      const sourceStat = await stat(source)
      if (!sourceStat.isFile() || sourceStat.size === 0) errors.push(`${roles.join(' / ')}: candidate is empty or not a file (${candidate})`)
      const sourceBuffer = await readFile(source)
      if (sourceBuffer.subarray(0, 160).toString('utf8').includes('git-lfs')) errors.push(`${roles.join(' / ')}: Git LFS pointer found instead of binary (${candidate})`)
      if (path.extname(source).toLowerCase() === '.webp' && !(sourceBuffer.subarray(0, 4).toString('ascii') === 'RIFF' && sourceBuffer.subarray(8, 12).toString('ascii') === 'WEBP')) errors.push(`${roles.join(' / ')}: invalid WebP binary (${candidate})`)
      const repoRelative = path.relative(root, source)
      if (gitMetadataAvailable && !isTracked(repoRelative) && !reviewPendingRuntimeAssets.has(repoRelative.replaceAll(path.sep, '/'))) {
        errors.push(`${roles.join(' / ')}: runtime candidate is not tracked by Git (${candidate})`)
      }

      if (requireDist) {
        const distRoot = path.join(root, 'dist')
        const built = path.resolve(distRoot, publicRelative)
        try {
          if (!await hasExactCase(distRoot, publicRelative)) errors.push(`${roles.join(' / ')}: built filename case mismatch (${candidate})`)
          const builtStat = await stat(built)
          if (!builtStat.isFile() || builtStat.size === 0) errors.push(`${roles.join(' / ')}: built candidate is empty or missing (${candidate})`)
          const builtBuffer = await readFile(built)
          if (builtBuffer.length !== sourceBuffer.length || sha256(builtBuffer) !== sha256(sourceBuffer)) errors.push(`${roles.join(' / ')}: built candidate differs from public source (${candidate})`)
        } catch {
          errors.push(`${roles.join(' / ')}: candidate omitted from dist (${candidate})`)
        }
      }
    } catch {
      errors.push(`${roles.join(' / ')}: runtime candidate file not found (${candidate})`)
    }
  }

  for (const [role, publicRelative] of directRuntimeAssets) {
    const source = path.resolve(publicRoot, publicRelative)
    if (!source.startsWith(`${publicRoot}${path.sep}`)) {
      errors.push(`${role}: runtime path escapes public directory (${publicRelative})`)
      continue
    }
    try {
      if (!await hasExactCase(publicRoot, publicRelative)) errors.push(`${role}: filename case mismatch (${publicRelative})`)
      const sourceStat = await stat(source)
      if (!sourceStat.isFile() || sourceStat.size === 0) errors.push(`${role}: runtime asset is empty (${publicRelative})`)
      const sourceBuffer = await readFile(source)
      if (path.extname(source).toLowerCase() === '.png' && sourceBuffer.subarray(1, 4).toString('ascii') !== 'PNG') errors.push(`${role}: invalid PNG binary (${publicRelative})`)
      if (requireDist) {
        const built = path.resolve(root, 'dist', publicRelative)
        const builtBuffer = await readFile(built)
        if (builtBuffer.length !== sourceBuffer.length || sha256(builtBuffer) !== sha256(sourceBuffer)) errors.push(`${role}: built asset differs from public source (${publicRelative})`)
      }
    } catch {
      errors.push(`${role}: runtime asset missing from ${requireDist ? 'public or dist' : 'public'} (${publicRelative})`)
    }
  }

  if (requireDist) {
    try {
      const distRoot = path.join(root, 'dist')
      const bundleFiles = (await readdir(path.join(distRoot, 'assets'))).filter((file) => /\.(js|css)$/i.test(file))
      const distIndex = await readFile(path.join(distRoot, 'index.html'), 'utf8')
      const generated = [distIndex, ...await Promise.all(bundleFiles.map((file) => readFile(path.join(distRoot, 'assets', file), 'utf8')))].join('\n')
      const usesRootBase = /(?:src|href)=["']\/assets\//.test(distIndex)
      const usesPagesFallback = /(?:src|href)=["']\/visual-archive-portfolio\/assets\//.test(distIndex)
      if (usesRootBase === usesPagesFallback) errors.push('dist: unable to identify exactly one approved deployment base')
      else detectedDistBase = usesPagesFallback ? '/visual-archive-portfolio/' : '/'
      if (/huang-guotai|huangguotai/i.test(generated)) errors.push('dist: generated runtime URL contains a personal-name slug')
      for (const candidate of candidates.keys()) if (!generated.includes(path.basename(candidate))) errors.push(`dist: generated runtime bundle does not reference candidate ${candidate}`)
    } catch (error) {
      errors.push(`dist: unable to inspect generated runtime URLs (${error.message})`)
    }
  }

  for (const [src, roles] of grouped) {
    if (roles.length < 2) continue
    const allowed = intentionalReuse.get(src)
    if (!allowed || !sameRoles(roles, allowed)) errors.push(`Unexpected duplicate active source ${src}: ${roles.join(', ')}`)
  }

  const sourceFiles = await Promise.all(['src/main.jsx', 'src/styles.css', 'src/gallery.css'].map(async (file) => [file, await readFile(path.join(root, file), 'utf8')]))
  for (const [file, source] of sourceFiles) if (source.includes('/assets/approved/')) errors.push(`${file}: active asset path is duplicated outside artworkManifest.js`)
  for (const [file, source] of sourceFiles) if (source.includes('#breakdown') || source.includes('Character Breakdown')) errors.push(`${file}: public Character Breakdown reference remains`)

  if (errors.length) throw new Error(`Portfolio asset audit failed:\n- ${errors.join('\n- ')}`)

  const summary = {
    activeUniqueAssets: grouped.size,
    activeRoleReferences: entries.length,
    runtimeCandidates: candidates.size,
    directRuntimeAssets: directRuntimeAssets.length,
    distValidated: requireDist,
    detectedDistBase,
    gitTrackingValidated: gitMetadataAvailable,
    intentionallyUnused: [
      'hero-blue-dragon.png',
      'character-illustration-green.png',
      'portrait-02.png',
      'portrait-03.png',
      'portrait-blue-sky.png',
      'portrait-red-profile.png',
      'character-sheet-tianzi.png',
      'title-architecture.png',
      'contact-hands-tech-1672.webp',
    ],
    roles: Object.fromEntries([...grouped].map(([src, roles]) => [src, roles])),
  }
  console.log(`Asset audit passed: ${summary.activeUniqueAssets} active files / ${summary.activeRoleReferences} role references.`)
  console.log(`- runtime src/srcSet candidates: ${summary.runtimeCandidates}${requireDist ? ' (public + dist)' : ' (public source)'}`)
  console.log(`- D10.01 direct runtime assets: ${summary.directRuntimeAssets}${requireDist ? ' (public + dist)' : ' (public source)'}`)
  console.log(`- Git tracking: ${gitMetadataAvailable ? 'validated' : 'not available; D10.01 baseline inventory is the rollback authority'}`)
  if (requireDist) console.log(`- detected deployment base: ${summary.detectedDistBase}`)
  for (const [src, roles] of grouped) console.log(`- ${src}: ${roles.join(' / ')}`)
  console.log(`- intentionally unused: ${summary.intentionallyUnused.join(', ')}`)
  return summary
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  auditPortfolioAssets().catch((error) => { console.error(error.message); process.exitCode = 1 })
}

