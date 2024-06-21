#!/usr/bin/env -S npx tsx

import http from 'node:http'
import { join } from 'node:path'
import serve from 'serve-handler'
// import puppeteer from 'puppeteer'

const PORT = 8678

const server = http.createServer((request, response) => {
  return serve(request, response, {
    public: join(import.meta.dirname, '../dist/'),
  })
})

server.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`)
})

/*
const browser = await puppeteer.launch({ headless: false })
const page = await browser.newPage()
await page.goto(`https://localhost:${PORT}`, {
  waitUntil: 'networkidle2',
})
await page.screenshot({
  path: 'screenshot.png',
})

await browser.close()
*/

// server.close()
