import { defineConfig } from 'tsup'

export default defineConfig({
  dts: true,
  format: ['cjs', 'esm'],
  target: 'es2019',
  splitting: false,
  shims: true,
  sourcemap: true,
  clean: true,
})
