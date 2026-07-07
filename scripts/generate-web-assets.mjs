import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const approvedRoot = path.join(root, 'public', 'assets', 'approved')
const sourceRoot = path.join(root, 'source-assets', 'v3-42', 'approved')
const outputRoot = path.join(approvedRoot, 'web')

const source = (filename) => path.join(sourceRoot, filename)
const output = (filename) => path.join(outputRoot, filename)

const jobs = [
  ['hero-artwork-primary-v3.png', 'kv01', [1800, 2400], 88],
  ['hero-eclipse-v3.png', 'kv02', [1800, 2400], 88],
  ['selected-illustration-green.png', 'kv03', [1800, 2400], 88],
  ['hero-artwork-primary-v3.png', 'thumb-contents-01', [900], 84],
  ['hero-eclipse-v3.png', 'thumb-contents-02', [900], 84],
  ['selected-illustration-green.png', 'thumb-contents-03', [900], 84],
  ['character-sheet-01.png', 'thumb-contents-04', [900], 86],
  ['character-sheet-03.png', 'thumb-contents-05', [900], 86],
  ['portrait-white-hair.png', 'thumb-contents-06', [900], 84],
  ['character-design-tianzi.png', 'thumb-contents-07', [900], 86],
  ['title-architecture-00.png', 'title-architecture', [1672], 88],
  ['contact-hands-tech.png', 'contact-hands-tech', [1672], 88],
  ['character-sheet-01.png', 'character-sheet-01', [1600], 90],
  ['character-sheet-02.png', 'character-sheet-02', [1600], 90],
  ['character-sheet-03.png', 'character-sheet-03', [1600], 90],
  ['character-sheet-04.png', 'character-sheet-04', [1800], 90],
  ['portrait-01.png', 'portrait-01', [1600], 88],
  ['portrait-white-hair.png', 'portrait-white-hair', [1600], 88],
  ['character-presentation-purple.png', 'character-presentation-purple', [1600], 90],
  ['study-red-profile.png', 'study-red-profile', [1600], 88],
  ['study-blue-sky.png', 'study-blue-sky', [1600], 88],
  ['character-design-14.jpg', 'character-design-14', [1448], 90],
  ['character-design-15.jpg', 'character-design-15', [1448], 90],
  ['character-design-16.png', 'character-design-16', [1355], 90],
  ['character-design-tianzi.png', 'character-design-tianzi', [1536], 90],
]

async function makeWebp(input, name, width, quality) {
  const destination = output(`${name}-${width}.webp`)
  const image = sharp(input, { failOn: 'none' }).rotate()
  const metadata = await image.metadata()
  const resizeWidth = Math.min(width, metadata.width || width)
  await image
    .resize({ width: resizeWidth, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(destination)
  const optimizedMeta = await sharp(destination).metadata()
  return {
    file: path.relative(root, destination).replaceAll(path.sep, '/'),
    width: optimizedMeta.width,
    height: optimizedMeta.height,
  }
}

await mkdir(outputRoot, { recursive: true })

const manifest = {}
for (const [sourceFile, name, widths, quality] of jobs) {
  const input = source(sourceFile)
  manifest[name] = []
  for (const width of widths) manifest[name].push(await makeWebp(input, name, width, quality))
}

console.log(JSON.stringify(manifest, null, 2))
