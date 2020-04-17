const fetch = require('node-fetch')

const DEFAULT_BASE64_WIDTH = 30
const DEFAULT_FIXED_WIDTH = 400
const DEFAULT_FLUID_MAX_WIDTH = 2560

/**
 * @todo determine image format instead of hardcoding png
 */
const getBase64 = async (url) => {
  const res = await fetch(url)
  if (res.status !== 200) {
    console.error('Failed to fetch image')
  }
  const imageData = await res.buffer()
  const arrayBuffer = Buffer.from(imageData).toString('base64')
  return `data:image/pngbase64,${arrayBuffer}`
}

const getImageUrl = ({
  public_id,
  cloudName,
  transformations = [],
  chained = [],
  defaults = ['f_auto', 'q_auto'],
  version = false
}) => {
  const baseURL = 'https://res.cloudinary.com/'
  const allTransformations = [transformations.concat(defaults).join()]
    .concat(chained)
    .join('/')

  const imagePath = [
    cloudName,
    '/image/upload/',
    allTransformations,
    version ? `/v${version}/` : '/',
    public_id
  ].join('').replace('//', '/')

  return baseURL + imagePath
}

const getAspectRatio = (transformations, originalAspectRatio) => {
  const arTransform = transformations.find(t => t.startsWith('ar_'))
  if (!arTransform) {
    return originalAspectRatio
  }

  const newAspectRatio = arTransform.replace('ar_', '')
  if (newAspectRatio.indexOf(':') === -1) {
    return Number(newAspectRatio)
  }

  const [w, h] = newAspectRatio.split(':').map(Number)

  return w / h
}

const getSharedImageData = async ({
  public_id,
  version,
  cloudName,
  base64Transformations,
  transformations,
  base64Width,
  chained
}) => {
  const b64Transformations = base64Transformations || transformations
  const base64URL = getImageUrl({
    transformations: b64Transformations.concat(`w_${base64Width}`),
    public_id,
    version,
    cloudName,
    chained
  })
  const base64 = await getBase64(base64URL)

  const src = getImageUrl({
    public_id,
    version,
    cloudName,
    transformations,
    chained
  })

  return { base64, src }
}

exports.getFixedImageObject = async ({
  public_id,
  cloudName,
  originalHeight,
  originalWidth,
  version = false,
  width = DEFAULT_FIXED_WIDTH,
  base64Width = DEFAULT_BASE64_WIDTH,
  base64Transformations = null,
  transformations = [],
  chained = []
}) => {
  const { base64, src } = await getSharedImageData({
    public_id,
    version,
    cloudName,
    base64Transformations,
    transformations,
    base64Width,
    chained
  })

  const aspectRatio = getAspectRatio(
    transformations,
    originalWidth / originalHeight
  )

  const sizes = [1, 1.5, 2, 3].map(size => ({
    resolution: size,
    width: width * size
  }))

  const srcSet = sizes
    .filter(size => size.width <= originalWidth)
    .map(size => {
      // Get URL for each image including user-defined transformations.
      const url = getImageUrl({
        // Add the size at the end to override width for srcSet support.
        transformations: transformations.concat(`w_${size.width}`),
        chained,
        public_id,
        version,
        cloudName
      })

      return `${url} ${size.resolution}x`
    })
    .join()

  return {
    base64,
    height: width / aspectRatio,
    src,
    srcSet,
    width,
  }
}

exports.getFluidImageObject = async ({
  public_id,
  cloudName,
  originalWidth,
  originalHeight,
  breakpoints,
  version = false,
  maxWidth = DEFAULT_FLUID_MAX_WIDTH,
  base64Width = DEFAULT_BASE64_WIDTH,
  base64Transformations = null,
  transformations = [],
  chained = []
}) => {
  const aspectRatio = getAspectRatio(
    transformations,
    originalWidth / originalHeight
  )
  const max = Math.min(maxWidth, originalWidth)
  const sizes = `(max-width: ${max}px) 100vw, ${max}px`
  const { base64, src } = await getSharedImageData({
    public_id,
    version,
    cloudName,
    breakpoints,
    base64Transformations,
    transformations,
    base64Width,
    chained
  })

  const cleaned = breakpoints
    .concat(max) // make sure we get the max size
    .filter(w => w <= max) // don’t add larger sizes
    .sort((a, b) => a - b) // sort in ascending order

  const deduped = [...new Set(cleaned)]

  const srcSet = deduped
    .map(breakpointWidth => {
      // Get URL for each image including user-defined transformations.
      const url = getImageUrl({
        // Add the size at the end to override width for srcSet support.
        transformations: transformations.concat(`w_${breakpointWidth}`),
        chained,
        public_id,
        version,
        cloudName
      })

      return `${url} ${breakpointWidth}w`
    })
    .join()

  return {
    aspectRatio,
    base64,
    sizes,
    src,
    srcSet
  }
}
