const { getFixedImageObject, getFluidImageObject } = require('./get-image-objects')

module.exports = function createResolvers ({ createResolvers, reporter }) {
  const resolvers = {
    CloudinaryMediaImage: {
      fixed: {
        type: 'CloudinaryMediaImageFixed!',
        resolve: (
          { public_id, version, cloudName, originalHeight, originalWidth },
          {
            base64Width,
            base64Transformations,
            width,
            transformations,
            chained
          }
        ) => {
          return getFixedImageObject({
            public_id,
            version,
            cloudName,
            originalHeight,
            originalWidth,
            width,
            base64Width,
            base64Transformations,
            transformations,
            chained
          })
        }
      },
      fluid: {
        type: 'CloudinaryMediaImageFluid!',
        resolve: (
          {
            public_id,
            version,
            cloudName,
            originalHeight,
            originalWidth,
            breakpoints
          },
          {
            base64Width,
            base64Transformations,
            maxWidth,
            transformations,
            chained
          }
        ) => {
          return getFluidImageObject({
            public_id,
            version,
            cloudName,
            maxWidth,
            breakpoints,
            originalHeight,
            originalWidth,
            base64Width,
            base64Transformations,
            transformations,
            chained
          })
        }
      }
    }
  }

  createResolvers(resolvers)
}
