import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import fs from 'node:fs'
import nunjucks from 'nunjucks'
import nunjucksPlugin from 'vite-plugin-nunjucks'
import ssinc from 'vite-plugin-ssinc'

// ---------- env ----------
const ALLOW = process.env.VITE_ALLOW_INDEXING === 'true'
const HOSTNAME = process.env.VITE_SITE_HOSTNAME || 'https://app.mydomain.com'

// ---------- catalogs ----------
const catalogs = {
  en: JSON.parse(fs.readFileSync('./i18n/en.json', 'utf8')),
  fr: JSON.parse(fs.readFileSync('./i18n/fr.json', 'utf8'))
}
const get = (obj, path) => path.split('.').reduce((o, k) => (o || {})[k], obj)

// ---------- routes manifest (for hreflang alternates) ----------
const routesCfg = JSON.parse(fs.readFileSync('./routes/routes.config.json', 'utf8'))
const locales = routesCfg.locales

// Build lookup: by locale -> key -> { path, title }
const byLocaleKey = {}
for (const loc of locales) {
  byLocaleKey[loc] = {}
  for (const route of routesCfg.routes[loc]) {
    byLocaleKey[loc][route.key] = { path: route.path, title: route.title }
  }
}

// ---------- Variables for each page/locale combo ----------
const variables = Object.fromEntries(
  locales.flatMap(locale =>
    routesCfg.routes[locale].map(({ path, key }) => {
      // Convert /en/about/ to en_about.html for file naming
      const sanitizedPath = path.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '_')
      const fileName = (sanitizedPath || `${locale}_index`) + '.html'
      
      // alternates array across locales (prod hostname)
      const alternates = locales
        .filter(l => byLocaleKey[l][key])
        .map(l => ({ hreflang: l, href: `${HOSTNAME}${byLocaleKey[l][key].path}` }))
      // add x-default pointing to default locale
      alternates.push({ hreflang: 'x-default', href: `${HOSTNAME}${byLocaleKey['en'][key]?.path || '/en/'}` })
      
      return [fileName, { 
        locale, 
        catalog: catalogs[locale], 
        pagePath: path, 
        alternates, 
        allowIndexing: ALLOW, 
        hostname: HOSTNAME,
        // Add individual catalog values for easier access
        ...catalogs[locale]
      }]
    })
  )
)

// ---------- Nunjucks env with t() ----------
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader('./'), { noCache: true })
env.addGlobal('t', function (key) {
  const { catalog } = this.getVariables()
  return get(catalog, key) ?? `⟦${key}⟧`
})

// ---------- Build inputs for locale pages ----------
const buildInput = Object.fromEntries(
  locales.flatMap(locale =>
    routesCfg.routes[locale].map(({ path, key }) => {
      // Convert /en/about/ to en_about for file naming
      const sanitizedPath = path.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '_')
      const outputName = sanitizedPath || `${locale}_index`
      
      // Map to the template that corresponds to this route
      const templateFile = `templates/${key}.html`
      
      return [outputName, resolve(process.cwd(), templateFile)]
    })
  )
)

export default defineConfig({
  plugins: [
    nunjucksPlugin({
      templatesDir: resolve(process.cwd()),
      variables,
      nunjucksEnvironment: env,
      nunjucksOptions: { noCache: true }
    }),
    ssinc()
  ].filter(Boolean),
  build: {
    rollupOptions: {
      input: buildInput,
      output: {
        entryFileNames: (chunkInfo) => {
          // Extract locale and page from the chunk name
          const name = chunkInfo.name
          
          if (name === 'en') {
            return 'en/index.html'
          } else if (name.startsWith('en_')) {
            const pageName = name.replace('en_', '')
            return `en/${pageName}.html`
          } else if (name === 'fr') {
            return 'fr/index.html'
          } else if (name.startsWith('fr_')) {
            const pageName = name.replace('fr_', '')
            return `fr/${pageName}.html`
          }
          
          return '[name].html'
        }
      }
    }
  },
  // Exclude root HTML files from automatic entry point detection
  server: {
    fs: {
      strict: false
    }
  }
})
