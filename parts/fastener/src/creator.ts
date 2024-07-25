import type { Direction, Vector3 as VkVector3 } from '@villagekit/math'
import { BasePartCreator, type PartTransform } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import { Vector2 } from 'three'
import { fastenerVariants } from './variants'

const X_AXIS = [1, 0, 0]
const Y_AXIS = [0, 1, 0]
const Z_AXIS = [0, 0, 1]

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

  static Line(options: FastenerLineOptions) {
    const { id, variantId, start, direction } = options

    const variant = fastenerVariants[variantId]!
    const gridUnit = convert(variant.gridLength, meter).value

    // https://stackoverflow.com/a/42557552
    const xAngle = radToDeg(
      Math.acos(new Vector2(X_AXIS[1], X_AXIS[2]).dot(new Vector2(direction[1], direction[2]))),
    )
    const yAngle = radToDeg(
      Math.acos(new Vector2(X_AXIS[0], X_AXIS[2]).dot(new Vector2(direction[0], direction[2]))),
    )
    const zAngle = radToDeg(
      Math.acos(new Vector2(X_AXIS[0], X_AXIS[1]).dot(new Vector2(direction[0], direction[1]))),
    )
    console.log('angle', xAngle, yAngle, zAngle)

    return new Fastener({
      id,
      variantId,
      transforms: [
        {
          type: 'rotation' as const,
          angle: xAngle,
          origin: [0, 0, 0] as [number, number, number],
          direction: X_AXIS as [number, number, number],
        },
        {
          type: 'rotation' as const,
          angle: yAngle,
          origin: [0, 0, 0] as [number, number, number],
          direction: Y_AXIS as [number, number, number],
        },
        {
          type: 'rotation' as const,
          angle: zAngle,
          origin: [0, 0, 0] as [number, number, number],
          direction: Z_AXIS as [number, number, number],
        },
        {
          type: 'translation',
          vector: [start[0] * gridUnit, start[1] * gridUnit, start[2] * gridUnit],
        },
      ],
    })
  }
}

interface BaseOptions {
  id?: string
  variantId: keyof typeof fastenerVariants
}

interface FastenerOptions extends BaseOptions {
  transforms?: Array<PartTransform>
}

interface FastenerLineOptions extends BaseOptions {
  start: VkVector3
  direction: Direction
}

function radToDeg(radians: number): number {
  return (radians / (Math.PI * 2)) * 360
}
