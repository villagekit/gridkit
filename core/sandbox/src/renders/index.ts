import { ParametersOptions } from '@villagekit/parameters'
import { DesignFile, DesignRender } from '../types'
import { useDesignAssemblyJavaScript } from './javascript'
import { useDesignAssemblyTypeScript } from './typescript'

export type RenderOutput<ParamsOptions extends ParametersOptions> = {
  render: DesignRender<ParamsOptions> | null
  error: string | Error | null
}

export function useDesignRender(file: DesignFile): RenderOutput<any> {
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
