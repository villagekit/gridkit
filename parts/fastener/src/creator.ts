import { AxisId, type Point3, axisIdToDirectionVector, degToRad } from '@villagekit/math'
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

    const rotationMatrix = new Matrix4().makeRotationFromQuaternion(
      new Quaternion().setFromUnitVectors(
        axisIdToDirectionVector(AxisId.X),
        new Vector3(...direction),
      ),
    )

    const left = new Vector3(...direction)
      .applyAxisAngle(axisIdToDirectionVector(AxisId.Z), degToRad(90))
      .multiplyScalar(halfGridUnit)
      .toArray()
    const up = new Vector3(...direction)
      .applyAxisAngle(axisIdToDirectionVector(AxisId.Y), degToRad(-90))
      .multiplyScalar(halfGridUnit)
      .toArray()

    return new Fastener({
      id,
      variantId,
    })
      .applyTransform(rotationMatrix.toArray())
      .translate(left)
      .translate(up)
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
