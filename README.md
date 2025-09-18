# 🌍 INPLUGS-CO2

## Vite SSR Nunjucks i18n Basic

[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Nunjucks](https://img.shields.io/badge/Nunjucks-3.2+-1C4913?style=for-the-badge&logo=nunjucks&logoColor=white)](https://mozilla.github.io/nunjucks/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://github.com/EPFL-ENAC/INPLUGS-CO2)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)](https://github.com/EPFL-ENAC/INPLUGS-CO2/graphs/commit-activity)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> A modern, fast, and SEO-friendly multi-locale static site generator powered by Vite and Nunjucks

## ✨ Features

- 🌍 **Multi-locale support** - Generate static sites in multiple languages
- ⚡ **Lightning fast** - Powered by Vite for instant HMR and fast builds
- 🎨 **Template inheritance** - Clean Nunjucks templating system
- 📱 **SEO optimized** - Static HTML generation with hreflang tags and localized sitemaps
- 🔥 **Hot reloading** - Real-time updates during development with incremental rebuilds
- 🗜️ **Production ready** - HTML minification and optimization
- 🧭 **Smart routing** - Automatic browser language detection with cookie persistence
- 🔧 **Flexible URLs** - Access pages with or without .html extension
- 🎯 **Zero config** - Works out of the box with sensible defaults
- 📄 **Co-located variants** - Support for page-specific locale variants (`about.fr.njk`)
- 🌐 **Fallback system** - Automatic fallback to default locale for missing translations
- 🔗 **Smart link rewriting** - Automatic locale-aware link conversion
- 📊 **Advanced SEO** - Localized sitemaps, 404 pages, and canonical URLs
- 🍪 **User preference** - Cookie-based language preference with query override

## 🚀 Quick Start

```bash
# Clone the repository
git clone git@github.com:EPFL-ENAC/INPLUGS-CO2.git
cd INPLUGS-CO2

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
├── public/                # Static assets served directly
│   ├── assets/            # Public assets (fonts, icons, images)
│   │   ├── fonts/         # Web fonts
│   │   ├── icons/         # SVG icons
│   │   └── images/        # Static images
│   └── js/                # Client-side JavaScript files
├── src/
│   ├── assets/            # Source assets (processed during build)
│   │   ├── images/        # Images that get optimized
│   │   └── js/            # JavaScript files that get processed
│   ├── data/              # Translation files
│   │   ├── en.json        # English translations
│   │   └── fr.json        # French translations
│   ├── layouts/           # Page layouts
│   │   └── main.njk       # Main layout template
│   ├── pages/             # Page templates (edit these!)
│   │   ├── landing_page.njk  # Home page
│   │   └── about.njk      # About page
│   └── partials/          # Reusable components
│       ├── navbar.njk     # Navigation with language switcher
│       └── footer.njk     # Site footer
├── dist/                  # Generated output (production)
│   ├── index.html         # Root redirect page
│   ├── en/                # English pages
│   └── fr/                # French pages
├── plugins/
│   ├── multi-locale-plugin.js  # Custom Vite plugin
│   ├── generators/        # Generator modules
│   └── utils/             # Utility modules
├── routes.config.json     # Routes configuration
├── vite.config.js         # Vite configuration
└── package.json
```

## 🎯 Usage

### Adding New Pages

1. Create a new template in `src/pages/`:

```bash
touch src/pages/contact.njk
```

2. Add the page content:

```html
{% extends "main.njk" %} {% block content %}
<h1>{{ t("contact.title") }}</h1>
<p>{{ t("contact.description") }}</p>
{% endblock %}
```

3. Add translations to your locale files:

```json
// src/data/en.json
{
  "contact": {
    "title": "Contact Us",
    "description": "Get in touch with our team"
  }
}
```

4. The page will automatically generate as:
   - `/en/contact.html`
   - `/fr/contact.html`

### Co-located Page Variants

Create locale-specific versions of pages when you need different content:

```bash
# Default page (fallback for all locales)
src/pages/about.njk

# French-specific version
src/pages/about.fr.njk

# German-specific version
src/pages/about.de.njk
```

The plugin will:

- Use the locale-specific version if available
- Fall back to the default version for missing locales
- Include all available variants in `alternates` for hreflang tags

### Adding New Locales

1. Create a new translation file:

```bash
touch src/data/de.json
```

2. Add the locale to your Vite config:

```javascript
// vite.config.js
locales: ['en', 'fr', 'de'],
localesMeta: {
  en: { name: 'English', rtl: false },
  fr: { name: 'Français', rtl: false },
  de: { name: 'Deutsch', rtl: false }
}
```

3. Your site will now generate German pages automatically!

### Template Features

#### Translation Function

```html
{{ t("homepage.title") }}
<!-- Function call with nested keys -->
{{ t("homepage.greeting", { name: "John" }) }}
<!-- With parameters -->
{{ t("missing.key") }}
<!-- Fallback to key if not found -->
```

#### Locale Helpers

```html
{{ locale }}
<!-- Current locale (en, fr, etc.) -->
{{ currentLocale }}
<!-- Same as locale -->
{{ defaultLocale }}
<!-- Default locale -->
{{ locales }}
<!-- Array of all locales -->
{{ alternates }}
<!-- Array of available locales for this page -->
{{ rtl }}
<!-- Boolean: is right-to-left language -->
```

#### Helper Functions

```html
{% if locale == "loc" %}class="active"{% endif %}
```

#### SEO and Navigation

```html
<!-- In your layout template -->
{% for l in alternates %}
<link
  rel="alternate"
  hreflang="{{ l }}"
  href="{{ getLocalizedUrl(currentPage, l) }}"
/>
{% endfor %}
<link
  rel="alternate"
  hreflang="x-default"
  href="{{ getLocalizedUrl(currentPage, defaultLocale) }}"
/>

<!-- Language switcher -->
{% for loc in alternates %}
<a
  href="{{ getLocalizedUrl(currentPage, loc) }}"
  {%
  if
  locale=""
  ="loc"
  %}class="active"
  {%
  endif
  %}
>
  {{ loc | upper }}
</a>
{% endfor %}
```

## ⚙️ Configuration

### Routes Configuration

The routes are configured in `routes.config.json` using a more efficient structure with defaults and locale-specific values:

```json
{
  "hostname": "https://app.mydomain.com",
  "locales": ["en", "fr"],
  "basePath": {
    "en": "/en",
    "fr": "/fr"
  },
  "routes": [
    {
      "key": "landing_page",
      "path": "/",
      "title": {
        "en": "Home",
        "fr": "Accueil"
      },
      "themeColor": "#00aad8"
    },
    {
      "key": "about",
      "path": {
        "en": "/about",
        "fr": "/a-propos"
      },
      "title": {
        "en": "About",
        "fr": "À propos"
      },
      "themeColor": "#f97316"
    }
  ]
}
```

This structure:

- Uses a single array of routes with locale-specific properties
- Allows primitive values as defaults for all locales
- Supports object values with locale keys for locale-specific variations
- Includes a basePath configuration for each locale
- Reduces duplication while maintaining flexibility

### Plugin Options

```javascript
// vite.config.js
createMultiLocalePlugin({
  srcDir: "src", // Source directory
  pagesDir: "src/pages", // Page templates
  layoutsDir: "src/layouts", // Layout templates
  partialsDir: "src/partials", // Partial templates
  dataDir: "src/data", // Translation files
  outputDir: "dist", // Output directory
  defaultLocale: "en", // Default language
  locales: ["en", "fr"], // Supported languages
  siteUrl: "https://example.com", // For sitemaps and canonicals
  localesMeta: {
    // Locale metadata
    en: { name: "English", rtl: false },
    fr: { name: "Français", rtl: false },
    ar: { name: "العربية", rtl: true },
  },
  emitSitemaps: true, // Generate localized sitemaps
  emit404s: true, // Generate localized 404 pages
  linkRewrite: "safety-net", // Auto-rewrite root-relative links
});
```

### HTML Minification

In production builds, HTML is automatically minified with:

- ✅ Comment removal
- ✅ Whitespace collapse
- ✅ CSS minification
- ✅ JS minification
- ✅ Attribute optimization

## 🏗️ Build Output

### Development (`npm run dev`)

- Hot reloading with file watching
- Incremental rebuilds for changed files
- Unminified HTML for debugging
- Instant updates on file changes

### Production (`npm run build`)

```
dist/
├── index.html          # Root redirect (minified, with cookie support)
├── en/
│   ├── index.html      # English home (minified)
│   ├── about.html      # English about (minified)
│   └── 404.html        # English 404 page
├── fr/
│   ├── index.html      # French home (minified)
│   ├── about.html      # French about (minified)
│   └── 404.html        # French 404 page
├── sitemap-en.xml      # English sitemap
├── sitemap-fr.xml      # French sitemap
└── sitemap-index.xml   # Sitemap index
```

## 🌐 Browser Language Detection

The root `index.html` automatically redirects users to their preferred language with enhanced features:

```javascript
// Enhanced language detection with cookie persistence
const qs = new URLSearchParams(location.search);
const forced = qs.get("lang"); // Query parameter override (?lang=fr)
const supported = ["en", "fr"];
const COOKIE = "lang=";
const getCookie = () =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(COOKIE))
    ?.slice(COOKIE.length);

let lang =
  forced || getCookie() || (navigator.language || "").toLowerCase().slice(0, 2);
if (!supported.includes(lang)) lang = "en";
document.cookie = `lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`; // Remember for 1 year
location.replace("/" + lang + "/");
```

### Language Preference Features

- **Query Override**: `?lang=fr` forces French
- **Cookie Persistence**: Remembers user's choice for 1 year
- **Browser Detection**: Falls back to browser language
- **Graceful Fallback**: Uses default locale if unsupported

## 🚀 Advanced Features

### Translation System

The plugin provides a powerful translation system with:

- **Nested key support**: `t("homepage.greeting")`
- **Parameter interpolation**: `t("welcome", { name: "John" })`
- **Automatic fallback**: Missing translations fall back to default locale
- **Global Nunjucks function**: Available in all templates

### SEO Optimization

- **Localized sitemaps**: Separate sitemaps per locale + sitemap index
- **hreflang tags**: Automatic alternate language declarations
- **Canonical URLs**: Proper SEO structure for each locale
- **404 pages**: Localized error pages with template support

### Development Experience

- **Incremental rebuilds**: Only rebuild changed pages in development
- **Hot reloading**: Instant updates with Vite HMR
- **File watching**: Automatic detection of template, layout, and data changes
- **Error handling**: Clear error messages for template issues

### Link Management

- **Smart rewriting**: Automatic conversion of root-relative links (`/about/` → `/fr/about/`)
- **Helper functions**: `getLocalizedUrl()` for manual link generation
- **Safety net**: Optional automatic link rewriting for legacy content

## 📊 Performance

- ⚡ **Build time**: ~70ms for 4 pages + sitemaps + 404s
- 🗜️ **HTML compression**: ~40-60% size reduction in production
- 🚀 **HMR**: Instant hot reloading with incremental rebuilds
- 📦 **Bundle size**: Zero JavaScript in final output (pure static HTML)
- 🔄 **Smart caching**: File modification time tracking for efficient rebuilds
- 🎯 **Selective updates**: Only rebuild affected pages on template changes

## 🛠️ Scripts

| Command                    | Description                                 |
| -------------------------- | ------------------------------------------- |
| `npm run dev`              | Start development server with hot reloading |
| `npm run build`            | Build for production with minification      |
| `npm run preview`          | Preview production build locally            |
| `npm run serve`            | Alias for preview                           |
| `npm run lighthouse`       | Run full Lighthouse audit on all pages      |
| `npm run lighthouse:quick` | Quick Lighthouse test on single page        |
| `npm test`                 | Run build test to verify everything works   |

## 🔍 Performance Testing

This project includes comprehensive Lighthouse testing for performance, accessibility, SEO, and best practices:

```bash
# Run full audit on all pages
npm run lighthouse

# Quick test on single page
npm run lighthouse:quick

# Manual test any page
./lighthouse-test.sh /en/about.html
```

See [LIGHTHOUSE.md](LIGHTHOUSE.md) for detailed testing guide.

## 📚 Examples

### Creating a Contact Page with Form

```html
<!-- src/pages/contact.njk -->
{% extends "main.njk" %} {% block content %}
<h1>{{ t("contact.title") }}</h1>
<p>{{ t("contact.description") }}</p>

<form action="/{{ locale }}/submit" method="post">
  <label for="email">{{ t("contact.email") }}</label>
  <input type="email" id="email" name="email" required />

  <label for="message">{{ t("contact.message") }}</label>
  <textarea id="message" name="message" required></textarea>

  <button type="submit">{{ t("contact.send") }}</button>
</form>
{% endblock %}
```

### Adding RTL Language Support

```javascript
// vite.config.js
localesMeta: {
  en: { name: 'English', rtl: false },
  fr: { name: 'Français', rtl: false },
  ar: { name: 'العربية', rtl: true }
}
```

```html
<!-- Layout automatically handles RTL -->
<html lang="{{ locale }}" dir="{% if rtl %}rtl{% else %}ltr{% endif %}"></html>
```

### Custom 404 Pages

```html
<!-- src/pages/404.njk -->
{% extends "main.njk" %} {% block content %}
<h1>{{ t("error.404.title") }}</h1>
<p>{{ t("error.404.description") }}</p>
<a href="/{{ locale }}/">{{ t("navigation.home") }}</a>
{% endblock %}
```

## 🔧 Troubleshooting

### Common Issues

**Template Syntax Errors**

- Use Nunjucks syntax: `{% if locale == 'en' %}` not `{{ locale === 'en' }}`
- Function calls: `{{ t("key") }}` not `{{ t.key }}`

**Missing Translations**

- Check file encoding (UTF-8)
- Verify JSON syntax in translation files
- Use nested keys: `"homepage": { "title": "..." }`

**Module Import Issues**

- Ensure `"type": "module"` is in package.json
- Use ES6 import syntax consistently

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Nunjucks](https://mozilla.github.io/nunjucks/) - Rich templating language
- [html-minifier-terser](https://github.com/terser/html-minifier-terser) - HTML minification
- [Eleventy Plus Vite](https://github.com/matthiasott/eleventy-plus-vite) - Inspiration for SSG + Vite integration

## 🖥️ Deployment

### Nginx Configuration

This project includes production-ready Nginx configuration files for optimal performance:

- `nginx/nginx.conf` - Base Nginx configuration with security headers and gzip compression
- `nginx/site-prod.conf` - Production site configuration with canonical host setup
- `nginx/site-staging.conf` - Staging environment configuration with noindex headers

Key features of the Nginx configuration:

- **Security Headers**: HSTS, Content-Type sniffing protection, frame options, and permissions policy
- **Gzip Compression**: Enabled for text-based assets
- **Cache Control**: Long-term caching for static assets with immutable headers
- **Clean URLs**: Automatic resolution of URLs with or without `.html` extension
- **Health Endpoint**: Simple `/health` endpoint for monitoring
- **Redirect Handling**: Proper handling of trailing slashes and non-canonical hosts

To deploy with Docker:

```bash
# Build the image
docker build -t inplugs-co2 .

# Run with nginx configuration
docker run -d -p 80:80 inplugs-co2
```

### Docker Deployment

The project includes Docker configuration files:

- `Dockerfile` - Multi-stage build for production deployment
- `docker-compose.yml` - Docker Compose configuration for easy deployment
- `DockerfileOld` - Legacy Docker configuration (for reference)

## 📁 Asset Organization

### Public Assets

Assets are organized in the `public/assets/` directory:

- `fonts/` - Web fonts (Archivo and DM Sans families)
- `icons/` - SVG icons
- `images/` - Images organized by section (data, favicon, gcs, landing-page, logo)
- `js/` - Client-side JavaScript files

The asset pipeline automatically:

- Processes and optimizes images
- Generates WebP versions of images
- Creates hashed filenames for cache busting
- Copies assets to the distribution directory

### JavaScript Files

Client-side JavaScript files in `public/js/` provide interactive functionality:

- `navbar.js` - Responsive navigation with adaptive collapse
- `landing-page.js` - Landing page interactivity
- `gcs.js` - GCS-specific functionality
- `svg-animate.js` - SVG animation controls

These files are automatically included in the build process and optimized for production.

## 🔄 Routes Configuration

### JSON Schema

The `routes.config.json` file follows this comprehensive schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Website Configuration Schema",
  "description": "Schema for website configuration with internationalization support",
  "required": ["hostname", "locales", "basePath", "routes"],
  "properties": {
    "hostname": {
      "type": "string",
      "format": "uri",
      "description": "The base URL of the website"
    },
    "locales": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[a-z]{2}$"
      },
      "minItems": 1,
      "uniqueItems": true,
      "description": "List of supported locale codes (ISO 639-1)"
    },
    "basePath": {
      "type": "object",
      "description": "Base paths for each locale",
      "patternProperties": {
        "^[a-z]{2}$": {
          "type": "string",
          "pattern": "^/.*"
        }
      },
      "additionalProperties": false
    },
    "routes": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/route"
      },
      "minItems": 1,
      "description": "List of website routes"
    }
  },
  "definitions": {
    "route": {
      "type": "object",
      "required": ["key", "path"],
      "properties": {
        "key": {
          "type": "string",
          "description": "Unique identifier for the route"
        },
        "path": {
          "oneOf": [
            {
              "type": "string",
              "description": "Single path for all locales"
            },
            {
              "type": "object",
              "description": "Localized paths",
              "patternProperties": {
                "^[a-z]{2}$": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            }
          ]
        },
        "title": {
          "oneOf": [
            {
              "type": "string",
              "description": "Single title for all locales"
            },
            {
              "type": "object",
              "description": "Localized titles",
              "patternProperties": {
                "^[a-z]{2}$": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            }
          ]
        },
        "themeColor": {
          "type": "string",
          "pattern": "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|#FFF$",
          "description": "Theme color in hexadecimal format"
        },
        "hidden": {
          "type": "boolean",
          "description": "Whether the route is hidden from navigation"
        },
        "anchors": {
          "oneOf": [
            {
              "type": "object",
              "description": "Localized anchors",
              "patternProperties": {
                "^[a-z]{2}$": {
                  "type": "array",
                  "items": {
                    "$ref": "#/definitions/anchor"
                  }
                }
              },
              "properties": {
                "hidden": {
                  "type": "boolean",
                  "description": "Whether anchors are hidden"
                }
              },
              "additionalProperties": false
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "anchor": {
      "type": "object",
      "required": ["id", "title"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Anchor ID for linking"
        },
        "title": {
          "type": "string",
          "description": "Display title of the anchor"
        }
      },
      "additionalProperties": false
    }
  }
}
```

### How Routes Work

The routes configuration is processed by the multi-locale plugin and made available to Nunjucks templates:

1. **Loading**: The configuration is loaded from `routes.config.json` during build/development
2. **Processing**: Route paths are generated for each locale using the basePath configuration
3. **Template Integration**: The processed routes are passed to Nunjucks templates as `navItems`

### Navigation Generation

The navbar template (`src/partials/navbar.njk`) uses the routes configuration to dynamically generate navigation:

```html
{% for item in navItems %} {% if not item.hidden %}
<a
  href="{{ item.path }}"
  class="nav-{{ item.key }}"
  {%
  if
  page.key=""
  ="item.key"
  %}aria-current="page"
  {%
  endif
  %}
  data-nav-item="{{ item.key }}"
  >{{ item.title }}</a
>
{% endif %} {% endfor %}
```

Each navigation item includes:

- `key`: Unique identifier for the page
- `path`: Locale-specific URL path
- `title`: Translated page title
- `themeColor`: Page-specific theme color
- `anchors`: Section anchors for dropdown menus
- `hidden`: Flag to hide items from navigation

### Anchor Support

The `anchors` property enables dropdown navigation menus:

```json
"anchors": {
  "en": [
    { "id": "section1", "title": "Section 1" },
    { "id": "section2", "title": "Section 2" }
  ],
  "fr": [
    { "id": "section1", "title": "Section 1" },
    { "id": "section2", "title": "Section 2" }
  ]
}
```

This generates dropdown menus in the navbar with links to specific sections of a page.

## 📁 Public vs Assets Directories

Understanding the difference between the `public` and `src/assets` directories is crucial for proper asset management in this project. While both directories store static assets, they serve different purposes and undergo different processing during the build process.

### Overview of Both Directories

#### Public Directory

The `public` directory serves files directly at the root URL path without any build-time processing or optimization. Files placed in this directory are copied as-is to the output directory (`dist`) during the build process.

#### Src/Assets Directory

The `src/assets` directory contains source assets that get processed, bundled, minified, and hashed during the build process for optimization. These assets benefit from the project's custom asset processing pipeline.

### Historical Context

The distinction between `public` and `src/assets` directories evolved from the history of web development:

1. **Early web development** required manual file management where all resources lived in a simple public directory structure
2. **Emergence of JavaScript frameworks** created the need for code transformation (ES6→ES5, TypeScript, SCSS) which drove the creation of build pipelines
3. **Performance optimization** became critical, leading to automatic minification, compression, and bundling of application assets
4. **Cache invalidation problems** with static files led to content-based hashing being applied only to processed assets
5. **Separation evolution** distinguished between "raw" files (public) and "source" files (assets) that require compilation

### Behavioral Differences in This Project

This project implements a custom asset processing pipeline through the `AssetProcessor` class that handles both directories with distinct behaviors:

#### Public Directory Processing

- Files are copied directly to the output directory without modification
- Maintains original filenames and paths
- Suitable for assets that need predictable URLs
- No optimization or minification applied
- Processed by the `copyPublicAssets()` method in the asset processor

#### Src/Assets Directory Processing

- Files undergo optimization, minification, and hashing during build
- Filenames are modified with content-based hashes for cache busting
- Images are converted to WebP format for modern browsers
- CSS and JavaScript files are minified
- Processed by the respective `processImages()`, `processCSSFiles()`, and `processJSFiles()` methods

### Best Practices Guidelines

#### DO put in PUBLIC:

- **SEO/Meta files**: robots.txt, sitemap.xml, favicon.ico, apple-touch-icon.png
- **PWA files**: manifest.json, service worker files
- **Third-party libraries**: External JS/CSS that shouldn't be bundled (analytics, CDN fallbacks)
- **Static documents**: PDFs, legal documents, static HTML pages
- **Media with fixed URLs**: Images referenced in meta tags, email templates, or external systems

#### DO put in ASSETS:

- **Application code**: Your .js, .ts, .jsx, .tsx files
- **Stylesheets**: .css, .scss, .sass files that get processed
- **Fonts used in CSS**: Font files imported via @font-face or CSS modules
- **Dynamic images**: Pictures imported in components, hero images, gallery photos
- **Component-specific resources**: SVG icons imported as components, JSON data files

#### DON'T put in PUBLIC:

- Source code files that need transpilation/bundling
- Images that should get optimized and cache-busted
- Fonts that are imported via CSS (they won't get proper paths)

#### DON'T put in ASSETS:

- Files that external services need to access at predictable URLs
- Files that should bypass the build system entirely

### Project-Specific Implementation

This project's custom asset processor provides advanced features beyond standard Vite processing:

#### Development vs Production Behavior

- **Development**: Assets are copied/processed without heavy optimization for faster builds
- **Production**: Assets are fully optimized, hashed, and minified for performance

#### Incremental Processing

The asset processor implements incremental processing to only rebuild changed assets, significantly improving build times during development.

#### WebP Generation

All images in both directories automatically get WebP versions generated in production builds for better performance on supporting browsers.

#### Asset Manifest

The processor generates an asset manifest that maps logical paths to their processed/hashed versions, enabling proper asset referencing in templates.

### Practical Examples

#### File Structure Example

```
project/
├── public/
│   ├── favicon.ico                    # Browser tab icon
│   ├── robots.txt                     # SEO crawler instructions
│   ├── manifest.json                  # PWA configuration
│   ├── assets/
│   │   ├── fonts/
│   │   │   └── Roboto-Regular.woff2   # Web fonts
│   │   ├── icons/
│   │   │   └── github.svg             # Static SVG icons
│   │   └── images/
│   │       └── logo.png               # Static images
│   └── js/
│       └── analytics.js               # Third-party scripts
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── hero-banner.jpg        # Component images (optimized)
│   │   │   └── gallery/
│   │   │       └── photo1.png         # Gallery images (optimized)
│   │   └── js/
│   │       └── data.js                # Application JavaScript (minified)
│   └── pages/
│       └── index.njk                  # Templates referencing assets
```

#### Referencing Assets in Templates

##### PUBLIC assets usage:

```html
<!-- Direct paths since files are copied as-is -->
<link rel="icon" href="/favicon.ico" />
<link rel="manifest" href="/manifest.json" />
<img src="/assets/images/logo.png" alt="Logo" />
<script src="/js/analytics.js"></script>
```

##### SRC/ASSETS usage:

```html
<!-- Through the asset processor manifest -->
<img src="{{ asset('/assets/images/hero-banner.jpg') }}" alt="Hero" />
<script src="{{ asset('/assets/js/data.js') }}"></script>
```

#### Build Output Differences

**PUBLIC files** → Copied as-is to build folder:

```
dist/
├── favicon.ico              # Same filename, same content
├── robots.txt              # Same filename, same content
├── manifest.json           # Same filename, same content
└── assets/
    ├── fonts/
    │   └── Roboto-Regular.woff2  # Same filename, same content
    └── images/
        └── logo.png         # Same filename, same content
```

**SRC/ASSETS files** → Processed and renamed:

```
dist/
├── assets/
│   ├── images/
│   │   └── hero-banner.a8b3c2d1.jpg   # Optimized, hashed
│   └── js/
│       └── data.e5f6g7h8.js           # Minified, hashed
└── static/
    └── media/
        └── gallery/
            └── photo1.x9y8z7w6.png    # Optimized, hashed
```

### Key Takeaway

- **PUBLIC**: "I need this exact file at this exact URL"
- **SRC/ASSETS**: "Process this file and give me the optimized result"

This dual-directory approach provides the benefits of both static asset handling and build-time optimization while maintaining clear separation of concerns.

## 📊 Metadata and Asset Processing

### Metadata System

The project uses a metadata system defined in `src/data/meta.json` to manage site-wide information for each locale:

```json
{
  "en": {
    "title": "Site Title",
    "description": "Site description",
    "url": "https://example.com",
    "lang": "en",
    "locale": "en_us",
    "author": "Author Name"
  },
  "fr": {
    "title": "Titre du site",
    "description": "Description du site",
    "url": "https://example.com",
    "lang": "fr",
    "locale": "fr_fr",
    "author": "Nom de l'auteur"
  }
}
```

This metadata is accessible in templates through the `meta` object:

```html
<title>{{ meta[locale].title }}</title>
<meta name="description" content="{{ meta[locale].description }}" />
```

### Asset Processing Pipeline

The asset processing pipeline handles optimization and organization of static assets:

1. **Image Optimization**: Images in `src/assets/images/` are automatically converted to WebP format and optimized
2. **Font Handling**: Web fonts are organized in `public/assets/fonts/` and served with proper caching headers
3. **JavaScript Processing**: Client-side JavaScript in `public/js/` is included in the build process
4. **Cache Busting**: Asset filenames are hashed for efficient caching and automatic cache invalidation
5. **Manifest Generation**: The pipeline generates localized web app manifests for PWA support

The asset processor automatically:

- Resizes and compresses images
- Generates multiple resolutions for responsive images
- Creates WebP versions for modern browsers
- Maintains original formats as fallbacks
- Organizes assets in the distribution directory with hashed filenames

## 📚 Related Projects

- [Vite](https://github.com/vitejs/vite) - Build tool
- [Nunjucks](https://github.com/mozilla/nunjucks) - Template engine
- [Chokidar](https://github.com/paulmillr/chokidar) - File watching

---

<div align="center">

**[⭐ Star this repo](https://github.com/EPFL-ENAC/INPLUGS-CO2)** • **[🐛 Report Bug](https://github.com/EPFL-ENAC/INPLUGS-CO2/issues)** • **[✨ Request Feature](https://github.com/EPFL-ENAC/INPLUGS-CO2/issues)**

Made with ❤️ for the multi-locale web

</div>
