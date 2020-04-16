const fetch = require('node-fetch')
const { newCloudinary, getResourceOptions } = require('./utils')
const type = 'CloudinaryMedia'
const imageType = 'CloudinaryMediaImage'

/**
 * @todo document
 */
const getNodeData = (gatsby, media) => {
  return {
    ...media,
    id: gatsby.createNodeId(`cloudinary-media-${media.public_id}`),
    parent: null,
    internal: {
      type,
      content: JSON.stringify(media),
      contentDigest: gatsby.createContentDigest(media)
    }
  }
}

/**
 * Get data to generate a node for the image
 *
 * @param {Object} gatsby Gatsby actions https://www.gatsbyjs.org/docs/actions
 * @param {string} parent CloudinaryMedia node id
 * @param {Object} image Image fields
 * @param {string} image.aspectRatio Gatsby image aspect ratio
 * @param {string} image.base64 Gatsby image base64
 * @param {string} image.sizes Gatsby image sizes
 * @param {string} image.src Gatsby image src
 * @param {string} image.srcSet Gatsby image srcSet
 */
const getImageNodeData = (gatsby, parent, id, image) => {
  return {
    ...image,
    id: gatsby.createNodeId(`cloudinary-media-image-${id}`),
    parent,
    internal: {
      type: imageType,
      content: JSON.stringify(image),
      contentDigest: gatsby.createContentDigest(image)
    }
  }
}

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
  return `data:image/png;base64,${arrayBuffer}`
}

/**
 * @todo document
 */
const getImage = (
  imageData,
  cloudName,
  transformations = [],
  defaultTransformations = ['q_auto', 'f_auto']
) => {
  const baseUrl = 'https://res.cloudinary.com/'
  const imagePath = [
    cloudName,
    '/image/upload/',
    [...defaultTransformations, ...transformations].join(','),
    `/v${imageData.version}/`,
    imageData.public_id
  ].join('')
  return baseUrl + imagePath
}

/**
 * @todo document
 */
const createCloudinaryNodes = (gatsby, cloudinary, resourceOptions, options) => {
  const { cloudName } = options

  return cloudinary.api.resources(resourceOptions, (error, result) => {
    const hasResources = (result && result.resources && result.resources.length)

    if (error) {
      console.error(error)
      return
    }

    if (!hasResources) {
      console.warn('\n ~Yikes! No nodes created because no Cloudinary resources found. Try a different query?')
      return
    }

    result.resources.forEach(async (resource) => {
      const nodeData = getNodeData(gatsby, resource)
      await gatsby.actions.createNode(nodeData)

      if (nodeData.resource_type === 'image') {
        /** @todo use config? */
        const srcSetWidths = [160, 320, 640, 1280, 2560]
        const base64Url = getImage(nodeData, cloudName, ['w_30'])
        const base64 = await getBase64(base64Url)
        const sizes = `(max-width: ${srcSetWidths.slice(-1)[0]}px) 100vw, ${srcSetWidths.slice(-1)[0]}`
        const srcSet = srcSetWidths.map(width => getImage(nodeData, cloudName, [`w_${width}`])).join(', ')

        const imageNodeData = getImageNodeData(gatsby, nodeData.id, nodeData.public_id, {
          aspectRatio: nodeData.width / nodeData.height,
          base64,
          sizes,
          src: nodeData.secure_url,
          srcSet
        })

        await gatsby.actions.createNode(imageNodeData)
        gatsby.actions.createParentChildLink({ parent: nodeData, child: imageNodeData })
      }
    })

    console.info(`Added ${hasResources} CloudinaryMedia ${hasResources > 1 ? 'nodes' : 'node'}`)
  })
}

exports.createSchemaCustomization = ({
  actions: { createTypes },
  scheme,
  reporter
}) => {
  const cloudinaryTypeDefs = `
    type CloudinaryMedia implements Node {
      public_id: String!
      format: String!
      version: Int!
      resource_type: String!
      type: String!
      created_at: Date!
      bytes: Int!
      width: Int!
      height: Int!
      url: String!
      secure_url: String!
    }
    type CloudinaryMediaImage implements Node {
      aspectRatio: Float!
      base64: String!
      sizes: String!
      src: String!
      srcSet: String!
    }
  `
  createTypes(cloudinaryTypeDefs)
}

exports.sourceNodes = (gatsby, options) => {
  const cloudinary = newCloudinary(options)
  const resourceOptions = getResourceOptions(options)

  return createCloudinaryNodes(gatsby, cloudinary, resourceOptions, options)
}
