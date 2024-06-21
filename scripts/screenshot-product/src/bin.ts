#!/usr/bin/env -S npx tsx

import { readFile, readdir } from 'node:fs/promises'
import http from 'node:http'
import { join } from 'node:path'
import puppeteer from 'puppeteer'
import serve from 'serve-handler'
import Toml from 'smol-toml'

const PORT = 8678

const server = http.createServer((request, response) => {
  return serve(request, response, {
    public: join(import.meta.dirname, '../dist/'),
  })
})

server.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`)
})

const browser = await puppeteer.launch({ headless: false })

const workspaceDir = join(import.meta.dirname, '../../../../products')
const productsDir = join(workspaceDir, 'products')
for (const productId of await readdir(productsDir)) {
  const productDir = join(productsDir, productId)
  const productMetaPath = join(productDir, 'villagekit.toml')
  const productMetaStr = await readFile(productMetaPath, 'utf8')
  const productMeta = Toml.parse(productMetaStr).product

  // @ts-ignore
  const productCodePath = join(productDir, productMeta.exports)
  const productCode = await readFile(productCodePath, 'utf8')

  const qs = `meta=${encodeURIComponent(JSON.stringify(productMeta))}&code=${encodeURIComponent(productCode)}`
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:${PORT}?${qs}`)

  /*
  // wait 10 seconds
  await new Promise((resolve) => setTimeout(resolve, 20000))

  const screenshotPath = join(productDir, 'screenshot.png')
  await page.screenshot({
    path: screenshotPath,
    omitBackground: true,
  })
  */

  break
}

// await browser.close()
server.close()
