import { type TransformMatrix, degToRad } from '@villagekit/math'
import { Matrix4, Vector3 } from 'three'

export interface Typed<Type extends string> {
  type: Type
}

export type TypeOf<T> = T extends Typed<infer Type> ? Type : never

export type RotateOptions = {
  angle: number
  origin?: [number, number, number]
  direction?: [number, number, number]
}

export type ApplyRotationOptions = {
  origin?: [number, number, number]
  rotation: TransformMatrix
}

export type SpecOfCreator<Creator> = Creator extends BasePartCreator<infer Spec> ? Spec : never

export class BasePartCreator<Spec extends Typed<any>> {
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

type CreatorSerialized<SpecSerialized> = {
  spec: SpecSerialized
  id?: string
  transform: TransformMatrix
}

export function createSerializer<
  Type extends string,
  Spec extends Typed<Type>,
  SpecSerialized extends Typed<Type>,
  Creator extends typeof BasePartCreator<Spec>,
>(
  type: Type,
  CreatorClass: Creator,
  serializeSpec: (spec: Spec) => SpecSerialized,
  deserializeSpec: (object: SpecSerialized) => Spec,
): Serializer<Type, InstanceType<Creator>, CreatorSerialized<SpecSerialized>> {
  return {
    type,
    serialize(creator) {
      const { spec: specInstance, id, transform } = creator
      const spec = serializeSpec(specInstance)
      return {
        spec,
        id,
        transform,
      }
    },
    deserialize(object) {
      const { spec: specObject, id, transform } = object
      const spec = deserializeSpec(specObject)
      return new CreatorClass(spec, id, transform) as InstanceType<Creator>
    },
  }
}

type Serializer<Type extends string, Instance, Serialized> = {
  type: Type
  serialize: (instance: Instance) => Serialized
  deserialize: (object: Serialized) => Instance
}

interface Serializers {
  [Type: string]: Serializer<typeof Type, any, any>
}

const serializers: Serializers = {}

export function registerSerializer<Type extends string, Instance, Serialized>(
  serializer: Serializer<Type, Instance, Serialized>,
) {
  serializers[serializer.type] = serializer
}

function getSerializer(type: string): Serializer<any, any, any> {
  const serializer = serializers[type]
  if (serializer == null) {
    throw new Error(`Unknown serializer type: ${type}`)
  }
  return serializer
}

export function serialize(instance: any): any {
  const serializer = getSerializer(instance.type)
  return serializer.serialize(instance)
}

export function deserialize(object: any): any {
  const serializer = getSerializer(object.type)
  return serializer.deserialize(object)
}
