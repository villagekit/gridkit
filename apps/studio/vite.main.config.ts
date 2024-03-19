// https://github.com/electron/forge/blob/main/packages/template/vite-typescript/tmpl/vite.main.config.ts
import type { ConfigEnv, UserConfig } from 'vite'
import { defineConfig, mergeConfig } from 'vite'
import vitePluginRequireMod from 'vite-plugin-require'
import tsconfigPaths from 'vite-tsconfig-paths'
import {
  external,
  getBuildConfig,
  getBuildDefine,
  pluginHotRestart,
  quietUseClientDirective,
} from './vite.base.config'

const vitePluginRequire = (vitePluginRequireMod as any).default as typeof vitePluginRequireMod

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<'build'>
  const { forgeConfigSelf } = forgeEnv
  const define = getBuildDefine(forgeEnv)
  const config: UserConfig = {
    build: {
      lib: {
        entry: forgeConfigSelf.entry!,
        fileName: () => '[name].js',
        formats: ['es'],
      },
      rollupOptions: {
        external,
        onwarn: quietUseClientDirective,
      },
    },
    plugins: [pluginHotRestart('restart'), tsconfigPaths(), vitePluginRequire()],
    define,
    resolve: {
      // Load the Node.js entry.
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  }

  return mergeConfig(getBuildConfig(forgeEnv), config)
})
