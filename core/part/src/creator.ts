import { type TransformMatrix, degToRad } from '@villagekit/math'
import { Matrix4, Vector3 } from 'three'

export type RotateOptions = {
  angle: number
  origin?: [number, number, number]
  direction?: [number, number, number]
}

export type ApplyRotationOptions = {
  origin?: [number, number, number]
  rotation: TransformMatrix
}

export type Constructor<M> = {
  new (...args: Array<any>): M
}

export class BasePartSpec<Type extends string, Serialized> {
  type: Type

  constructor(type: Type) {
    this.type = type
  }

  serialize(): Serialized {
    throw new Error('Unimplemented')
  }

  static deserialize<
    Type extends string,
    Serialized extends object,
    Spec extends BasePartSpec<Type, Serialized>,
  >(this: Constructor<Spec>, _object: Serialized): Spec {
    throw new Error('Unimplemented')
  }
}

export type SerializedOfSpec<Spec> = Spec extends BasePartSpec<any, infer Serialized>
  ? Serialized
  : never

export type SerializedOfBasePartCreator<Spec> = {
  spec: SerializedOfSpec<Spec>
  id?: string
  transform: TransformMatrix
}

export class BasePartCreator<Spec extends BasePartSpec<any, any>> {
  spec: Spec
  id?: string
  transform: TransformMatrix

  get type() {
    return this.spec.type
  }

  constructor(spec: Spec, id?: string, transform: TransformMatrix = new Matrix4().toArray()) {
    this.spec = spec
    this.id = id
    this.transform = transform
  }

  serialize(): SerializedOfBasePartCreator<Spec> {
    return {
      spec: this.spec.serialize(),
      id: this.id,
      transform: this.transform,
    }
  }

  static deserializeSpec<Spec extends BasePartSpec<any, any>>(
    this: { new (...args: any): Spec },
    _specObject: SerializedOfSpec<Spec>,
  ): Spec {
    throw new Error('Unimplemented')
  }

  static deserialize<Spec extends BasePartSpec<any, any>, Creator extends BasePartCreator<Spec>>(
    this: { new (...args: any): Creator; deserializeSpec(object: SerializedOfSpec<Spec>): Spec },
    object: SerializedOfBasePartCreator<Spec>,
  ): Creator {
    const { spec: specObj, id, transform } = object
    const spec = this.deserializeSpec(specObj)
    return new this(spec, id, transform)
  }

  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }

  translate(vector: [number, number, number]) {
    const next = this.clone()
    const matrix = new Matrix4().fromArray(this.transform)
    matrix.premultiply(new Matrix4().makeTranslation(...vector))
    next.transform = matrix.toArray()
    return next
  }

  applyRotation(options: ApplyRotationOptions) {
    const { origin, rotation } = options

    const next = this.clone()
    const matrix = new Matrix4().fromArray(this.transform)
    const rotationMatrix = new Matrix4().fromArray(rotation)

    if (origin != null) {
      // https://stackoverflow.com/a/55138754
      const pivotMatrix = new Matrix4().makeTranslation(new Vector3(...origin))
      const pivotInverseMatrix = pivotMatrix.clone().invert()
      matrix.premultiply(pivotInverseMatrix)
      matrix.premultiply(rotationMatrix)
      matrix.premultiply(pivotMatrix)
    } else {
      matrix.premultiply(rotationMatrix)
    }

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
