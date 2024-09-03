import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSourceBuild } from '@rsbuild/plugin-source-build'
import type { Compiler, RspackPluginInstance } from '@rspack/core'

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [
    pluginReact({
      swcReactOptions: {
        refresh: false,
      },
      reactRefreshOptions: {
        exclude: /.*/,
      },
    }),
    pluginSourceBuild(),
  ],
  dev: {
    hmr: true,
  },
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  server: {
    // tauri expects a fixed port, fail if that port is not available
    port: 1420,
    strictPort: true,
    host,
  },
  tools: {
    rspack: {
      module: {
        // support ?raw imports
        rules: [
          {
            resourceQuery: /raw/,
            type: 'asset/source',
          },
        ],
        // typescript/lib/typescript: https://github.com/microsoft/TypeScript/issues/39436
        // @typescript/vfs/dist/vfs.esm.js: https://github.com/microsoft/TypeScript-Website/pull/3022
        parser: {
          javascript: {
            exprContextCritical: false,
            wrappedContextCritical: false,
          },
        },
      },
    },
  },
})
