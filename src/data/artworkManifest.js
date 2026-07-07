const approved = '/assets/approved/'
const web = `${approved}web/`

const buildSrcSet = (entries) => entries.map(([filename, width]) => `${web}${filename} ${width}w`).join(', ')

const asset = ({ id, filename, sourcePath, resolution, alt, label, ratio = 'portrait', src, srcSet, sizes }) => ({
  id,
  src: src || `${approved}${filename}`,
  filename,
  sourcePath,
  resolution,
  alt,
  label,
  ratio,
  srcSet,
  sizes,
})

const titleBackground = asset({
  id: 'title-architecture-00',
  filename: 'web/title-architecture-1672.webp',
  sourcePath: '作品集(1).zip / 00.png',
  resolution: '1672 x 941',
  alt: '灰白色废墟建筑、断桥和高塔场景',
  label: 'TITLE ARCHITECTURE',
  ratio: 'landscape',
  src: `${web}title-architecture-1672.webp`,
  sizes: '100vw',
})

export const artworkOne = asset({
  id: 'artwork-one',
  filename: 'web/kv01-1800.webp',
  sourcePath: '作品集(1).zip / 1.png',
  resolution: '1800 x 2326',
  alt: '黑发持剑角色与蓝黑色龙形生物、建筑和环形能量构成的竖幅角色插画',
  label: 'KEY VISUAL 01',
  src: `${web}kv01-1800.webp`,
  srcSet: buildSrcSet([
    ['kv01-1800.webp', 1800],
    ['kv01-2400.webp', 2400],
  ]),
  sizes: '(max-width: 900px) 92vw, 58vw',
})

export const artworkTwo = asset({
  id: 'artwork-two',
  filename: 'web/kv02-1800.webp',
  sourcePath: '作品集(1).zip / 2.png',
  resolution: '1800 x 2326',
  alt: '白发角色与黑白红色巨型生物形态、武器和碎石构成的竖幅角色插画',
  label: 'KEY VISUAL 02',
  src: `${web}kv02-1800.webp`,
  srcSet: buildSrcSet([
    ['kv02-1800.webp', 1800],
    ['kv02-2400.webp', 2400],
  ]),
  sizes: '(max-width: 900px) 92vw, 52vw',
})

export const artworkThree = asset({
  id: 'artwork-three',
  filename: 'web/kv03-1800.webp',
  sourcePath: '作品集(1).zip / 3.png',
  resolution: '1800 x 1996',
  alt: '绿色长发角色与绿色龙形剪影的竖幅角色插画',
  label: 'KEY VISUAL 03',
  src: `${web}kv03-1800.webp`,
  srcSet: buildSrcSet([
    ['kv03-1800.webp', 1800],
    ['kv03-2400.webp', 2400],
  ]),
  sizes: '(max-width: 900px) 92vw, 56vw',
})

export const contactHandsTech = asset({
  id: 'contact-hands-tech',
  filename: 'web/contact-hands-tech-1672.webp',
  sourcePath: 'generated asset / contact-hands-tech.png',
  resolution: '1672 x 941',
  alt: '两只手从左右两侧靠近并带有蓝色技术标记的线稿图',
  label: 'CONTACT HANDS TECH',
  ratio: 'landscape',
  src: `${web}contact-hands-tech-1672.webp`,
  sizes: '(max-width: 900px) 100vw, 88vw',
})

export const artworkManifest = {
  titleBackground,
  artworkOne,
  artworkTwo,
  artworkThree,
  contactHandsTech,
  heroPrimary: artworkOne,
  heroSecondary: artworkTwo,
}

export const characterSheets = [
  asset({
    id: 'sheet-01',
    filename: 'web/character-sheet-01-1600.webp',
    sourcePath: '作品集.zip / 8.png',
    resolution: '1536 x 1024',
    alt: '黑蓝配色角色正面侧面背面三视图',
    label: 'CHARACTER SHEET / 01',
    ratio: 'landscape',
    src: `${web}character-sheet-01-1600.webp`,
    sizes: '(max-width: 900px) 100vw, 72vw',
  }),
  asset({
    id: 'sheet-02',
    filename: 'web/character-sheet-02-1600.webp',
    sourcePath: '作品集.zip / 10.png',
    resolution: '1536 x 1024',
    alt: '紫白配色长发角色正面侧面背面三视图',
    label: 'CHARACTER SHEET / 02',
    ratio: 'landscape',
    src: `${web}character-sheet-02-1600.webp`,
    sizes: '(max-width: 900px) 100vw, 34vw',
  }),
  asset({
    id: 'sheet-03',
    filename: 'web/character-sheet-03-1600.webp',
    sourcePath: '作品集.zip / 12.png',
    resolution: '1408 x 1117',
    alt: '黑白红配色兜帽角色正面侧面背面三视图',
    label: 'CHARACTER SHEET / 03',
    ratio: 'landscape',
    src: `${web}character-sheet-03-1600.webp`,
    sizes: '(max-width: 900px) 100vw, 50vw',
  }),
  asset({
    id: 'sheet-04',
    filename: 'web/character-sheet-04-1800.webp',
    sourcePath: '作品集.zip / 13.png',
    resolution: '1800 x 1761',
    alt: '黑金配色白发角色正面侧面背面三视图',
    label: 'CHARACTER SHEET / 04',
    ratio: 'square',
    src: `${web}character-sheet-04-1800.webp`,
    sizes: '(max-width: 900px) 100vw, 34vw',
  }),
]

export const costumeDetailAsset = characterSheets.find((item) => item.id === 'sheet-03')

export const portraitStudies = [
  asset({
    id: 'portrait-01',
    filename: 'web/portrait-01-1600.webp',
    sourcePath: '作品集.zip / 4.png',
    resolution: '1600 x 2400',
    alt: '白发持剑角色半身肖像',
    label: 'PORTRAIT STUDY / 01',
    src: `${web}portrait-01-1600.webp`,
    sizes: '(max-width: 900px) 100vw, 42vw',
  }),
  asset({
    id: 'portrait-white-hair',
    filename: 'web/portrait-white-hair-1600.webp',
    sourcePath: '作品集(1).zip / 6.png',
    resolution: '1600 x 1126',
    alt: '白发红角角色横向半身肖像',
    label: 'PORTRAIT STUDY / 02',
    ratio: 'landscape',
    src: `${web}portrait-white-hair-1600.webp`,
    sizes: '(max-width: 900px) 100vw, 44vw',
  }),
]

export const selectedWorks = [
  asset({
    id: 'character-presentation-purple',
    filename: 'web/character-presentation-purple-1600.webp',
    sourcePath: '作品集(1).zip / 11.png',
    resolution: '1600 x 1879',
    alt: '紫白配色角色展示页与配色说明',
    label: 'CHARACTER PRESENTATION',
    src: `${web}character-presentation-purple-1600.webp`,
    sizes: '(max-width: 900px) 100vw, 38vw',
  }),
  asset({
    id: 'study-red-profile',
    filename: 'web/study-red-profile-1600.webp',
    sourcePath: '作品集(1).zip / 5.png',
    resolution: '1600 x 1067',
    alt: '浅绿色背景中的红发侧脸角色肖像',
    label: 'IMAGE STUDY / RED PROFILE',
    ratio: 'landscape',
    src: `${web}study-red-profile-1600.webp`,
    sizes: '(max-width: 900px) 100vw, 38vw',
  }),
  asset({
    id: 'study-blue-sky',
    filename: 'web/study-blue-sky-1600.webp',
    sourcePath: '作品集(1).zip / 7.png',
    resolution: '1600 x 1067',
    alt: '蓝天雪山背景下的白发角色横向肖像',
    label: 'IMAGE STUDY / BLUE SKY',
    ratio: 'landscape',
    src: `${web}study-blue-sky-1600.webp`,
    sizes: '(max-width: 900px) 100vw, 38vw',
  }),
]

export const additionalCharacterDesigns = [
  asset({
    id: 'design-14',
    filename: 'web/character-design-14-1448.webp',
    sourcePath: '作品集(1).zip / 14.jpg',
    resolution: '1448 x 1086',
    alt: '黑白金配色女性角色三视图设定',
    label: '14 / CHARACTER DESIGN',
    ratio: 'landscape',
    src: `${web}character-design-14-1448.webp`,
    sizes: '(max-width: 900px) 100vw, 44vw',
  }),
  asset({
    id: 'design-15',
    filename: 'web/character-design-15-1448.webp',
    sourcePath: '作品集(1).zip / 15.jpg',
    resolution: '1448 x 1086',
    alt: '黑白蓝配色短发角色三视图设定',
    label: '15 / CHARACTER DESIGN',
    ratio: 'landscape',
    src: `${web}character-design-15-1448.webp`,
    sizes: '(max-width: 900px) 100vw, 44vw',
  }),
  asset({
    id: 'design-16',
    filename: 'web/character-design-16-1355.webp',
    sourcePath: '作品集(1).zip / 16.png',
    resolution: '1355 x 1161',
    alt: '白橙配色角色三视图设定',
    label: '16 / CHARACTER DESIGN',
    ratio: 'landscape',
    src: `${web}character-design-16-1355.webp`,
    sizes: '(max-width: 900px) 100vw, 44vw',
  }),
  asset({
    id: 'design-tianzi',
    filename: 'web/character-design-tianzi-1536.webp',
    sourcePath: '作品集(1).zip / 天子三视图.png',
    resolution: '1536 x 1024',
    alt: '蓝白铠甲男性角色正面侧面背面三视图',
    label: 'TIANZI / CHARACTER DESIGN',
    ratio: 'landscape',
    src: `${web}character-design-tianzi-1536.webp`,
    sizes: '(max-width: 900px) 100vw, 44vw',
  }),
]

const contentsArtworkOne = asset({
  id: 'contents-artwork-one',
  filename: 'web/thumb-contents-01-900.webp',
  sourcePath: '作品集(1).zip / 1.png',
  resolution: '900 x 1163',
  alt: artworkOne.alt,
  label: 'KEY VISUAL 01',
  src: `${web}thumb-contents-01-900.webp`,
  sizes: '(max-width: 900px) 100vw, 18vw',
})
const contentsArtworkTwo = asset({
  id: 'contents-artwork-two',
  filename: 'web/thumb-contents-02-900.webp',
  sourcePath: '作品集(1).zip / 2.png',
  resolution: '900 x 1163',
  alt: artworkTwo.alt,
  label: 'KEY VISUAL 02',
  src: `${web}thumb-contents-02-900.webp`,
  sizes: '(max-width: 900px) 100vw, 18vw',
})
const contentsArtworkThree = asset({
  id: 'contents-artwork-three',
  filename: 'web/thumb-contents-03-900.webp',
  sourcePath: '作品集(1).zip / 3.png',
  resolution: '900 x 998',
  alt: artworkThree.alt,
  label: 'KEY VISUAL 03',
  src: `${web}thumb-contents-03-900.webp`,
  sizes: '(max-width: 900px) 100vw, 18vw',
})
const contentsSheetOne = asset({
  id: 'contents-sheet-01',
  filename: 'web/thumb-contents-04-900.webp',
  sourcePath: '作品集.zip / 8.png',
  resolution: '900 x 600',
  alt: characterSheets[0].alt,
  label: 'CHARACTER SHEETS',
  ratio: 'landscape',
  src: `${web}thumb-contents-04-900.webp`,
  sizes: '(max-width: 900px) 100vw, 18vw',
})
const contentsCostumeDetail = asset({
  id: 'contents-costume-detail',
  filename: 'web/thumb-contents-05-900.webp',
  sourcePath: '作品集.zip / 12.png',
  resolution: '900 x 714',
  alt: costumeDetailAsset.alt,
  label: 'COSTUME DETAIL',
  ratio: 'landscape',
  src: `${web}thumb-contents-05-900.webp`,
  sizes: '(max-width: 900px) 100vw, 18vw',
})
const contentsPortraitStudy = asset({
  id: 'contents-portrait-white-hair',
  filename: 'web/thumb-contents-06-900.webp',
  sourcePath: '作品集(1).zip / 6.png',
  resolution: '900 x 633',
  alt: portraitStudies[1].alt,
  label: 'PORTRAIT STUDIES',
  ratio: 'landscape',
  src: `${web}thumb-contents-06-900.webp`,
  sizes: '(max-width: 900px) 100vw, 18vw',
})
const contentsAdditionalDesign = asset({
  id: 'contents-design-tianzi',
  filename: 'web/thumb-contents-07-900.webp',
  sourcePath: '作品集(1).zip / 天子三视图.png',
  resolution: '900 x 600',
  alt: additionalCharacterDesigns.find((item) => item.id === 'design-tianzi').alt,
  label: 'ADDITIONAL CHARACTER DESIGNS',
  ratio: 'landscape',
  src: `${web}thumb-contents-07-900.webp`,
  sizes: '(max-width: 900px) 100vw, 18vw',
})

export const contentsChapters = [
  {
    number: '01',
    title: 'KEY VISUAL 01',
    subtitle: 'CHARACTER ILLUSTRATION',
    href: '#key-visual-01',
    type: 'image',
    asset: contentsArtworkOne,
    objectPosition: '50% 46%',
  },
  {
    number: '02',
    title: 'KEY VISUAL 02',
    subtitle: 'CHARACTER ILLUSTRATION',
    href: '#key-visual-02',
    type: 'image',
    asset: contentsArtworkTwo,
    objectPosition: '50% 48%',
  },
  {
    number: '03',
    title: 'KEY VISUAL 03',
    subtitle: 'CHARACTER ILLUSTRATION',
    href: '#key-visual-03',
    type: 'image',
    asset: contentsArtworkThree,
    objectPosition: '50% 46%',
  },
  {
    number: '04',
    title: 'CHARACTER SHEETS',
    subtitle: 'TURNAROUND DESIGN',
    href: '#character-sheets',
    type: 'image',
    asset: contentsSheetOne,
    objectPosition: '50% 50%',
  },
  {
    number: '05',
    title: 'COSTUME DETAIL',
    subtitle: 'LAYER / ORNAMENT',
    href: '#costume-detail',
    type: 'image',
    asset: contentsCostumeDetail,
    objectPosition: '50% 50%',
  },
  {
    number: '06',
    title: 'PORTRAIT STUDIES',
    subtitle: 'IDENTITY / EXPRESSION',
    href: '#portrait-studies',
    type: 'image',
    asset: contentsPortraitStudy,
    objectPosition: '62% 46%',
  },
  {
    number: '07',
    title: 'ADDITIONAL CHARACTER DESIGNS',
    subtitle: 'TECHNICAL SHEETS',
    href: '#additional-designs',
    type: 'image',
    asset: contentsAdditionalDesign,
    objectPosition: '50% 50%',
  },
  {
    number: '08',
    title: 'RESUME',
    subtitle: 'CHARACTER CONCEPT ARTIST',
    href: '#resume-contact-resume',
    type: 'text',
    lines: ['RESUME', 'CHARACTER CONCEPT ARTIST'],
  },
  {
    number: '09',
    title: 'CONTACT',
    subtitle: 'EMAIL / WECHAT',
    href: '#resume-contact-contact',
    type: 'text',
    lines: ['CONTACT', 'EMAIL / WECHAT'],
  },
  {
    number: '10',
    title: 'BACK TO TOP',
    subtitle: 'RETURN TO TITLE',
    href: '#title',
    type: 'text',
    lines: ['BACK TO TOP', 'RETURN TO TITLE'],
  },
]
