import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'

const allow = process.env.VITE_ALLOW_INDEXING === 'true'
const dist = resolve(process.cwd(), 'dist')

if (!allow) {
  const robots = `User-agent: *\nDisallow: /\n`
  await fs.writeFile(resolve(dist, 'robots.txt'), robots, 'utf8')
  console.log('✔ Wrote staging robots.txt (Disallow: /)')
} else {
  console.log('➜ Production build: robots.txt handled by vite-plugin-sitemap')
}
