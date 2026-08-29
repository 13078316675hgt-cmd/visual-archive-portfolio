import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetDir = path.join(root, 'public', 'assets', 'approved', 'web')

const jobs = [
  ['character-design-14-1448.webp', 'character-design-14-white-1448.webp'],
  ['character-design-15-1448.webp', 'character-design-15-white-1448.webp'],
  ['character-design-16-1355.webp', 'character-design-16-white-1355.webp'],
]

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

for (const [sourceName, outputName] of jobs) {
  const source = path.join(assetDir, sourceName)
  const output = path.join(assetDir, outputName)
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset]
    const green = data[offset + 1]
    const blue = data[offset + 2]
    const maximum = Math.max(red, green, blue)
    const minimum = Math.min(red, green, blue)
    const chroma = maximum - minimum
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722

    // Only neutralize pale paper/background tones. Saturated character colors,
    // skin, dark line work, and accent colors are intentionally left untouched.
    const paleAmount = clamp((luminance - 142) / 72)
    const neutralAmount = clamp((48 - chroma) / 30)
    const amount = paleAmount * neutralAmount

    if (amount <= 0) continue

    const paperWhite = 252
    data[offset] = Math.round(red + (paperWhite - red) * amount)
    data[offset + 1] = Math.round(green + (paperWhite - green) * amount)
    data[offset + 2] = Math.round(blue + (paperWhite - blue) * amount)
  }

  await sharp(data, { raw: info })
    .webp({ quality: 94, smartSubsample: true })
    .toFile(output)

  console.log(`${sourceName} -> ${outputName}`)
}
