#!/usr/bin/env -S npx tsx

import { readFile, readdir } from 'node:fs/promises'
import http from 'node:http'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { type ArgscloptsParseArgsOptionsConfig, printHelpText } from 'argsclopts'
import puppeteer from 'puppeteer'
import serve from 'serve-handler'
import Toml from 'smol-toml'

const PORT = 8678

const pkgPath = join(import.meta.dirname, '../package.json')

const argsOptions: ArgscloptsParseArgsOptionsConfig = {
  workspace: {
    type: 'string',
    short: 'w',
    help: 'The Village Kit workspace to generate screenshots for',
  },
  help: {
    type: 'boolean',
    short: 'h',
    help: 'Print command usage',
  },
}

const args = process.argv.slice(2)
const { values } = parseArgs({ args, options: argsOptions })

if (values.help) {
  await printHelpText({ options: argsOptions, pkgPath })
} else {
  await run()
}

async function run() {
  const server = http.createServer((request, response) => {
    return serve(request, response, {
      public: join(import.meta.dirname, '../dist/'),
      directoryListing: false,
    })
  })

  server.listen(PORT, () => {
    // console.log(`Running at http://localhost:${PORT}`)
  })

  const browser = await puppeteer.launch()

  const workspaceDir = join(import.meta.dirname, '../../../../products')
  const productsDir = join(workspaceDir, 'products')
  for (const productId of await readdir(productsDir)) {
    console.log(`Capturing screenshot of ${productId}`)
    const productDir = join(productsDir, productId)
    const productMetaPath = join(productDir, 'villagekit.toml')
    const productMetaStr = await readFile(productMetaPath, 'utf8')
    const productMeta = Toml.parse(productMetaStr).product

    // @ts-ignore
    const productCodePath = join(productDir, productMeta.exports)
    const productCode = await readFile(productCodePath, 'utf8')

    const qs = `meta=${encodeURIComponent(btoa(JSON.stringify(productMeta)))}`
    const hash = btoa(productCode)
    const page = await browser.newPage()
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 })
    await page.goto(`http://localhost:${PORT}?${qs}#${hash}`)

    // wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const screenshotPath = join(productDir, `${productId}.png`)
    console.log(`Writing screenshot to ${screenshotPath}`)
    await page.screenshot({
      path: screenshotPath,
      omitBackground: true,
    })
  }

  await browser.close()
  server.close()
}
