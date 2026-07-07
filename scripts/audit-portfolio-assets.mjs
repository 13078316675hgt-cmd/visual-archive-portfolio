import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  additionalCharacterDesigns,
  artworkManifest,
  artworkOne,
  artworkThree,
  artworkTwo,
  characterSheets,
  contactHandsTech,
  contentsChapters,
  costumeDetailAsset,
  portraitStudies,
  selectedWorks,
} from '../src/data/artworkManifest.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const approvedRoot = path.join(root, 'public', 'assets', 'approved')

function activeRoleEntries() {
  const contentsImageRoles = contentsChapters
    .filter((chapter) => chapter.type === 'image')
    .map((chapter) => [`Contents ${chapter.number} / ${chapter.title}`, chapter.asset])

  const roles = [
    ['titleBackground', artworkManifest.titleBackground],
    ['Artwork 01 / KEY VISUAL 01', artworkOne],
    ['Artwork 02 / KEY VISUAL 02', artworkTwo],
    ['Artwork 03 / KEY VISUAL 03', artworkThree],
    ['Contact Hands Tech', contactHandsTech],
    ...characterSheets.map((asset, index) => [`Character Sheet ${String(index + 1).padStart(2, '0')}`, asset]),
    ['Costume Detail', costumeDetailAsset],
    ...portraitStudies.map((asset, index) => [`Portrait Study ${String(index + 1).padStart(2, '0')}`, asset]),
    ...selectedWorks.map((asset, index) => [`Selected Work ${String(index + 1).padStart(2, '0')}`, asset]),
    ...additionalCharacterDesigns.map((asset, index) => [`Additional Character Design ${String(index + 1).padStart(2, '0')}`, asset]),
    ...contentsImageRoles,
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
  const errors = []

  for (const { role, asset } of entries) {
    if (!asset || typeof asset.src !== 'string') {
      errors.push(`${role}: manifest asset or src is missing`)
      continue
    }
    if (!asset.src.startsWith('/assets/approved/')) errors.push(`${role}: active src must stay in /assets/approved/ (${asset.src})`)
    if (!asset.alt || !asset.alt.trim()) errors.push(`${role}: alt text is empty`)
    if (!asset.filename || !asset.resolution || !asset.sourcePath) errors.push(`${role}: filename, resolution, or sourcePath metadata is missing`)

    const relative = asset.src.replace(/^\/assets\/approved\//, '')
    const target = path.resolve(approvedRoot, relative)
    if (!target.startsWith(`${approvedRoot}${path.sep}`)) errors.push(`${role}: src escapes approved asset directory (${asset.src})`)
    else {
      try { await access(target) } catch { errors.push(`${role}: file not found (${target})`) }
    }

    if (!grouped.has(asset.src)) grouped.set(asset.src, [])
    grouped.get(asset.src).push(role)
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
    intentionallyUnused: [
      'hero-blue-dragon.png',
      'character-illustration-green.png',
      'portrait-02.png',
      'portrait-03.png',
      'portrait-blue-sky.png',
      'portrait-red-profile.png',
      'character-sheet-tianzi.png',
      'title-architecture.png',
    ],
    roles: Object.fromEntries([...grouped].map(([src, roles]) => [src, roles])),
  }
  console.log(`Asset audit passed: ${summary.activeUniqueAssets} active files / ${summary.activeRoleReferences} role references.`)
  for (const [src, roles] of grouped) console.log(`- ${src}: ${roles.join(' / ')}`)
  console.log(`- intentionally unused: ${summary.intentionallyUnused.join(', ')}`)
  return summary
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  auditPortfolioAssets().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
