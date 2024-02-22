import { DesignFile, DesignRender } from '../types'
import { useDesignAssemblyJavaScript } from './javascript'
import { useDesignAssemblyTypeScript } from './typescript'

export type RenderOutput = {
  render: DesignRender | null
  error: string | Error | null
}

export function useDesignRender(file: DesignFile): RenderOutput {
  switch (file.type) {
    case 'assembly':
      switch (file.language) {
        case 'typescript':
          return useDesignAssemblyTypeScript(file.code)
        case 'javascript':
          return useDesignAssemblyJavaScript(file.code)
      }
  }
}
