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
