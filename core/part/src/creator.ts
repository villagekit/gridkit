export type PartTransform =
  | {
      type: 'translation'
      vector: [number, number, number]
    }
  | {
      type: 'rotation'
      angle: number
      origin: [number, number, number]
      direction: [number, number, number]
    }

export class BasePartCreator<PartType extends string> {
  type: PartType
  id?: string
  transforms: Array<PartTransform>

  constructor(type: PartType, id?: string, transforms: Array<PartTransform> = []) {
    this.type = type
    this.id = id
    this.transforms = transforms
  }

  translate(vector: [number, number, number]) {
    this.transforms.push({
      type: 'translation',
      vector,
    })
  }

  rotate(
    angle: number,
    origin: [number, number, number] = [0, 0, 0],
    direction: [number, number, number] = [0, 0, 1],
  ) {
    this.transforms.push({
      type: 'rotation',
      angle,
      origin,
      direction,
    })
  }
}
