import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions'
import { defineConfig } from 'tsup'

export default defineConfig({
  bundle: true,
  clean: true,
  cjsInterop: true,
  dts: true,
  esbuildPlugins: [esbuildPluginFilePathExtensions()],
  format: ['cjs', 'esm'],
  shims: true,
  sourcemap: true,
  splitting: false,
  target: 'es2019',
})
