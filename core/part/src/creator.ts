import { type TransformMatrix, degToRad } from '@villagekit/math'
import { Matrix4, Quaternion, Vector3 } from 'three'

export type RotateOptions = {
  angle: number
  origin?: [number, number, number]
  direction?: [number, number, number]
}

export type ApplyRotationOptions = {
  origin?: [number, number, number]
  rotation: TransformMatrix
}

export class BasePartCreator<PartType extends string> {
  type: PartType
  id?: string
  transform: TransformMatrix

  constructor(type: PartType, id?: string, transform: TransformMatrix = new Matrix4().toArray()) {
    this.type = type
    this.id = id
    this.transform = transform
  }

  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }

  translate(_vector: [number, number, number]) {
    const next = this.clone()
    const matrix = new Matrix4().fromArray(this.transform)
    // matrix.premultiply(new Matrix4().makeTranslation(...vector))
    next.transform = matrix.toArray()
    return next
  }

  applyRotation(options: ApplyRotationOptions) {
    const { origin = [0, 0, 0], rotation } = options

    const next = this.clone()

    function log(prefix: string, matrix: Matrix4) {
      const pos = new Vector3()
      const quat = new Quaternion()
      const sca = new Vector3()
      matrix.decompose(pos, quat, sca)
      console.log(prefix, pos.toArray())
    }

    // https://stackoverflow.com/a/55138754
    const matrix = new Matrix4().fromArray(this.transform)
    const pivotMatrix = new Matrix4().makeTranslation(new Vector3(...origin))
    log('pivot', pivotMatrix)
    const pivotInverseMatrix = pivotMatrix.clone().invert()
    log('pivotInverse', pivotInverseMatrix)
    matrix.premultiply(pivotInverseMatrix)
    const rotationMatrix = new Matrix4().fromArray(rotation)
    matrix.premultiply(rotationMatrix)
    matrix.premultiply(pivotMatrix)

    next.transform = matrix.toArray()

    return next
  }

  rotate(options: RotateOptions) {
    const { angle, origin, direction = [0, 0, 1] } = options
    const rotation = new Matrix4()
      .makeRotationAxis(new Vector3(...direction), degToRad(angle))
      .toArray()
    return this.applyRotation({ origin, rotation })
  }

  applyTransform(transform: TransformMatrix) {
    const next = this.clone()
    const matrixAppliedTo = new Matrix4().fromArray(this.transform)
    const matrixToApply = new Matrix4().fromArray(transform)
    matrixAppliedTo.premultiply(matrixToApply)
    next.transform = matrixAppliedTo.toArray()
    return next
  }
}
