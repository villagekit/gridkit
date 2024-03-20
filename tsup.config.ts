import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'esbuild'
import type { Format } from 'tsup'
import { defineConfig } from 'tsup'

export default defineConfig({
  bundle: false,
  clean: true,
  cjsInterop: true,
  dts: true,
  // esbuildPlugins: [rewriteImportsPlugin({ esmExtension: '.mjs', cjsExtension: '.js' })],
  format: ['cjs', 'esm'],
  shims: true,
  sourcemap: true,
  splitting: false,
  target: 'es2019',
})

const VALID_IMPORT_EXTENSIONS = [
  '.js',
  '.jsx',
  '.cjs',
  '.cjsx',
  '.mjs',
  '.mjsx',

  '.ts',
  '.tsx',
  '.cts',
  '.ctsx',
  '.mts',
  '.mtsx',
]

export function rewriteImportsPlugin(options: {
  esmExtension: string
  cjsExtension: string
}) {
  const plugin: Plugin = {
    name: 'add-mjs',
    setup(build) {
      const currentBuildFormat: Format | null =
        build.initialOptions.define?.TSUP_FORMAT === '"cjs"'
          ? 'cjs'
          : build.initialOptions.define?.TSUP_FORMAT === '"esm"'
            ? 'esm'
            : null

      if (currentBuildFormat == null) {
        return
      }

      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'import-statement') {
          if (!args.path.match(/(^#|\.\/)/)) {
            return
          }

          const desiredExtension =
            currentBuildFormat === 'cjs'
              ? options.cjsExtension
              : currentBuildFormat === 'esm'
                ? options.esmExtension
                : null

          if (desiredExtension == null) {
            return
          }

          let finalName = `${args.path}${desiredExtension}`
          let exactMatch: string | null = null

          for (const ext of VALID_IMPORT_EXTENSIONS) {
            if (fs.existsSync(path.join(args.resolveDir, `${args.path}${ext}`))) {
              exactMatch = `${args.path}${ext}`
              break
            }
          }

          if (!exactMatch) {
            finalName = `${args.path}/index${desiredExtension}`
          }

          return { path: finalName, external: true }
        }
      })
    },
  }

  return plugin
}
