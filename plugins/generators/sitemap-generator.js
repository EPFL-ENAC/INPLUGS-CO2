import { writeFileSync } from 'fs'
import { join } from 'path'
import nunjucks from 'nunjucks'

export class SitemapGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || 'dist'
    this.siteUrl = options.siteUrl || 'https://example.com'
    this.locales = options.locales || ['en', 'fr']
    
    // Configure Nunjucks for template rendering
    this.nunjucksEnv = nunjucks.configure('plugins/templates', {
      autoescape: false, // We want raw XML output
      watch: false
    })
  }

  // Generate localized sitemaps
  buildSitemaps(routesConfig) {
    // Build alternate routes map for hreflang
    const alternateRoutes = new Map()
    const routes = routesConfig.routes || {}
    
    // First pass: collect all routes by base route
    for (const locale of this.locales) {
      const localeRoutes = routes[locale] || []
      for (const route of localeRoutes) {
        const baseRoute = route.baseRoute || route.path
        if (!alternateRoutes.has(baseRoute)) {
          alternateRoutes.set(baseRoute, {})
        }
        alternateRoutes.get(baseRoute)[locale] = route
      }
    }

    // Generate per-locale sitemaps
    for (const locale of this.locales) {
      const localeRoutes = routes[locale] || []
      const sitemapRoutes = localeRoutes.map(route => ({
        ...route,
        baseRoute: route.baseRoute || route.path
      }))
      
      const sitemapXml = this.nunjucksEnv.render('sitemap.xml.njk', {
        routes: sitemapRoutes,
        siteUrl: this.siteUrl,
        lastmod: new Date().toISOString().split('T')[0],
        alternateRoutes: Object.fromEntries(alternateRoutes)
      })
      
      writeFileSync(join(this.outputDir, `sitemap-${locale}.xml`), sitemapXml)
      console.log(`  ✓ sitemap-${locale}.xml`)
    }

    // Generate sitemap index
    const sitemapItems = this.locales.map(locale => ({
      loc: `${this.siteUrl}/sitemap-${locale}.xml`,
      lastmod: new Date().toISOString().split('T')[0]
    }))
    
    const sitemapIndex = this.nunjucksEnv.render('sitemap-index.xml.njk', {
      sitemaps: sitemapItems
    })
    
    writeFileSync(join(this.outputDir, `sitemap-index.xml`), sitemapIndex)
    console.log(`  ✓ sitemap-index.xml`)
  }
}
