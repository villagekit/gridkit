import { AxisId, type Point3, axisIdToDirectionVector } from '@villagekit/math'
import { BasePartCreator, BasePartSpec } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { fastenerVariants } from './variants'

export class FastenerSpec extends BasePartSpec<'fastener'> {
  variantId: keyof typeof fastenerVariants

  constructor(options: FastenerSpecOptions) {
    const { variantId } = options
    super('fastener')
    this.variantId = variantId
  }
}

export class Fastener extends BasePartCreator<'fastener', FastenerSpec> {
  constructor(options: FastenerOptions) {
    const { id, variantId } = options
    const spec = new FastenerSpec({ variantId })
    super(spec, id)
  }

  static create(options: FastenerOptions) {
    return new Fastener(options)
  }

  static Grid(options: FastenerLineOptions) {
    const { id, variantId, start, end } = options

    const variant = fastenerVariants[variantId]!
    const gridUnit = convert(variant.gridLength, meter).value

    const direction = new Vector3(...end).sub(new Vector3(...start)).normalize()

    const rotation = new Matrix4()
      .makeRotationFromQuaternion(
        new Quaternion().setFromUnitVectors(axisIdToDirectionVector(AxisId.X), direction),
      )
      .toArray()
    const offset = direction
      .clone()
      .multiplyScalar(0.5 * gridUnit)
      .toArray()

    return new Fastener({
      id,
      variantId,
    })
      .applyRotation({ rotation })
      .translate(offset)
      .translate([start[0] * gridUnit, start[1] * gridUnit, start[2] * gridUnit])
  }
}

interface FastenerSpecOptions {
  variantId: keyof typeof fastenerVariants
}

interface BaseCreatorOptions {
  id?: string
  variantId: keyof typeof fastenerVariants
}

interface FastenerOptions extends BaseCreatorOptions {}

interface FastenerLineOptions extends BaseCreatorOptions {
  start: Point3
  end: Point3
}
