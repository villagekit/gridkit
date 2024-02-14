import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { app, dialog } from 'electron'
import { camelCase } from 'lodash-es'
import { access, constants, mkdir, readFile, readdir, writeFile } from 'fs/promises'
import { basename, join } from 'path'
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml'

const t = initTRPC.create({ isServer: true })

const workspacePathSchema = z.string()

const workspaceConfigSchema = z.object({
  path: workspacePathSchema,
})

type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>

const appConfigSchema = z.object({
  workspaces: z.array(workspaceConfigSchema),
})

type AppConfig = z.infer<typeof appConfigSchema>

const productPathSchema = z.string()
const productIdSchema = z.string()

const productIndexSchema = z.object({
  path: productPathSchema,
  id: productIdSchema,
})

const productTypeSchema = z.enum(['Assembly'])
const productMetaSchema = z.object({
  id: productIdSchema,
  label: z.string(),
  description: z.string(),
  type: productTypeSchema,
})
const productMetaFileSchema = z.object({
  product: productMetaSchema,
})

export const router = t.router({
  listWorkspaces: t.procedure.query(async function listWorkspaces(): Promise<
    Array<WorkspaceConfig>
  > {
    const config = await loadAppConfig()
    return config.workspaces
  }),
  openWorkspace: t.procedure.mutation(async function openWorkspace(): Promise<string | null> {
    const openDialogResult = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    })
    if (openDialogResult.filePaths[0]) {
      const selectedDirectory = openDialogResult.filePaths[0]
      return selectedDirectory
    } else {
      return null
    }
  }),
  addWorkspace: t.procedure
    .input(z.object({ workspace: workspaceConfigSchema }))
    .mutation(async function addWorkspace(opts) {
      const { workspace } = opts.input
      const config = await loadAppConfig()
      config.workspaces.push(workspace)
      await saveAppConfig(config)
    }),
  removeWorkspace: t.procedure
    .input(z.object({ workspacePath: workspacePathSchema }))
    .mutation(async function removeWorkspace(opts) {
      const { workspacePath } = opts.input
      const config = await loadAppConfig()
      config.workspaces = config.workspaces.filter((workspace) => workspace.path !== workspacePath)
      await saveAppConfig(config)
    }),
  listProducts: t.procedure
    .input(z.object({ workspacePath: workspacePathSchema }))
    .output(z.array(productIndexSchema))
    .query(async function listProduct(opts) {
      const { workspacePath } = opts.input
      const products = []
      const dirEntries = await readdir(workspacePath)
      for (const productPath of dirEntries) {
        const productId = basename(productPath)
        products.push({
          path: productPath,
          id: productId,
        })
      }
      return products
    }),
  getProductMeta: t.procedure
    .input(z.object({ productPath: productPathSchema }))
    .query(async function getProductMeta(opts) {
      const { productPath } = opts.input
      const productMetaPath = join(productPath, 'meta.toml')
      const productMetaString = await readFile(productMetaPath, 'utf8')
      const productMetaData = mapKeysDeep(parseToml(productMetaString), camelCase)
      const productMetaFile = await productMetaFileSchema.parseAsync(productMetaData)
      return productMetaFile.product
    }),

  getProductAssemblyMeta: t.procedure.query(() => null),
})

export type Router = typeof router

/* utils */
async function getAppConfigPath(): Promise<string> {
  const appConfigDir = app.getPath('userData')

  await mkdir(appConfigDir, { recursive: true })

  return join(appConfigDir, 'config.toml')
}

async function loadAppConfig(): Promise<AppConfig> {
  const appConfigPath = await getAppConfigPath()

  const appConfigExists = await access(appConfigPath, constants.F_OK).then(
    () => true,
    () => false,
  )

  if (appConfigExists) {
    const appConfigString = await readFile(appConfigPath, 'utf8')
    const appConfigData = parseToml(appConfigString)
    const appConfig = await appConfigSchema.parseAsync(appConfigData)
    return appConfig
  } else {
    return { workspaces: [] }
  }
}

async function saveAppConfig(appConfig: AppConfig) {
  const appConfigPath = await getAppConfigPath()
  const appConfigString = stringifyToml(appConfig)
  await writeFile(appConfigPath, appConfigString, 'utf8')
}

/*

#[derive(Debug, Clone, PartialEq, PartialOrd, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
enum ProductParameterOptions {
    #[serde(rename_all = "kebab-case")]
    Boolean {
        label: String,
        #[serde(default)]
        description: Option<String>,
        #[serde(default)]
        short_id: Option<String>,
    },
    #[serde(rename_all = "kebab-case")]
    Number {
        label: String,
        #[serde(default)]
        description: Option<String>,
        #[serde(default)]
        short_id: Option<String>,
        #[serde(default)]
        min: Option<f64>,
        #[serde(default)]
        max: Option<f64>,
        #[serde(default)]
        step: Option<f64>,
    },
    #[serde(rename_all = "kebab-case")]
    Choice {
        label: String,
        #[serde(default)]
        description: Option<String>,
        #[serde(default)]
        short_id: Option<String>,
        options: BTreeMap<String, String>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
struct ProductParameterId(String);

#[derive(Debug, Clone, PartialEq, PartialOrd, Serialize, Deserialize)]
struct ProductParameters(BTreeMap<ProductParameterId, ProductParameterOptions>);

#[derive(Debug, Clone, PartialEq, PartialOrd, Serialize, Deserialize)]
#[serde(untagged)]
enum ProductParameterValue {
    Number(f64),
    Boolean(bool),
    Choice(String),
}

#[derive(Debug, Clone, PartialEq, PartialOrd, Serialize, Deserialize)]
struct ProductParameterValues(BTreeMap<String, ProductParameterValue>);

#[derive(Debug, Clone, PartialEq, PartialOrd, Serialize, Deserialize)]
struct ProductPresetValue {
    label: String,
    #[serde(flatten)]
    values: ProductParameterValues,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
struct ProductPresetId(String);

#[derive(Debug, Clone, PartialEq, PartialOrd, Serialize, Deserialize)]
struct ProductPresets(BTreeMap<ProductPresetId, ProductPresetValue>);

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProductAssemblyMeta {
    parameters: ProductParameters,
    presets: ProductPresets,
}

#[tauri::command]
async fn get_product_assembly_meta(product_path: PathBuf) -> Result<ProductAssemblyMeta> {
    let product_assembly_meta_path = product_path.join("assembly.toml");
    let product_assembly_meta_string =
        tokio::fs::read_to_string(product_assembly_meta_path).await?;
    let product_assembly_meta: ProductAssemblyMeta =
        toml::from_str(&product_assembly_meta_string).map_err(Error::ParseToml)?;
    Ok(product_assembly_meta)
}
*/

/**
 * https://stackoverflow.com/questions/38304401/javascript-check-if-dictionary/71975382#71975382
 */
export function isDictionary(object: unknown): object is Record<keyof never, unknown> {
  return object instanceof Object && object.constructor === Object
}

/**
 * https://stackoverflow.com/a/75010148/12468111
 */
export function mapKeysDeep(
  object: Record<keyof never, unknown>,
  callback: (key: string, value: unknown) => keyof never,
): Record<string, unknown> {
  const nextObject: Record<keyof never, unknown> = {}
  for (const [key, value] of Object.entries(object)) {
    nextObject[callback(key, value)] = iterate(value)
  }
  return nextObject

  function iterate(value: unknown): unknown {
    if (isDictionary(value)) {
      return mapKeysDeep(value, callback)
    }

    if (Array.isArray(value)) {
      return value.map(iterate)
    }

    return value
  }
}
