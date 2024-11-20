import { Box } from '@villagekit/ui'
import { createContext, useContext } from 'react'
import useMeasure from 'react-use-measure'

interface GridSvgContextProps {
  displayUnit: 'gu' | 'mm'
}

interface GridSvgContextType extends GridSvgContextProps {
  viewWidth: number
}

const GridSvgContext = createContext<GridSvgContextType | null>(null)

export function GridSvgContextProvider(props: React.PropsWithChildren<GridSvgContextProps>) {
  const { children, ...contextProps } = props

  const [ref, bounds] = useMeasure()
  const viewWidth = bounds.width

  const value = { ...contextProps, viewWidth }

  return (
    <GridSvgContext.Provider value={value}>
      <Box sx={{ width: '100%' }} ref={ref}>
        {children}
      </Box>
    </GridSvgContext.Provider>
  )
}

export function useGridSvgContext(): GridSvgContextType {
  const context = useContext(GridSvgContext)
  if (context == null) {
    throw new Error('useGridSvgContext() must be wrapped with GridSvgContextProvider')
  }
  return context
}

// TODO remove aliases
export const SvgContextProvider = GridSvgContextProvider
export const useSvgContext = useGridSvgContext
