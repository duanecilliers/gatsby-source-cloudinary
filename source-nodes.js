const { newCloudinary, getResourceOptions } = require('./cloudinary')

const type = 'CloudinaryMedia'
const imageType = 'CloudinaryMediaImage'

/**
 * Get media data for gatsby.createNode
 *
 * @param {Object} gatsby Gatsby helpers
 * @param {Object} media Cloudinary resource
 * @param {String} media.public_id Public ID
 * @param {String} media.format Media format EG: 'png'
 * @param {Number} media.height Media height
 * @param {Number} media.width Media width
 * @param {String} media.resouce_type Media resource type EG: 'image', 'video' etc..?
 * @param {String} media.type Media type EG: 'upload'
 * @param {String} media.url Media URL
 * @param {String} media.version version Media version
 * @param {String} media.bytes Media size in btes
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

module.exports = async function sourceNodes (gatsby, options) {
  const cloudinary = newCloudinary(options)
  const resourceOptions = getResourceOptions(options)

  const { cloudName } = options

  const { max_results, results_per_page } = resourceOptions;

  let nextCursor = null;
  let limit = max_results;
  let resultsPerPage = results_per_page ? results_per_page : 500;

  do {
    try {
      const result = await cloudinary.api.resources({
        ...resourceOptions,
        max_results: limit < resultsPerPage ? limit : resultsPerPage,
        next_cursor: nextCursor
      })

      const hasResources = (result && result.resources && result.resources.length)

      if (!hasResources) {
        console.warn('\n ~Yikes! No nodes created because no Cloudinary resources found. Try a different query?')
        return
      }

      result.resources.forEach(async (resource) => {

        const nodeData = getNodeData(gatsby, resource)
        await gatsby.actions.createNode(nodeData)

        const { id, public_id, version, height, width } = nodeData
        const node = gatsby.getNode(id)

        if (nodeData.resource_type === 'image') {
          const imageNodeData = {
            id: gatsby.createNodeId(`cloudinary-media-image-${id}`),
            public_id,
            cloudName,
            version,
            parent: id,
            originalHeight: height,
            originalWidth: width,
            breakpoints: [320, 640, 1280, 2560],
            internal: {
              type: imageType,
              contentDigest: gatsby.createContentDigest(gatsby.getNode(id))
            }
          }

          await gatsby.actions.createNode(imageNodeData)
          gatsby.actions.createParentChildLink({ parent: node, child: imageNodeData })
        }
      })

      console.info(`Added ${hasResources} CloudinaryMedia ${hasResources > 1 ? 'nodes' : 'node'}`)

      nextCursor = result.next_cursor;
      limit = limit - result.resources.length;
    } catch (error) {
      console.error(error)
      return
    }
  } while (nextCursor && limit > 0);
}
