import { AccumulativeShadows, RandomizedLight } from '@react-three/drei'

type LightsProps = {}

export function Lights(_props: LightsProps) {
  return (
    <AccumulativeShadows temporal frames={100} scale={10}>
      <RandomizedLight amount={8} position={[5, 5, -10]} />
    </AccumulativeShadows>
  )
}
