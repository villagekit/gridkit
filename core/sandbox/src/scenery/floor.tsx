import type { ReactThreeFiber } from '@react-three/fiber'
import { useMemo } from 'react'
import { Box3, Color, Vector2, Vector3 } from 'three'
import { Grid } from './grid'

export interface FloorProps {
  gridLengthInMeters?: number
  boundingBox?: Box3
  lengthInGridUnits?: number
  shouldDisplayAxes?: boolean
  shouldDisplayGrid?: boolean
}

export function Floor(props: FloorProps) {
  const {
    gridLengthInMeters = 0.04,
    boundingBox = new Box3(),
    lengthInGridUnits = 50,
    shouldDisplayAxes = false,
    shouldDisplayGrid = true,
  } = props

  const floorLength = useMemo(() => {
    return gridLengthInMeters * lengthInGridUnits
  }, [gridLengthInMeters, lengthInGridUnits])

  const center = useMemo(() => {
    const vector3 = new Vector3()
    boundingBox.getCenter(vector3)
    const vector2 = new Vector2(vector3.x, vector3.y)

    // quantize to grid units
    vector2.divideScalar(gridLengthInMeters).floor().multiplyScalar(gridLengthInMeters)

    return vector2
  }, [gridLengthInMeters, boundingBox])

  const position = useMemo(() => {
    return new Vector3(center.x, center.y, 0)
  }, [center])

  return (
    <group name="floor" position={position}>
      {shouldDisplayAxes && <axesHelper args={[floorLength]} position={[0, 0, 1e-3]} />}
      {shouldDisplayGrid && (
        <Grid
          axisLength={floorLength}
          smallSize={gridLengthInMeters}
          largeSize={gridLengthInMeters * 10}
          color={new Color('#d9e0e8')}
          // render before shadow floor
          renderOrder={1}
        />
      )}
      <FloorShadow floorLength={floorLength} />
    </group>
  )
}

function FloorShadow({ floorLength }: { floorLength: number }) {
  return (
    <mesh
      receiveShadow
      // render after grid
      renderOrder={2}
    >
      <shadowMaterial
        args={[{ opacity: 0.5 }]}
        // depthWrite needed for z-fighting with grid
        depthWrite={false}
      />
      <planeGeometry args={[2 * floorLength, 2 * floorLength]} />
    </mesh>
  )
}
