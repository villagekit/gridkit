import { Colors, DxfDocument, DxfWriter, Units, point3d } from '@tarikjabiri/dxf'

import type { GridPanelSpec } from './creator'

export function calculateDxf(spec: GridPanelSpec): DxfDocument {}

export function createBaseDxf() {
  const dxf = new DxfWriter()

  dxf.setUnits(Units.Millimeters)

  dxf.addLType('Bends', '__ . ', [2, -1, 0, -1])
  dxf.addLType('Faces', '. ', [0, -1])

  const layers = {
    edges: dxf.addLayer('Edges', Colors.White, 'Continuous'),

    faces: dxf.addLayer('Faces', Colors.Magenta, 'Faces'),

    bendUp: dxf.addLayer('Bend_Up', Colors.Cyan, 'Bends'),

    bendDown: dxf.addLayer('Bend_Down', Colors.Yellow, 'Bends'),
  }

  return { dxf, layers }
}

export interface RoundedSquareOptions {
  start?: [number, number]
  size: [number, number]
  radius: number
  dxf: DxfWriter
}

export function createRoundedSquare(options: RoundedSquareOptions) {
  const { start = [0, 0], size, radius, dxf } = options

  const bottomLeftCorner = point3d(start[0], start[1])
  const bottomRightCorner = point3d(start[0] + size[0], start[1])
  const topRightCorner = point3d(start[0] + size[0], start[1] + size[1])
  const topLeftCorner = point3d(start[0], start[1] + size[1])

  // bottom line
  dxf.addLine(
    point3d(bottomLeftCorner.x + radius, bottomLeftCorner.y),
    point3d(bottomRightCorner.x - radius, bottomRightCorner.y),
  )

  // bottom right arc
  dxf.addArc(point3d(bottomRightCorner.x - radius, bottomRightCorner.y + radius), radius, 270, 360)

  // right line
  dxf.addLine(
    point3d(bottomRightCorner.x, bottomRightCorner.y + radius),
    point3d(topRightCorner.x, topRightCorner.y - radius),
  )

  // top right arc
  dxf.addArc(point3d(topRightCorner.x - radius, topRightCorner.y - radius), radius, 0, 90)

  // bottom line
  dxf.addLine(
    point3d(topRightCorner.x - radius, topRightCorner.y),
    point3d(topLeftCorner.x + radius, topLeftCorner.y),
  )

  // top left arc
  dxf.addArc(point3d(topLeftCorner.x + radius, topLeftCorner.y - radius), radius, 90, 180)

  // left line
  dxf.addLine(
    point3d(topLeftCorner.x, topLeftCorner.y - radius),
    point3d(bottomLeftCorner.x, bottomLeftCorner.y + radius),
  )

  // bottom left arc
  dxf.addArc(point3d(bottomLeftCorner.x + radius, bottomLeftCorner.y + radius), radius, 180, 270)
}
