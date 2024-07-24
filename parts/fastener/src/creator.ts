import { BasePartCreator, type PartTransform } from '@villagekit/part/creator'
import type { fastenerVariants } from './variants'

export class Fastener extends BasePartCreator<'fastener'> {
  variantId: keyof typeof fastenerVariants

  constructor(options: FastenerOptions) {
    const { id, variantId, transforms } = options
    super('fastener', id, transforms)
    this.variantId = variantId
  }

  static create(options: FastenerOptions) {
    return new Fastener(options)
  }
}

interface BaseOptions {
  id?: string
}

interface FastenerOptions extends BaseOptions {
  variantId: keyof typeof fastenerVariants
  transforms?: Array<PartTransform>
}
