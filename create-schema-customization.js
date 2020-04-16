module.exports = function createSchemaCustomization ({
  actions: { createTypes },
  scheme,
  reporter
}) {
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

    type CloudinaryMediaImage implements Node @dontInfer {
      fixed(
        base64Width: Int
        base64Transformations: [String!]
        chained: [String!]
        transformations: [String!]
        width: Int
      ): CloudinaryMediaImageFixed!
      fluid(
        base64Width: Int
        base64Transformations: [String!]
        chained: [String!]
        maxWidth: Int
        transformations: [String!]
      ): CloudinaryMediaImageFluid!
    }

    type CloudinaryMediaImageFixed {
      aspectRatio: Float
      base64: String!
      height: Float
      src: String
      srcSet: String
      width: Float
    }

    type CloudinaryMediaImageFluid {
      aspectRatio: Float!
      base64: String!
      sizes: String!
      src: String!
      srcSet: String!
    }
  `
  createTypes(cloudinaryTypeDefs)
}
