import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const root = process.cwd()
const publicRoot = path.join(root, 'public')
const outputRoot = path.join(publicRoot, 'assets', 'performance-v1')
const reportPath = path.join(root, 'review', 'performance', 'image-derivatives.json')

const definitions = [
  {
    key: 'home-clean',
    source: 'assets/performance-v1-source/home-approved-composite-2560x1440.png',
    widths: [960, 1800, 2560],
    quality: { avif: 78, webp: 92 },
  },
  {
    key: 'page01-original-art',
    source: 'assets/d09-19-page01/page01-original-art-crop-1515x1780.png',
    widths: [720, 1280, 1515],
    quality: { avif: 82, webp: 94 },
  },
  {
    key: 'end-page-integrated',
    source: 'assets/approved/end-page-master-integrated-v3.png',
    widths: [960, 1600, 2560],
    quality: { avif: 78, webp: 92 },
  },
  {
    key: 'directory-end',
    source: 'assets/d09-19-directory/directory-end-source.png',
    widths: [480, 960, 1672],
    quality: { avif: 78, webp: 92 },
  },
  ...Array.from({ length: 7 }, (_, index) => ({
    key: `directory-thumb-${String(index + 1).padStart(2, '0')}`,
    source: `assets/d09-19-directory/directory-thumb-${String(index + 1).padStart(2, '0')}.webp`,
    widths: [360, 720, 900],
    quality: { avif: 78, webp: 92 },
  })),
  ...[
    'kv01-1800.webp',
    'kv02-1800.webp',
    'kv03-1800.webp',
    'character-sheet-01-1600.webp',
    'character-sheet-02-1600.webp',
    'character-sheet-03-1600.webp',
    'character-sheet-04-1800.webp',
    'portrait-01-1600.webp',
    'portrait-white-hair-1600.webp',
    'character-presentation-purple-1600.webp',
    'study-red-profile-1600.webp',
    'study-blue-sky-1600.webp',
    'character-design-14-1448.webp',
    'character-design-15-1448.webp',
    'character-design-16-1355.webp',
    'character-design-tianzi-1536.webp',
  ].map((filename) => ({
    key: filename.replace(/\.[^.]+$/, ''),
    source: `assets/approved/web/${filename}`,
    widths: [720, 1280, 2560],
    quality: {
      avif: /sheet|design|presentation/i.test(filename) ? 82 : 78,
      webp: /sheet|design|presentation/i.test(filename) ? 94 : 92,
    },
  })),
]

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex').toUpperCase()
}

async function visualDifference(source, candidate, width) {
  const sourcePixels = await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const candidatePixels = await sharp(candidate)
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (
    sourcePixels.info.width !== candidatePixels.info.width
    || sourcePixels.info.height !== candidatePixels.info.height
  ) {
    return { pass: false, reason: 'dimension mismatch' }
  }
  let absoluteDifference = 0
  let maximumDifference = 0
  for (let index = 0; index < sourcePixels.data.length; index += 1) {
    const difference = Math.abs(sourcePixels.data[index] - candidatePixels.data[index])
    absoluteDifference += difference
    maximumDifference = Math.max(maximumDifference, difference)
  }
  const meanAbsoluteError = absoluteDifference / sourcePixels.data.length
  return {
    width: sourcePixels.info.width,
    height: sourcePixels.info.height,
    meanAbsoluteError: Number(meanAbsoluteError.toFixed(4)),
    normalizedSimilarity: Number((1 - meanAbsoluteError / 255).toFixed(8)),
    maximumDifference,
    pass: meanAbsoluteError <= 6.5,
  }
}

const records = []
for (const definition of definitions) {
  const source = path.join(publicRoot, definition.source)
  const metadata = await sharp(source).metadata()
  const widths = [...new Set(
    definition.widths
      .filter((width) => width <= metadata.width)
      .concat(metadata.width),
  )].sort((a, b) => a - b)
  const record = {
    key: definition.key,
    source: `/${definition.source.replaceAll('\\', '/')}`,
    sourceBytes: (await stat(source)).size,
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    sourceSha256: await sha256(source),
    derivatives: [],
  }
  const directory = path.join(outputRoot, definition.key)
  await mkdir(directory, { recursive: true })

  for (const width of widths) {
    for (const format of ['avif', 'webp']) {
      const destination = path.join(directory, `${definition.key}-${width}.${format}`)
      const pipeline = sharp(source, { failOn: 'none' })
        .resize({ width, withoutEnlargement: true })
      if (format === 'avif') {
        await pipeline.avif({
          quality: definition.quality.avif,
          effort: 5,
          chromaSubsampling: '4:4:4',
        }).toFile(destination)
      } else {
        await pipeline.webp({
          quality: definition.quality.webp,
          alphaQuality: 100,
          effort: 5,
          smartSubsample: false,
        }).toFile(destination)
      }
      record.derivatives.push({
        format,
        width,
        path: `/assets/performance-v1/${definition.key}/${path.basename(destination)}`,
        bytes: (await stat(destination)).size,
        sha256: await sha256(destination),
        comparison: await visualDifference(source, destination, width),
      })
    }
  }
  records.push(record)
  console.log(`[performance-assets] ${definition.key}: ${record.derivatives.length} derivatives`)
}

const result = {
  generatedAt: new Date().toISOString(),
  outputRoot: '/assets/performance-v1/',
  pass: records.every((record) =>
    record.derivatives.every((derivative) => derivative.comparison.pass),
  ),
  records,
}
await mkdir(path.dirname(reportPath), { recursive: true })
await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({
  pass: result.pass,
  assets: records.length,
  derivatives: records.reduce((sum, record) => sum + record.derivatives.length, 0),
  bytes: records.reduce(
    (sum, record) => sum + record.derivatives.reduce((subtotal, derivative) => subtotal + derivative.bytes, 0),
    0,
  ),
  report: path.relative(root, reportPath),
}, null, 2))
if (!result.pass) process.exitCode = 1
