import { ResizeObserver } from '@juggle/resize-observer'
import { AdaptiveDpr, useContextBridge, useDetectGPU } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { ProductViewProps } from '@villagekit/product'
import { Box, useDisclosure } from '@villagekit/ui'
import { Perf } from 'r3f-perf'
import type React from 'react'
import { type PropsWithChildren, useMemo, useRef } from 'react'
import { type Box3, Group, Matrix4, Vector3 } from 'three'
import { Camera, type CameraRef } from './camera'
import { SandboxControls } from './controls'
import { Floor } from './scenery/floor'
import { Lights } from './scenery/lights'
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
    boundingBox: boundingBoxZUp,
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
  const cameraRef = useRef<CameraRef | null>(null)

  const ContextBridge = useContextBridge(...bridgeContexts)

  const gridLengthInMeters = 0.04
  const boundingBoxYUp = useMemo(() => {
    return boundingBoxZUp.applyMatrix4(zUpToYUpMatrix)
  }, [boundingBoxZUp])

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
          <Camera
            ref={cameraRef}
            boundingBox={boundingBoxYUp}
            mode={mode}
            shouldAutoRotate={shouldAutoRotate}
          />
          <ChangeOfBasis matrix={zUpToYUpMatrix}>
            <Floor
              boundingBox={boundingBoxZUp}
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
          cameraRef={cameraRef}
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
