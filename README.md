# GCS MPA — Vite + Nunjucks + i18n (+ Critical CSS, Sitemaps, hreflang in head)

This project is a comprehensive multi-page application (MPA) built with Vite, Nunjucks, and includes advanced internationalization (i18n) support with SEO optimization features.

## Environments

The application supports different deployment environments with specific SEO configurations:

- **Production**: `VITE_SITE_HOSTNAME=https://app.mydomain.com` + `VITE_ALLOW_INDEXING=true`
- **Staging/dev host**: `VITE_SITE_HOSTNAME=https://app-dev.mydomain.com` + `VITE_ALLOW_INDEXING=false`

## Build Commands

### Production Build

```bash
VITE_SITE_HOSTNAME=https://app.mydomain.com VITE_ALLOW_INDEXING=true npm run build
```

### Staging Build

```bash
VITE_SITE_HOSTNAME=https://app-dev.mydomain.com VITE_ALLOW_INDEXING=false npm run build
```

### Development

```bash
npm run dev
```

## SEO Features

The layout template (`html/layout.njk`) automatically handles SEO based on the environment:

- **Production builds** (`allowIndexing=true`):

  - Adds `<link rel="canonical">` with proper hostname
  - Includes all `<link rel="alternate" hreflang="...">` tags for multilingual SEO
  - Generates `sitemap.xml` and proper `robots.txt`

- **Staging builds** (`allowIndexing=false`):
  - Adds `<meta name="robots" content="noindex,nofollow">`
  - Writes `robots.txt` with `Disallow: /` for all crawlers
  - Skips sitemap generation

## Technology Stack

- **Vite MPA** - Multi-page application build tool
- **Nunjucks templates** with JSON translation catalogs
- **Declarative Shadow DOM navbar** with integrated language switcher
- **Current-link highlighting** + locale switch mapping (`public/js/nav-active-lang.js`)
- **Speculation Rules** for prefetch/prerender optimization
- **XML sitemap + robots.txt** via `vite-plugin-sitemap` (production only)
- **HTML sitemap** via `scripts/generate-html-sitemap.mjs`
- **Critical CSS** extraction via `rollup-plugin-critical`
- **Code quality tools**: Prettier, Commitlint, Lefthook

## Project Structure

```
├── css/                           # Stylesheets
│   ├── navbar.css                # Navigation component styles
│   └── tokens.css                # Design tokens and utilities
├── en/                           # English pages
├── fr/                           # French pages
├── html/                         # Nunjucks templates
│   └── layout.njk               # Base layout with hreflang support
├── i18n/                         # Translation catalogs
│   ├── en.json                  # English translations
│   └── fr.json                  # French translations
├── public/                       # Static assets
│   ├── partials/                # Reusable template components
│   │   ├── header.njk          # Navigation with language switcher
│   │   └── footer.html         # Footer component
│   └── js/                      # Client-side JavaScript
│       └── nav-active-lang.js   # Navigation highlighting & lang switching
├── routes/                       # Route configuration
│   └── routes.config.json       # Route manifest with stable keys
├── scripts/                      # Build scripts
│   ├── postbuild.mjs           # Post-build processing (robots.txt)
│   └── generate-html-sitemap.mjs # HTML sitemap generation
├── .env.production              # Production environment variables
├── .env.staging                 # Staging environment variables
├── index.html                   # Root page (language redirect)
├── vite.config.js              # Enhanced Vite configuration
└── package.json                # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd INPLUGS-CO2
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Install git hooks:
   ```bash
   npx lefthook install
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` with automatic language detection and redirection.

## Route Management

The `routes/routes.config.json` file defines the complete site structure with stable `key`s per route, enabling reliable hreflang alternate generation across locales.

### Adding New Pages

1. **Add route entries** to `routes/routes.config.json` for both locales
2. **Create page files** in both `en/` and `fr/` directories
3. **Update Vite inputs** in `vite.config.js`
4. **Update language mapping** in `nav-active-lang.js` if slugs differ between locales
5. **Add navigation links** to `public/partials/header.njk`

### Route Key System

Each route has a stable `key` that maps equivalent pages across locales:

```json
{
  "en": [{ "key": "about", "path": "/en/about/", "title": "About" }],
  "fr": [{ "key": "about", "path": "/fr/a-propos/", "title": "À propos" }]
}
```

This enables automatic hreflang alternate generation even when URL slugs differ between languages.

## Internationalization

### Language Support

- **English (`en`)**: Primary language at `/en/`
- **French (`fr`)**: Secondary language at `/fr/`

### Adding Translations

1. Add new keys to both `i18n/en.json` and `i18n/fr.json`
2. Use in templates: `{{ t('your.nested.key') }}`
3. Missing keys display as `⟦key.name⟧` for easy debugging

### Language Switcher

The navigation automatically:

- Highlights current language
- Maps equivalent pages between locales
- Preserves URL fragments (#anchors) when switching
- Falls back to home page if no equivalent exists

## SEO Optimization

### Hreflang Implementation

- Automatic `<link rel="alternate" hreflang="...">` generation
- `x-default` points to English version
- Only included in production builds

### Sitemap Generation

- **XML sitemap**: Auto-generated for production builds
- **HTML sitemap**: Human-readable version at `/sitemap.html`
- **Robots.txt**: Environment-specific generation

### Critical CSS

Automatically extracts above-the-fold CSS for key pages:

- Home pages (EN/FR)
- GCS pages (EN/FR)
- Education pages (EN/FR)

## Build Process

1. **Vite build** - Compiles and optimizes all assets
2. **Post-build script** - Handles environment-specific robots.txt
3. **HTML sitemap generation** - Creates human-readable sitemap
4. **Critical CSS extraction** - Optimizes loading performance

## Notes

- The routes manifest includes stable `key`s for reliable cross-locale mapping
- Environment variables control SEO behavior (indexing, canonical URLs)
- Language switcher uses shadow DOM for encapsulation
- Speculation rules enable intelligent prefetching

## Contributing

1. Follow existing code patterns and structure
2. Update route manifest when adding/changing pages
3. Ensure translations exist in both languages
4. Test builds in both production and staging modes
5. Use conventional commit messages

## License

[Add your license information here]
