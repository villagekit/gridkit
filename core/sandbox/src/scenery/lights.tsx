import { AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import { Color } from 'three'

type LightsProps = {}

export function Lights(_props: LightsProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight
        color={new Color(0xb1e1ff)}
        groundColor={new Color(0xb97a20)}
        intensity={3}
      />
      <RandomizedLight
        amount={4}
        radius={10}
        position={[10, 50, -30]}
        bias={-0.000001}
        size={5}
        mapSize={4096}
        intensity={2}
      />
    </>
  )
}
