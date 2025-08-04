import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const cfg = JSON.parse(await fs.readFile(resolve(root, 'routes/routes.config.json'), 'utf8'))

const groups = Object.entries(cfg.routes)
const items = groups
  .map(([locale, routes]) => {
    const list = routes
      .map((r) => {
        const anchors = (r.anchors || [])
          .map((a) => `<li><a href="${r.path}#${a.id}">${a.title}</a></li>`)
          .join('')
        const anchorBlock = anchors ? `<ul>${anchors}</ul>` : ''
        return `<li><a href="${r.path}">${r.title}</a>${anchorBlock}</li>`
      })
      .join('')
    return `<section><h2>${locale.toUpperCase()}</h2><ul>${list}</ul></section>`
  })
  .join('')

const html = `<!doctype html><html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sitemap</title><link rel="stylesheet" href="/css/tokens.css">
</head><body>
  <main class="container">
    <h1>Sitemap</h1>
    <p>XML sitemap: <a href="/sitemap.xml">/sitemap.xml</a></p>
    ${items}
  </main>
</body></html>`

await fs.mkdir(dist, { recursive: true })
await fs.writeFile(resolve(dist, 'sitemap.html'), html, 'utf8')
console.log('✔ sitemap.html written')
