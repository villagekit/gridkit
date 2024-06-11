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
      <AccumulativeShadows frames={40} scale={10}>
        <RandomizedLight
          amount={8}
          position={[10, 50, 30]}
          mapSize={2048}
          bias={-0.000001}
          size={5}
        />
      </AccumulativeShadows>
    </>
  )
}
