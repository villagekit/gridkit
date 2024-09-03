import { defineConfig } from '@rsbuild/core'
import { pluginSourceBuild } from '@rsbuild/plugin-source-build'

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [pluginSourceBuild()],
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
          {
            test: /\.jsx$/,
            use: {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'ecmascript',
                    jsx: true,
                  },
                  transform: {
                    react: {
                      runtime: 'automatic',
                      throwIfNamespace: true,
                      useBuiltins: false,
                    },
                  },
                },
              },
            },
            type: 'javascript/auto',
          },
          {
            test: /\.tsx$/,
            use: {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    tsx: true,
                  },
                  transform: {
                    react: {
                      runtime: 'automatic',
                      throwIfNamespace: true,
                      useBuiltins: false,
                    },
                  },
                },
              },
            },
            type: 'javascript/auto',
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
