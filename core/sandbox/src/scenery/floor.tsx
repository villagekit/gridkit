import { Grid } from '@react-three/drei'
import { Color } from 'three'

type FloorProps = {
  shouldDisplayGrid: boolean
  gridLengthInMeters: number
}
export function Floor(props: FloorProps) {
  const { shouldDisplayGrid, gridLengthInMeters } = props
  return (
    <group name="floor">
      {shouldDisplayGrid && (
        <Grid
          // render after shadow floor
          renderOrder={2}
          /** Cell size, default: 0.5 */
          cellSize={gridLengthInMeters}
          /** Cell thickness, default: 0.5 */
          cellThickness={0.5}
          /** Cell color, default: black */
          cellColor={new Color('#d9e0e8')}
          /** Section size, default: 1 */
          sectionSize={10 * gridLengthInMeters}
          /** Section thickness, default: 1 */
          sectionThickness={1}
          /** Section color, default: #2080ff */
          sectionColor={new Color('#9caec3')}
          /** Follow camera, default: false */
          followCamera={false}
          /** Display the grid infinitely, default: false */
          infiniteGrid={true}
          /** Fade distance, default: 100 */
          fadeDistance={40}
          /** Fade strength, default: 1 */
          fadeStrength={10}
          /** Fade from camera (1) or origin (0), or somewhere in between, default: camera */
          fadeFrom={0.5}
        />
      )}
      <ShadowFloor floorLength={gridLengthInMeters * 100} />
    </group>
  )
}

function ShadowFloor({ floorLength }: { floorLength: number }) {
  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      // render before grid
      renderOrder={1}
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
