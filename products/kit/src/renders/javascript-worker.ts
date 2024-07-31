import 'es-module-shims/wasm'
import * as Comlink from 'comlink'

/*
// @ts-ignore
importScripts('https://ga.jspm.io/npm:es-module-shims@1.6.2/dist/es-module-shims.wasm.js')
// @ts-ignore
// importScripts('https://ga.jspm.io/npm:comlink@4.4.1/dist/umd/comlink.js')
importScripts('https://unpkg.com/comlink/dist/umd/comlink.js')
*/

const loadedImportMap = new Promise<void>((resolve) => {
  loadImports().then((importMap) => {
    console.log('import map', importMap)
    // @ts-ignore
    importShim.addImportMap(importMap)

    resolve()
  })
})

function loadImport(code: string) {
  return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))
}

async function loadImports() {
  const modules = await Promise.all([
    // @ts-ignore
    import('../../../../node_modules/comlink/dist/esm/comlink.js?raw'),
    // @ts-ignore
    import('../../../../node_modules/three/build/three.module.js?raw'),
    // @ts-ignore
    import('../../../../util/math/dist/index.js?raw'),
    // @ts-ignore
    import('../../../../util/units/dist/index.js?raw'),
    // @ts-ignore
    import('../../../../core/part/dist/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/gridbeam/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/gridpanel/dist-bundles/creator.js?raw'),
    // @ts-ignore
    import('../../../../parts/fastener/dist-bundles/creator.js?raw'),
  ])
  const loaded = modules.map((module: any) => module.default).map(loadImport)
  const [comlink, three, math, units, partBase, partGridbeam, partGridpanel, partFastener] = loaded
  const imports = {
    comlink: comlink,
    three: three,
    '@villagekit/math': math,
    '@villagekit/units': units,
    '@villagekit/part/creator': partBase,
    '@villagekit/part-gridbeam/creator': partGridbeam,
    '@villagekit/part-gridpanel/creator': partGridpanel,
    '@villagekit/part-fastener/creator': partFastener,
    '@villagekit/design/kit': loadImport(''),
  }
  return { imports }
}

let moduleUrl: string | null = null
let module: any = null

function loadModule(code: string) {
  if (moduleUrl != null) {
    URL.revokeObjectURL(moduleUrl)
  }

  moduleUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))

  return moduleUrl
}

async function evaluateModule() {
  if (moduleUrl == null) {
    throw new Error('Unexpected: Module not loaded')
  }

  await loadedImportMap

  // @ts-ignore
  module = await importShim(moduleUrl)

  const { parameters, presets, parts, plugins } = module

  if (typeof parts === 'function') {
    return { parameters, presets, plugins }
  }
  return { parts, plugins }
}

function evaluateParts(parameters: any, partVariants: any) {
  return module.parts(parameters, partVariants)
}

const exports = {
  loadModule,
  evaluateModule,
  evaluateParts,
}

Comlink.expose(exports)
