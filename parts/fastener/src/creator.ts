import { AxisId, type Point3, axisIdToDirectionVector } from '@villagekit/math'
import { BasePartCreator } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { fastenerVariants } from './variants'

export class Fastener extends BasePartCreator<'fastener'> {
  variantId: keyof typeof fastenerVariants

  constructor(options: FastenerOptions) {
    const { id, variantId } = options
    super('fastener', id)
    this.variantId = variantId
  }

  static create(options: FastenerOptions) {
    return new Fastener(options)
  }

  static Line(options: FastenerLineOptions) {
    const { id, variantId, start, direction } = options

    const variant = fastenerVariants[variantId]!
    const gridUnit = convert(variant.gridLength, meter).value
    const halfGridUnit = 0.5 * gridUnit

    const rotation = new Matrix4()
      .makeRotationFromQuaternion(
        new Quaternion().setFromUnitVectors(
          axisIdToDirectionVector(AxisId.X),
          new Vector3(...direction),
        ),
      )
      .toArray()

    return new Fastener({
      id,
      variantId,
    })
      .translate([-halfGridUnit, 0, 0])
      .applyRotation({ rotation })
      .translate([start[0] * gridUnit, start[1] * gridUnit, start[2] * gridUnit])
  }
}

interface BaseOptions {
  id?: string
  variantId: keyof typeof fastenerVariants
}

interface FastenerOptions extends BaseOptions {}

interface FastenerLineOptions extends BaseOptions {
  start: Point3
  direction: Point3
}
