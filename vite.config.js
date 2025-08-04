import { defineConfig } from 'vite'
import { resolve, sep } from 'node:path'
import fs from 'node:fs'
import nunjucks from 'nunjucks'
import nunjucksPlugin from 'vite-plugin-nunjucks'
import ssinc from 'vite-plugin-ssinc'
import Sitemap from 'vite-plugin-sitemap'
import Critical from 'rollup-plugin-critical'

// ---------- env ----------
const ALLOW = process.env.VITE_ALLOW_INDEXING === 'true'
const HOSTNAME = process.env.VITE_SITE_HOSTNAME || 'https://app.mydomain.com'

// ---------- catalogs ----------
const catalogs = {
  en: JSON.parse(fs.readFileSync('./i18n/en.json', 'utf8')),
  fr: JSON.parse(fs.readFileSync('./i18n/fr.json', 'utf8')),
}
const get = (obj, path) => path.split('.').reduce((o, k) => (o || {})[k], obj)

// ---------- routes manifest (for hreflang alternates) ----------
const routesCfg = JSON.parse(fs.readFileSync('./routes/routes.config.json', 'utf8'))
const locales = routesCfg.locales

// Build lookup: by locale -> key -> { path, title }
const byLocaleKey = {}
for (const loc of locales) {
  byLocaleKey[loc] = {}
  for (const r of routesCfg.routes[loc]) byLocaleKey[loc][r.key] = { path: r.path, title: r.title }
}

// ---------- inputs (MPA) ----------
const inputs = {
  root: 'index.html',
  enHome: 'en/index.html',
  frHome: 'fr/index.html',
  enGcs: 'en/gcs/index.html',
  frGcs: 'fr/gcs/index.html',
  enData: 'en/data/index.html',
  frData: 'fr/data/index.html',
  enEdu: 'en/education/index.html',
  frEdu: 'fr/education/index.html',
  enDict: 'en/dictionary/index.html',
  frDict: 'fr/dictionnaire/index.html',
  enLinks: 'en/useful-links/index.html',
  frLinks: 'fr/liens-utiles/index.html',
  enAbout: 'en/about/index.html',
  frAbout: 'fr/a-propos/index.html',
  enContact: 'en/contact/index.html',
  frContact: 'fr/contact/index.html',
}

const fileToPath = (f) => {
  if (f === 'index.html') return '/'
  const p = '/' + f.replace(/\\/g, '/').replace(/index\.html$/, '')
  return p.endsWith('/') ? p : p + '/'
}

// Find route key for a given (locale, path) by scanning manifest once
const pathToKey = {}
for (const loc of locales) {
  for (const r of routesCfg.routes[loc]) pathToKey[`${loc}:${r.path}`] = r.key
}

// Per-entry variables for Nunjucks (locale, catalog, pagePath, alternates, allowIndexing, hostname)
const variables = Object.fromEntries(
  Object.values(inputs).map((file) => {
    const path = fileToPath(file)
    // infer locale from path
    const isFr = path.startsWith('/fr/')
    const isEn = path.startsWith('/en/') || path === '/'
    const locale = isFr ? 'fr' : 'en'
    const key = pathToKey[`${locale}:${path}`] || 'home'
    // alternates array across locales (prod hostname)
    const alternates = locales
      .filter((l) => byLocaleKey[l][key])
      .map((l) => ({ hreflang: l, href: `${HOSTNAME}${byLocaleKey[l][key].path}` }))
    // add x-default pointing to default locale
    alternates.push({
      hreflang: 'x-default',
      href: `${HOSTNAME}${byLocaleKey['en'][key]?.path || '/en/'}`,
    })
    return [
      file,
      {
        locale,
        catalog: catalogs[locale],
        pagePath: path,
        alternates,
        allowIndexing: ALLOW,
        hostname: HOSTNAME,
      },
    ]
  })
)

// ---------- Nunjucks env with t() ----------
const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader([
    resolve(process.cwd()),
    resolve(process.cwd(), 'html'),
    resolve(process.cwd(), 'public'),
  ]),
  { noCache: true }
)
env.addGlobal('t', function (key) {
  const { catalog } = this.getVariables()
  return get(catalog, key) ?? `⟦${key}⟧`
})

export default defineConfig({
  plugins: [
    nunjucksPlugin({
      templatesDir: resolve(process.cwd()),
      variables,
      nunjucksEnvironment: env,
    }),
    ssinc({ includeExtensions: ['html', 'shtml'] }),
    ...(ALLOW
      ? [
          Sitemap({
            hostname: HOSTNAME,
            i18n: { defaultLanguage: 'en', languages: ['en', 'fr'], strategy: 'prefix' },
            generateRobotsTxt: true,
            readable: true,
          }),
        ]
      : []),
    Critical({
      criticalBase: 'dist/',
      criticalPages: [
        { uri: '', template: 'index' },
        { uri: 'en/', template: 'en/index' },
        { uri: 'fr/', template: 'fr/index' },
        { uri: 'en/gcs/', template: 'en/gcs/index' },
        { uri: 'fr/gcs/', template: 'fr/gcs/index' },
        { uri: 'en/education/', template: 'en/education/index' },
        { uri: 'fr/education/', template: 'fr/education/index' },
      ],
      criticalConfig: { width: 1200, height: 900 },
    }),
  ],
  build: {
    rollupOptions: {
      input: Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, resolve(__dirname, v)])),
    },
  },
  server: {
    watch: { paths: ['public/partials/**', 'css/**', 'i18n/**', 'routes/**', 'public/js/**'] },
  },
})
