import { writeFileSync } from "fs";
import { join } from "path";
import nunjucks from "nunjucks";
import { getRoutePath, getAllRoutePaths } from "../utils/locale-utils.js";

export class SitemapGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || "dist";
    this.siteUrl = options.siteUrl || "https://example.com";
    this.locales = options.locales || ["en", "fr"];

    // Configure Nunjucks for template rendering
    this.nunjucksEnv = nunjucks.configure("plugins/templates", {
      autoescape: false, // We want raw XML output
      watch: false,
    });
  }

  // Generate localized sitemaps
  buildSitemaps(routesConfig) {
    // Build alternate routes map for hreflang
    const alternateRoutes = new Map();
    const routes = routesConfig.routes || [];

    // First pass: collect all routes by base route
    for (const locale of this.locales) {
      for (const route of routes) {
        const routePath = getRoutePath(route.key, locale, routesConfig);
        if (routePath) {
          const baseRoute = route.baseRoute || routePath;
          if (!alternateRoutes.has(baseRoute)) {
            alternateRoutes.set(baseRoute, {});
          }
          alternateRoutes.get(baseRoute)[locale] = {
            ...route,
            path: routePath,
          };
        }
      }
    }

    // Generate per-locale sitemaps
    for (const locale of this.locales) {
      const sitemapRoutes = routes
        .map((route) => {
          const routePath = getRoutePath(route.key, locale, routesConfig);
          if (routePath) {
            return {
              ...route,
              path: routePath,
              baseRoute: route.baseRoute || routePath,
            };
          }
          return null;
        })
        .filter((route) => route !== null);

      const sitemapXml = this.nunjucksEnv.render("sitemap.xml.njk", {
        routes: sitemapRoutes,
        siteUrl: this.siteUrl,
        lastmod: new Date().toISOString().split("T")[0],
        alternateRoutes: Object.fromEntries(alternateRoutes),
      });

      writeFileSync(join(this.outputDir, `sitemap-${locale}.xml`), sitemapXml);
      console.log(`  ✓ sitemap-${locale}.xml`);
    }

    // Generate sitemap index
    const sitemapItems = this.locales.map((locale) => ({
      loc: `${this.siteUrl}/sitemap-${locale}.xml`,
      lastmod: new Date().toISOString().split("T")[0],
    }));

    const sitemapIndex = this.nunjucksEnv.render("sitemap-index.xml.njk", {
      sitemaps: sitemapItems,
    });

    writeFileSync(join(this.outputDir, `sitemap-index.xml`), sitemapIndex);
    console.log(`  ✓ sitemap-index.xml`);
  }
}
