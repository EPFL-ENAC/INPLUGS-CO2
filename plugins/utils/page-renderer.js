import { writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { minify } from "html-minifier-terser";
import {
  getRoutePath,
  getPageKey,
  getAllRoutePaths,
  makeTranslator,
  rewriteLinksWithRoutes,
  loadLocaleData,
  loadMetaData,
  getRouteProperty,
} from "../utils/locale-utils.js";

export class PageRenderer {
  constructor(options = {}) {
    this.outputDir = options.outputDir || "dist";
    this.pagesDir = options.pagesDir || "src/pages";
    this.dataDir = options.dataDir || "src/data";
    this.locales = options.locales || ["en", "fr"];
    this.defaultLocale = options.defaultLocale || "en";
    this.localesMeta = options.localesMeta || {};
    this.linkRewrite = options.linkRewrite || "safety-net";
    this.env = options.env; // Nunjucks environment
    this.isProduction = false;
    this.assetHashes = {};
    this.fileMTime = new Map();
    this.currentTranslator = null;
  }

  setProduction(isProduction) {
    this.isProduction = isProduction;
  }

  setNunjucksEnv(env) {
    this.env = env;
  }

  setAssetHashes(assetHashes) {
    this.assetHashes = assetHashes;
  }

  setCurrentTranslator(translator) {
    this.currentTranslator = translator;
    if (this.env) {
      this.env.addGlobal("t", translator);
    }
  }

  // Check if file is stale for incremental rebuilds
  isStale(file) {
    if (!existsSync(file)) return false;
    const m = statSync(file).mtimeMs;
    const prev = this.fileMTime.get(file);
    this.fileMTime.set(file, m);
    return prev !== m;
  }

  // Render one page for a specific locale
  async renderOne({
    relTemplate,
    baseRel,
    locale,
    availableLocales,
    localeData,
    routesConfig,
    metaData,
  }) {
    const templateName = "pages/" + relTemplate;
    const pageKey = getPageKey(baseRel);

    // Get the route path for this page and locale
    const routePath = getRoutePath(pageKey, locale, routesConfig);
    if (!routePath) {
      console.warn(
        `No route found for page key "${pageKey}" in locale "${locale}"`,
      );
      return;
    }

    // Get route data to access theme color
    const routes = routesConfig.routes || [];
    const currentRoute = routes.find((r) => r.key === pageKey);
    // Use getRouteProperty to handle both primitive and object values
    const themeColor = currentRoute
      ? getRouteProperty(currentRoute, "themeColor", locale)
      : undefined;

    // Convert route path to file path (remove leading slash, ensure .html extension)
    let filePath = routePath.replace(/^\//, "").replace(/\/$/, "");
    if (!filePath) filePath = "index";

    // For index routes, place them in the locale directory structure
    if (filePath === "en" || filePath === "fr") {
      filePath = filePath + "/index";
    }

    if (!filePath.endsWith(".html")) filePath += ".html";

    // Get all route paths for this page across locales for navigation
    const allRoutePaths = getAllRoutePaths(pageKey, routesConfig);

    // Include all configured locales in alternates for navigation
    const alternates = [...this.locales];
    const meta = this.localesMeta[locale] || {};

    // Create translator for this locale
    const translator = makeTranslator(localeData, locale, this.defaultLocale);

    // Set the global translator for this render
    this.setCurrentTranslator(translator);
    try {
      // Get navigation items from routes config for current locale
      const navItemsMap = {};
      const navItems = (routesConfig.routes || [])
        .filter((route) => {
          // Check if route is hidden for this locale
          const hidden = getRouteProperty(route, "hidden", locale);
          return !hidden;
        })
        .map((route) => {
          // Transform route for this locale
          const result = {
            ...route,
            key: route.key,
            path: getRoutePath(route.key, locale, routesConfig),
            title: getRouteProperty(route, "title", locale),
            themeColor: getRouteProperty(route, "themeColor", locale),
            anchors: getRouteProperty(route, "anchors", locale),
          };
          navItemsMap[result.key] = result;
          return result;
          });

      let html = this.env.render(templateName, {
        locale,
        locales: this.locales,
        alternates, // for hreflang UI
        defaultLocale: this.defaultLocale,
        rtl: meta.rtl || ["ar", "he", "fa", "ur"].includes(locale),
        isProduction: this.isProduction, // Add production flag for template
        ...this.assetHashes, // Add asset hashes (cssHash, jsHash, imgHash)
        t: translator, // Function access: t("homepage.title")
        // Also provide object access for backward compatibility
        ...Object.fromEntries(
          Object.entries(
            localeData[locale] || localeData[this.defaultLocale] || {},
          ),
        ),
        navItems, // Navigation items from routes config
        navItemsMap, // Navigation items map for easy access by key
        meta: metaData, // Meta data from meta.json
        currentPage: routePath,
        themeColor, // Page-specific theme color
        page: {
          slug: pageKey,
          key: pageKey,
          path: routePath,
          url: routePath, // Add url property for templates that expect it
          routes: allRoutePaths, // All localized paths for this page
        },
        // Add eleventy-like object for compatibility
        eleventy: {
          generator: "Multi-locale Static Site Generator v1.0",
        },
        isCurrentLocale: (l) => l === locale,
        getLocalizedUrl: (pageKeyOrPath, targetLocale = locale) => {
          // If it's a page key, look up the route
          const targetRoute = getRoutePath(
            pageKeyOrPath,
            targetLocale,
            routesConfig,
          );
          if (targetRoute) return targetRoute;

          // Otherwise try to convert existing path
          const cleanPath = pageKeyOrPath.replace(/^\/([a-z]{2})\//, "");
          return `/${targetLocale}/${cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath}`;
        },
        // Helper function to get route for a specific page key and locale
        getRouteUrl: (pageKey, targetLocale = locale) => {
          return getRoutePath(pageKey, targetLocale, routesConfig) || "#";
        },
      });

      // Update link rewriting to be aware of routes
      html = rewriteLinksWithRoutes(
        html,
        locale,
        routesConfig,
        this.linkRewrite,
      );

      // Minify HTML in production
      if (this.isProduction) {
        html = await minify(html, {
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          sortClassName: true,
          useShortDoctype: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          preserveLineBreaks: false,
          minifyCSS: true,
          minifyJS: true,
        });
      }

      // Create output directory structure based on route path
      const outputPath = join(this.outputDir, dirname(filePath));
      if (!existsSync(outputPath)) {
        mkdirSync(outputPath, { recursive: true });
      }

      // Write the file
      const outputFile = join(this.outputDir, filePath);
      writeFileSync(outputFile, html);
      console.log(`  ✓ ${routePath} → ${filePath}`);
    } catch (err) {
      console.error(`  ✗ Error rendering ${routePath}:`, err.message);
    } finally {
      // Reset global translator
      this.setCurrentTranslator(null);
    }
  }

  // Rebuild specific base page for incremental builds
  async rebuildBase(base, localeData, routesConfig, metaData, byBaseMap) {
    const entry = byBaseMap.get(base);
    if (entry) {
      for (const locale of this.locales) {
        const relTemplate = entry.variants[locale] || entry.default;
        if (!relTemplate) continue;
        await this.renderOne({
          relTemplate,
          baseRel: base,
          locale,
          availableLocales: Object.keys(entry.variants),
          localeData,
          routesConfig,
          metaData,
        });
      }
    }
  }
}
