import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useActorRef } from '@xstate/react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { type Box3, Sphere, Vector3 } from 'three'
import type { SandboxMode } from '../'
import { createMachine } from './machine'

const ROT = 2 * Math.PI

export interface CameraRef {
  reset: () => void
  zoomIn: () => void
  zoomOut: () => void
}

interface CameraProps {
  boundingBox: Box3
  mode: SandboxMode
  shouldAutoRotate: boolean
}

export const Camera = forwardRef<CameraRef, CameraProps>(function Camera(props, ref) {
  const { boundingBox, mode, shouldAutoRotate } = props

  const actorMachine = useMemo(() => createMachine(mode === 'screenshot' ? 'off' : 'auto'), [mode])
  const actor = useActorRef(actorMachine)

  const isControlEnabled = true
  const controlsRef = useRef<CameraControls>(null)

  const resetControlsBox = useCallback(() => {
    const controls = controlsRef.current
    if (controls == null) return

    const fitBox = boundingBox.clone()

    if (fitBox.isEmpty()) {
      fitBox.expandByPoint(new Vector3(1, 1, 1))
      fitBox.expandByPoint(new Vector3(-1, -1, -1))
    }

    const enableFitTransition = mode === 'default'

    if (mode === 'screenshot') {
      void controls.fitToBox(fitBox, enableFitTransition, {
        paddingBottom: 0.4,
        paddingLeft: 0.4,
        paddingRight: 0.4,
        paddingTop: 0.4,
      })

      void controls.rotateTo((3 / 8) * ROT, (3 / 16) * ROT, false)
    } else {
      const fitSphere = fitBox.getBoundingSphere(new Sphere())
      void controls.fitToSphere(fitSphere, enableFitTransition)
    }
  }, [boundingBox, mode])

  const resetControlsRotation = useCallback((enableTransition: boolean) => {
    const controls = controlsRef.current
    if (controls == null) return

    const { azimuthAngle, polarAngle } = controls

    const nextAzimuthAngle = azimuthAngle - (azimuthAngle % ROT) + (3 / 8) * ROT
    const nextPolarAngle = polarAngle - (polarAngle % ROT) + (3 / 16) * ROT

    void controls.rotateTo(nextAzimuthAngle, nextPolarAngle, enableTransition)
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        resetControlsBox()
        resetControlsRotation(true)
      },
      zoomIn: () => {
        const controls = controlsRef.current
        if (controls == null) return
        void controls.dolly(controls.distance * 0.25, true)
      },
      zoomOut: () => {
        const controls = controlsRef.current
        if (controls == null) return
        void controls.dolly(-controls.distance * 0.25, true)
      },
    }),
    [resetControlsBox, resetControlsRotation],
  )

  useAutoRotate({ controlsRef, mode, actor, shouldAutoRotate })

  useEffect(() => {
    resetControlsBox()
  }, [resetControlsBox])

  useEffect(() => {
    resetControlsRotation(false)
  }, [resetControlsRotation])

  return (
    <CameraControls
      ref={controlsRef}
      enabled={isControlEnabled}
      dampingFactor={0.1}
      azimuthRotateSpeed={0.5}
      polarRotateSpeed={0.5}
      minDistance={0.15}
      maxDistance={10}
      {...props}
    />
  )
})

interface AutoRotateOptions {
  actor: ReturnType<typeof useActorRef<ReturnType<typeof createMachine>>>
  shouldAutoRotate: boolean
  controlsRef: React.RefObject<CameraControls>
  mode: SandboxMode
}

function useAutoRotate(options: AutoRotateOptions) {
  const { controlsRef, shouldAutoRotate, actor, mode } = options

  // use ref and custom subscribe for performance
  const initialState = actor.getSnapshot()
  const controlModeRef = useRef(initialState.value)
  const rotationSpeedRef = useRef(initialState.context.autoRotationSpeed)

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (controls == null) return

    if (controlModeRef.current === 'auto') {
      actor.send({ delta, type: 'control.auto.tick' })

      // clamp to handle game loop sleeping
      const clampedDelta = Math.min(delta, 0.5)
      const azimuthAngle = clampedDelta * rotationSpeedRef.current
      void controls.rotate(azimuthAngle, 0, true)
    }
  })

  useEffect(() => {
    if (mode === 'screenshot') {
      return
    }

    if (shouldAutoRotate) {
      actor.send({ type: 'control.auto.start' })
    } else {
      actor.send({ type: 'control.auto.off' })
    }
  }, [mode, shouldAutoRotate, actor])

  useEffect(() => {
    const subscription = actor.subscribe((state) => {
      controlModeRef.current = state.value
      rotationSpeedRef.current = state.context.autoRotationSpeed
    })

    return subscription.unsubscribe
  }, [actor])

  useEffect(() => {
    const controls = controlsRef.current
    if (controls == null) return

    controls.addEventListener('controlstart', onControlStart)
    controls.addEventListener('controlend', onControlEnd)
    return () => {
      controls.removeEventListener('controlstart', onControlStart)
      controls.removeEventListener('controlend', onControlEnd)
    }

    function onControlStart() {
      actor.send({ type: 'control.user.start' })
    }
    function onControlEnd() {
      actor.send({ type: 'control.user.end' })
    }
  }, [controlsRef, actor])
}
