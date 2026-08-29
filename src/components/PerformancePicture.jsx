const performanceBase = `${import.meta.env.BASE_URL}assets/performance-v1/`

export function buildPerformanceSrcSet(key, widths, format) {
  return widths
    .map((width) => `${performanceBase}${key}/${key}-${width}.${format} ${width}w`)
    .join(', ')
}

export function performanceWidthsForAsset(asset) {
  const [width] = asset.resolution.split(/\s*[x×]\s*/).map(Number)
  return [...new Set([720, 1280, width].filter((candidate) => candidate <= width))]
}

export function performanceKeyForAsset(asset) {
  return asset.filename.split('/').pop().replace(/\.[^.]+$/, '')
}

export function performanceImageAttrs(asset, { disabled = false } = {}) {
  if (disabled) {
    return {
      src: asset.src,
      srcSet: asset.srcSet,
      sizes: asset.sizes,
    }
  }
  return {
    src: asset.src,
    srcSet: buildPerformanceSrcSet(
      performanceKeyForAsset(asset),
      performanceWidthsForAsset(asset),
      'webp',
    ),
    sizes: asset.sizes,
    'data-performance-fallback': asset.src,
    onError: retryOriginalImageOnce,
  }
}

export function retryOriginalImageOnce(event) {
  const image = event.currentTarget
  if (!(image instanceof HTMLImageElement) || image.dataset.performanceRetried === 'true') return
  const fallback = image.dataset.performanceFallback
  if (!fallback) return
  image.dataset.performanceRetried = 'true'
  image.closest('picture')?.querySelectorAll('source').forEach((source) => {
    source.removeAttribute('srcset')
  })
  image.removeAttribute('srcset')
  image.removeAttribute('sizes')
  image.src = fallback
}

export function PerformancePicture({
  sourceKey,
  widths,
  fallback,
  sizes,
  disabled = false,
  pictureClassName = 'performance-picture',
  ...imageProps
}) {
  if (disabled) {
    return <img {...imageProps} src={fallback} />
  }
  return <picture className={pictureClassName}>
    <source
      type="image/avif"
      srcSet={buildPerformanceSrcSet(sourceKey, widths, 'avif')}
      sizes={sizes}
    />
    <source
      type="image/webp"
      srcSet={buildPerformanceSrcSet(sourceKey, widths, 'webp')}
      sizes={sizes}
    />
    <img
      {...imageProps}
      src={fallback}
      sizes={sizes}
      data-performance-fallback={fallback}
      onError={retryOriginalImageOnce}
    />
  </picture>
}
