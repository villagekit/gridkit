import { ResizeObserver } from '@juggle/resize-observer'
import { AccumulativeShadows, AdaptiveDpr, useContextBridge, useDetectGPU } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { ProductViewProps } from '@villagekit/product'
import { Box, useDisclosure } from '@villagekit/ui'
import { Perf } from 'r3f-perf'
import type React from 'react'
import { type PropsWithChildren, useMemo, useRef } from 'react'
import { type Box3, Group, Matrix4, Vector3 } from 'three'
import { CameraControls, type CameraControlsRef } from './camera/index'
import { SandboxControls } from './controls/index'
import Floor from './scenery/floor'
import { SceneryGl } from './scenery/index'
import Lights from './scenery/lights'
import { useDefaultSandboxControlSettings, useSaveSandboxControlSettings } from './settings'

export type SandboxMode = 'default' | 'screenshot'

export type SandboxProps = ProductViewProps & {
  label: string
  boundingBox: Box3
  bridgeContexts?: Array<React.Context<any>>
  children: React.ReactNode
}

export function Sandbox(props: SandboxProps) {
  const {
    label,
    boundingBox,
    mode = 'default',
    isDebug = false,
    showParamControls = false,
    alwaysShowFullscreenControls = false,
    bridgeContexts = [],
    children,
  } = props

  const maxTiers = 3
  const gpu = useDetectGPU()

  const defaultSandboxControlSettings = useDefaultSandboxControlSettings()

  const { isOpen: shouldAutoRotate, onToggle: onToggleAutoRotate } = useDisclosure({
    defaultIsOpen: defaultSandboxControlSettings.shouldAutoRotate,
  })

  const { isOpen: shouldDisplayGrid, onToggle: onToggleDisplayGrid } = useDisclosure({
    defaultIsOpen: defaultSandboxControlSettings.shouldDisplayGrid,
  })

  useSaveSandboxControlSettings(shouldAutoRotate, shouldDisplayGrid)

  const containerRef = useRef<HTMLDivElement>(null)
  const cameraControlsRef = useRef<CameraControlsRef | null>(null)

  const ContextBridge = useContextBridge(...bridgeContexts)

  const gridLengthInMeters = 0.04

  const center: [number, number, number] = useMemo(() => {
    const centerVector = new Vector3()
    boundingBox.getCenter(centerVector)
    return [centerVector.x, centerVector.y, centerVector.z]
  }, [boundingBox])
  const sceneryCenterInMeters: [number, number] = useMemo(() => [center[0], center[1]], [center])

  if (gpu == null) return null
  const perfMax = gpu.tier / maxTiers

  return (
    <Box
      id="sandbox-container"
      role="img"
      aria-label={label}
      ref={containerRef}
      sx={{
        ':hover, :focus-within': {
          '.sandbox-controls': {
            opacity: 1,
          },
        },

        backgroundColor: mode === 'default' ? 'gray.50' : 'inherit',
        height: 'full',
        position: mode === 'screenshot' ? 'fixed' : 'relative',
        width: 'full',
      }}
    >
      <Canvas
        id="scene-container"
        performance={{
          max: perfMax,
        }}
        shadows
        orthographic
        camera={{
          near: 0.01,
        }}
        raycaster={{
          // @ts-ignore
          params: {
            Line: {
              threshold: 0.005,
            },
          },
        }}
        resize={{ polyfill: ResizeObserver }}
      >
        <ContextBridge>
          {isDebug && mode !== 'screenshot' && <Perf />}
          <AdaptiveDpr />
          <CameraControls
            ref={cameraControlsRef}
            boundingBox={boundingBox}
            mode={mode}
            shouldAutoRotate={shouldAutoRotate}
          />
          <ChangeOfBasis matrix={zUpToYUpMatrix}>
            <Floor
              centerInMeters={sceneryCenterInMeters}
              gridLengthInMeters={gridLengthInMeters}
              shouldDisplayGrid={shouldDisplayGrid && mode !== 'screenshot'}
            />
            {children}
          </ChangeOfBasis>
          <Lights />
        </ContextBridge>
      </Canvas>

      {mode === 'default' && (
        <SandboxControls
          shouldAutoRotate={shouldAutoRotate}
          onToggleAutoRotate={onToggleAutoRotate}
          shouldDisplayGrid={shouldDisplayGrid}
          onToggleDisplayGrid={onToggleDisplayGrid}
          cameraControlsRef={cameraControlsRef}
          containerRef={containerRef}
          showParamControls={showParamControls}
          alwaysShowFullscreenControls={alwaysShowFullscreenControls}
          // NOTE(mw): before, assembly could be null and this was false.
          //             does this still happen?
          // shouldRenderAssemblyInfo={assembly == null}
        />
      )}
    </Box>
  )
}

const zUpToYUpMatrix = new Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)

type ChangeOfBasisProps = PropsWithChildren<{
  matrix: Matrix4
}>

function ChangeOfBasis(props: ChangeOfBasisProps) {
  const { matrix, children } = props

  const group = useMemo(() => {
    const g = new Group()
    matrix.decompose(g.position, g.quaternion, g.scale)
    return g
  }, [matrix])

  return <primitive object={group}>{children}</primitive>
}
