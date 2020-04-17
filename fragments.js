import { graphql } from 'gatsby'

export const cloudinaryMediaImageFluid = graphql`
  fragment CloudinaryMediaImageFluid on CloudinaryMediaImageFluid {
    aspectRatio
    base64
    sizes
    src
    srcSet
  }
`

export const cloudinaryMediaImageFixed = graphql`
  fragment CloudinaryMediaImageFixed on CloudinaryMediaImageFixed {
    base64
    height
    src
    srcSet
    width
  }
`
