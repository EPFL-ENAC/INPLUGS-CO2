Here’s the upgraded **one-shot YAML prompt**. It adds:

- **Prod vs dev** indexing control via `.env.production` / `.env.staging`
- Generate **sitemap.xml + robots.txt only in prod**
- Write **Disallow** robots for staging in a `postbuild` script
- Inject `allowIndexing`, `hostname`, `pagePath`, and **`alternates`** into templates
- Output `<link rel="alternate" hreflang="…">` **in page heads** (from the route manifest)
- Keeps language switcher + current-link highlighting

> Replace `https://app.mydomain.com` / `https://app-dev.mydomain.com` with your domains.

```yaml
project_name: gcs-mpa-i18n-njk
instructions: |
  Create all files exactly as listed. After generation:
    1) npm i
    2) npx lefthook install
    3) For production builds:   NODE_ENV=production   VITE_SITE_HOSTNAME=https://app.mydomain.com   VITE_ALLOW_INDEXING=true    npm run build
       For staging builds:      NODE_ENV=production   VITE_SITE_HOSTNAME=https://app-dev.mydomain.com VITE_ALLOW_INDEXING=false   npm run build
    4) npm run dev (local development)
files:
  - path: package.json
    content: |
      {
        "name": "gcs-mpa-i18n-njk",
        "private": true,
        "version": "0.2.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "vite build && node scripts/postbuild.mjs && node scripts/generate-html-sitemap.mjs",
          "preview": "vite preview",
          "format": "prettier -w .",
          "lint:commit": "commitlint --edit"
        },
        "devDependencies": {
          "vite": "^6.0.0",
          "nunjucks": "^3.2.4",
          "vite-plugin-nunjucks": "^0.2.0",
          "vite-plugin-sitemap": "^0.8.2",
          "vite-plugin-ssinc": "^1.0.11",
          "rollup-plugin-critical": "^2.0.0",
          "@commitlint/cli": "^17.1.2",
          "@commitlint/config-conventional": "^17.1.0",
          "@evilmartians/lefthook": "^1.5.0",
          "prettier": "^3.5.3"
        }
      }

  - path: .env.production
    content: |
      VITE_SITE_HOSTNAME=https://app.mydomain.com
      VITE_ALLOW_INDEXING=true

  - path: .env.staging
    content: |
      VITE_SITE_HOSTNAME=https://app-dev.mydomain.com
      VITE_ALLOW_INDEXING=false

  - path: vite.config.js
    content: |
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
        frContact: 'fr/contact/index.html'
      }

      const fileToPath = f => {
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
        Object.values(inputs).map(file => {
          const path = fileToPath(file)
          // infer locale from path
          const isFr = path.startsWith('/fr/')
          const isEn = path.startsWith('/en/') || path === '/'
          const locale = isFr ? 'fr' : 'en'
          const key = pathToKey[`${locale}:${path}`] || 'home'
          // alternates array across locales (prod hostname)
          const alternates = locales
            .filter(l => byLocaleKey[l][key])
            .map(l => ({ hreflang: l, href: `${HOSTNAME}${byLocaleKey[l][key].path}` }))
          // add x-default pointing to default locale
          alternates.push({ hreflang: 'x-default', href: `${HOSTNAME}${byLocaleKey['en'][key]?.path || '/en/'}` })
          return [file, { locale, catalog: catalogs[locale], pagePath: path, alternates, allowIndexing: ALLOW, hostname: HOSTNAME }]
        })
      )

      // ---------- Nunjucks env with t() ----------
      const env = new nunjucks.Environment(null, { noCache: true })
      env.addGlobal('t', function (key) {
        const { catalog } = this.getVariables()
        return get(catalog, key) ?? `⟦${key}⟧`
      })

      export default defineConfig({
        plugins: [
          nunjucksPlugin({
            templatesDir: resolve(process.cwd()),
            variables,
            nunjucksEnvironment: env
          }),
          ssinc({ includeExtensions: ['html', 'shtml'] }),
          ...(ALLOW ? [Sitemap({
            hostname: HOSTNAME,
            i18n: { defaultLanguage: 'en', languages: ['en', 'fr'], strategy: 'prefix' },
            generateRobotsTxt: true,
            readable: true
          })] : []),
          Critical({
            criticalBase: 'dist/',
            criticalPages: [
              { uri: '', template: 'index' },
              { uri: 'en/', template: 'en/index' },
              { uri: 'fr/', template: 'fr/index' },
              { uri: 'en/gcs/', template: 'en/gcs/index' },
              { uri: 'fr/gcs/', template: 'fr/gcs/index' },
              { uri: 'en/education/', template: 'en/education/index' },
              { uri: 'fr/education/', template: 'fr/education/index' }
            ],
            criticalConfig: { width: 1200, height: 900 }
          })
        ],
        build: {
          rollupOptions: {
            input: Object.fromEntries(
              Object.entries(inputs).map(([k, v]) => [k, resolve(__dirname, v)])
            )
          }
        },
        server: { watch: { paths: ['public/partials/**', 'css/**', 'i18n/**', 'routes/**', 'public/js/**'] } }
      })

  - path: .gitignore
    content: |
      node_modules
      dist
      .vite
      .DS_Store

  - path: .prettierignore
    content: |
      dist
      node_modules

  - path: .prettierrc.json
    content: |
      {
        "printWidth": 100,
        "singleQuote": true,
        "semi": false,
        "trailingComma": "es5"
      }

  - path: commitlint.config.cjs
    content: |
      module.exports = { extends: ['@commitlint/config-conventional'] }

  - path: lefthook.yml
    content: |
      pre-commit:
        parallel: true
        commands:
          prettier:
            run: npx prettier -c .
      commit-msg:
        commands:
          commitlint:
            run: npx commitlint --edit {1}

  # ----------------- i18n catalogs -----------------
  - path: i18n/en.json
    content: |
      {
        "site": { "name": "GCS" },
        "nav": {
          "home": "Home",
          "gcs": "GCS",
          "data": "Data",
          "education": "Education",
          "dictionary": "Dictionary",
          "links": "Useful links",
          "about": "About",
          "contact": "Contact"
        },
        "home": { "title": "Welcome to GCS" },
        "gcs": {
          "title": "GCS • What & Why",
          "why": "Why is GCS?",
          "what": "What is GCS?",
          "world": "GCS in the world",
          "ch": "GCS in Switzerland"
        },
        "education": {
          "title": "Education",
          "carbon": "Carbon team",
          "workshops": "Workshops",
          "visits": "Visits"
        },
        "dictionary": { "title": "Dictionary" },
        "links": { "title": "Useful links" },
        "about": { "title": "About" },
        "contact": { "title": "Contact" }
      }

  - path: i18n/fr.json
    content: |
      {
        "site": { "name": "GCS" },
        "nav": {
          "home": "Accueil",
          "gcs": "GCS",
          "data": "Données",
          "education": "Éducation",
          "dictionary": "Dictionnaire",
          "links": "Liens utiles",
          "about": "À propos",
          "contact": "Contact"
        },
        "home": { "title": "Bienvenue sur GCS" },
        "gcs": {
          "title": "GCS • Quoi & Pourquoi",
          "why": "Pourquoi le GCS ?",
          "what": "Qu’est-ce que le GCS ?",
          "world": "Le GCS dans le monde",
          "ch": "Le GCS en Suisse"
        },
        "education": {
          "title": "Éducation",
          "carbon": "Équipe carbone",
          "workshops": "Ateliers",
          "visits": "Visites"
        },
        "dictionary": { "title": "Dictionnaire" },
        "links": { "title": "Liens utiles" },
        "about": { "title": "À propos" },
        "contact": { "title": "Contact" }
      }

  # ----------------- CSS -----------------
  - path: css/tokens.css
    content: |
      @layer reset, tokens, components, utilities;

      @layer reset {
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; height: 100%; }
      }

      @layer tokens {
        :root {
          --brand-bg: #1f2937; /* slate-800 */
          --brand-fg: #ffffff;
          --brand-accent: #f97316; /* orange-500 */
          --container: min(1100px, 92vw);
          --space-2: .5rem;
          --space-3: 1rem;
          --radius: 12px;
          --shadow: 0 6px 24px rgba(0,0,0,.08);
          color-scheme: light dark;
        }
        @view-transition { navigation: auto; }
      }

      @layer utilities {
        .container { width: var(--container); margin-inline: auto; padding: var(--space-3); }
        .section { scroll-margin-top: 5rem; }
      }

  - path: css/navbar.css
    content: |
      @layer components {
        :host {
          display: block;
          background: var(--brand-bg);
          color: var(--brand-fg);
          font: 500 16px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          box-shadow: var(--shadow);
        }
        .nav {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          width: var(--container);
          margin-inline: auto;
          padding: var(--space-3);
        }
        h1 { font-size: 1rem; margin: 0 var(--space-3) 0 0; letter-spacing: .3px; }
        nav { display: flex; gap: var(--space-3); flex-wrap: wrap; }
        nav a {
          color: var(--brand-fg);
          text-decoration: none;
          opacity: .9;
          padding: .2rem .4rem;
          border-radius: 6px;
        }
        nav a:hover, nav a:focus-visible {
          opacity: 1;
          outline: none;
          background: color-mix(in oklab, var(--brand-fg) 12%, transparent);
        }
        nav a[aria-current="page"] { text-decoration: underline; }

        /* Language switcher */
        .lang { margin-left: auto; display: flex; align-items: center; gap: .5rem; opacity: .9; }
        .lang a { color: var(--brand-fg); text-decoration: none; padding: .15rem .35rem; border-radius: 6px; }
        .lang a[aria-current="true"] { background: color-mix(in oklab, var(--brand-fg) 15%, transparent); opacity: 1; }
      }

  # ----------------- Partials (Nunjucks + DSD navbar with language switcher) -----------------
  - path: public/partials/header.njk
    content: |
      <site-header>
        <template shadowrootmode="open">
          <link rel="stylesheet" href="/css/navbar.css">
          <header class="nav">
            <h1><slot name="title">{{ t('site.name') }}</slot></h1>
            <nav>
              <a href="/{{ locale }}/">{{ t('nav.home') }}</a>
              <a href="/{{ locale }}/gcs/">{{ t('nav.gcs') }}</a>
              <a href="/{{ locale }}/data/">{{ t('nav.data') }}</a>
              <a href="/{{ locale }}/education/">{{ t('nav.education') }}</a>
              <a href="/{{ locale }}/dictionary/">{{ t('nav.dictionary') }}</a>
              <a href="/{{ locale }}/useful-links/">{{ t('nav.links') }}</a>
              <a href="/{{ locale }}/about/">{{ t('nav.about') }}</a>
              <a href="/{{ locale }}/contact/">{{ t('nav.contact') }}</a>
            </nav>
            <div class="lang">
              <!-- hrefs are placeholders; script rewrites to the matching path in the other locale -->
              <a data-lang="en" href="/en/" aria-label="Switch to English">EN</a>
              <a data-lang="fr" href="/fr/" aria-label="Passer en français">FR</a>
            </div>
          </header>
        </template>
      </site-header>

      <script type="speculationrules">
      {
        "prerender": [{
          "urls": ["/{{ locale }}/gcs/", "/{{ locale }}/data/", "/{{ locale }}/education/"],
          "eagerness": "moderate"
        }],
        "prefetch": [{
          "where": { "selector_matches": "nav a", "href_matches": "/{{ locale }}/.+" },
          "eagerness": "conservative"
        }]
      }
      </script>

  - path: public/partials/footer.html
    content: |
      <footer class="container" style="opacity:.7;padding:var(--space-3);text-align:center">
        <p>© <span id="y"></span> GCS</p>
        <script>document.getElementById('y').textContent = new Date().getFullYear()</script>
      </footer>

  # ----------------- Shared layout (adds alternates & canonical in prod) -----------------
  - path: html/layout.njk
    content: |
      <!doctype html>
      <html lang="{{ locale }}">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{% block title %}{{ t('site.name') }}{% endblock %}</title>
          <link rel="stylesheet" href="/css/tokens.css" />
          {% if not allowIndexing %}
            <meta name="robots" content="noindex,nofollow">
          {% else %}
            <link rel="canonical" href="{{ hostname }}{{ pagePath }}">
            {% for alt in alternates %}
              <link rel="alternate" href="{{ alt.href }}" hreflang="{{ alt.hreflang }}">
            {% endfor %}
          {% endif %}
        </head>
        <body>
          {% include "public/partials/header.njk" %}
          <main class="container">
            {% block content %}{% endblock %}
          </main>
          {% include "public/partials/footer.html" %}
          <script type="module" src="/js/nav-active-lang.js"></script>
        </body>
      </html>

  # ----------------- Root: language chooser/redirect -----------------
  - path: index.html
    content: |
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>GCS</title>
          <link rel="stylesheet" href="/css/tokens.css" />
          <meta http-equiv="refresh" content="0; url=/en/" />
          <script>
            const lang = (navigator.language || 'en').toLowerCase();
            if (!location.pathname.startsWith('/en') && !location.pathname.startsWith('/fr')) {
              location.replace(lang.startsWith('fr') ? '/fr/' : '/en/');
            }
          </script>
        </head>
        <body>
          <p class="container">Choose: <a href="/en/">English</a> | <a href="/fr/">Français</a></p>
        </body>
      </html>

  # ----------------- Pages (EN) -----------------
  - path: en/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('home.title') }}{% endblock %}
      {% block content %}
        <h2>{{ t('home.title') }}</h2>
        <p>Landing page.</p>
      {% endblock %}

  - path: en/gcs/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('gcs.title') }}{% endblock %}
      {% block content %}
        <h2 class="section" id="why">{{ t('gcs.why') }}</h2>
        <p>Explain rationale…</p>
        <h2 class="section" id="what">{{ t('gcs.what') }}</h2>
        <p>Definition…</p>
        <h2 class="section" id="world">{{ t('gcs.world') }}</h2>
        <p>Global view…</p>
        <h2 class="section" id="switzerland">{{ t('gcs.ch') }}</h2>
        <p>Swiss context…</p>
      {% endblock %}

  - path: en/data/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}Data • {{ t('site.name') }}{% endblock %}
      {% block content %}<h2>Data</h2>{% endblock %}

  - path: en/education/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('education.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}
        <h2 class="section" id="carbon-team">{{ t('education.carbon') }}</h2>
        <h2 class="section" id="workshops">{{ t('education.workshops') }}</h2>
        <h2 class="section" id="visits">{{ t('education.visits') }}</h2>
      {% endblock %}

  - path: en/dictionary/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('dictionary.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}<h2>{{ t('dictionary.title') }}</h2>{% endblock %}

  - path: en/useful-links/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('links.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}<h2>{{ t('links.title') }}</h2>{% endblock %}

  - path: en/about/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('about.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}<h2>{{ t('about.title') }}</h2>{% endblock %}

  - path: en/contact/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('contact.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}<h2>{{ t('contact.title') }}</h2>{% endblock %}

  # ----------------- Pages (FR) -----------------
  - path: fr/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('home.title') }}{% endblock %}
      {% block content %}
        <h2>{{ t('home.title') }}</h2>
        <p>Page d’accueil.</p>
      {% endblock %}

  - path: fr/gcs/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('gcs.title') }}{% endblock %}
      {% block content %}
        <h2 class="section" id="why">{{ t('gcs.why') }}</h2>
        <h2 class="section" id="what">{{ t('gcs.what') }}</h2>
        <h2 class="section" id="world">{{ t('gcs.world') }}</h2>
        <h2 class="section" id="switzerland">{{ t('gcs.ch') }}</h2>
      {% endblock %}

  - path: fr/data/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('site.name') }} • Données{% endblock %}
      {% block content %}<h2>Données</h2>{% endblock %}

  - path: fr/education/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('education.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}
        <h2 class="section" id="carbon-team">{{ t('education.carbon') }}</h2>
        <h2 class="section" id="workshops">{{ t('education.workshops') }}</h2>
        <h2 class="section" id="visits">{{ t('education.visits') }}</h2>
      {% endblock %}

  - path: fr/dictionnaire/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('dictionary.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}<h2>{{ t('dictionary.title') }}</h2>{% endblock %}

  - path: fr/liens-utiles/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('links.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}<h2>{{ t('links.title') }}</h2>{% endblock %}

  - path: fr/a-propos/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('about.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}<h2>{{ t('about.title') }}</h2>{% endblock %}

  - path: fr/contact/index.html
    content: |
      {% extends "html/layout.njk" %}
      {% block title %}{{ t('contact.title') }} • {{ t('site.name') }}{% endblock %}
      {% block content %}<h2>{{ t('contact.title') }}</h2>{% endblock %}

  # ----------------- Language switcher + current-link script -----------------
  - path: public/js/nav-active-lang.js
    content: |
      // Highlights the current nav link and rewrites language switcher links
      (() => {
        const ensureSlash = p => (p.endsWith('/') ? p : p + '/')
        const PATH = ensureSlash(location.pathname)
        const enToFr = {
          '/en/': '/fr/',
          '/en/gcs/': '/fr/gcs/',
          '/en/data/': '/fr/data/',
          '/en/education/': '/fr/education/',
          '/en/dictionary/': '/fr/dictionnaire/',
          '/en/useful-links/': '/fr/liens-utiles/',
          '/en/about/': '/fr/a-propos/',
          '/en/contact/': '/fr/contact/'
        }
        const frToEn = Object.fromEntries(Object.entries(enToFr).map(([en, fr]) => [fr, en]))
        const isEn = PATH.startsWith('/en/')
        const isFr = PATH.startsWith('/fr/')
        document.querySelectorAll('site-header').forEach(el => {
          const root = el.shadowRoot
          if (!root) return
          root.querySelectorAll('nav a[href]').forEach(a => {
            const hrefPath = ensureSlash(new URL(a.getAttribute('href'), location.origin).pathname)
            if (hrefPath === PATH) a.setAttribute('aria-current', 'page')
          })
          const linkEn = root.querySelector('.lang a[data-lang="en"]')
          const linkFr = root.querySelector('.lang a[data-lang="fr"]')
          if (linkEn && linkFr) {
            const hash = location.hash || ''
            if (isEn) {
              linkEn.setAttribute('aria-current', 'true'); linkEn.setAttribute('href', PATH + hash)
              linkFr.setAttribute('href', (enToFr[PATH] || '/fr/') + hash)
            } else if (isFr) {
              linkFr.setAttribute('aria-current', 'true'); linkFr.setAttribute('href', PATH + hash)
              linkEn.setAttribute('href', (frToEn[PATH] || '/en/') + hash)
            } else {
              linkEn.setAttribute('href', '/en/'); linkFr.setAttribute('href', '/fr/')
            }
          }
        })
      })()

  # ----------------- Route manifest (now includes stable keys) -----------------
  - path: routes/routes.config.json
    content: |
      {
        "hostname": "https://app.mydomain.com",
        "locales": ["en","fr"],
        "routes": {
          "en": [
            { "key": "home", "path": "/en/", "title": "Home" },
            { "key": "gcs", "path": "/en/gcs/", "title": "GCS", "anchors": [
              { "id": "why", "title": "Why is GCS?" },
              { "id": "what", "title": "What is GCS?" },
              { "id": "world", "title": "GCS in the world" },
              { "id": "switzerland", "title": "GCS in Switzerland" }
            ]},
            { "key": "data", "path": "/en/data/", "title": "Data" },
            { "key": "education", "path": "/en/education/", "title": "Education", "anchors": [
              { "id": "carbon-team", "title": "Carbon team" },
              { "id": "workshops", "title": "Workshops" },
              { "id": "visits", "title": "Visits" }
            ]},
            { "key": "dictionary", "path": "/en/dictionary/", "title": "Dictionary" },
            { "key": "links", "path": "/en/useful-links/", "title": "Useful links" },
            { "key": "about", "path": "/en/about/", "title": "About" },
            { "key": "contact", "path": "/en/contact/", "title": "Contact" }
          ],
          "fr": [
            { "key": "home", "path": "/fr/", "title": "Accueil" },
            { "key": "gcs", "path": "/fr/gcs/", "title": "GCS", "anchors": [
              { "id": "why", "title": "Pourquoi le GCS ?" },
              { "id": "what", "title": "Qu’est-ce que le GCS ?" },
              { "id": "world", "title": "Le GCS dans le monde" },
              { "id": "switzerland", "title": "Le GCS en Suisse" }
            ]},
            { "key": "data", "path": "/fr/data/", "title": "Données" },
            { "key": "education", "path": "/fr/education/", "title": "Éducation", "anchors": [
              { "id": "carbon-team", "title": "Équipe carbone" },
              { "id": "workshops", "title": "Ateliers" },
              { "id": "visits", "title": "Visites" }
            ]},
            { "key": "dictionary", "path": "/fr/dictionnaire/", "title": "Dictionnaire" },
            { "key": "links", "path": "/fr/liens-utiles/", "title": "Liens utiles" },
            { "key": "about", "path": "/fr/a-propos/", "title": "À propos" },
            { "key": "contact", "path": "/fr/contact/", "title": "Contact" }
          ]
        }
      }

  # ----------------- HTML sitemap generator -----------------
  - path: scripts/generate-html-sitemap.mjs
    content: |
      import { promises as fs } from 'node:fs'
      import { fileURLToPath } from 'node:url'
      import { dirname, resolve } from 'node:path'

      const __dirname = dirname(fileURLToPath(import.meta.url))
      const root = resolve(__dirname, '..')
      const dist = resolve(root, 'dist')
      const cfg = JSON.parse(await fs.readFile(resolve(root, 'routes/routes.config.json'), 'utf8'))

      const groups = Object.entries(cfg.routes)
      const items = groups.map(([locale, routes]) => {
        const list = routes.map(r => {
          const anchors = (r.anchors || [])
            .map(a => `<li><a href="${r.path}#${a.id}">${a.title}</a></li>`)
            .join('')
          const anchorBlock = anchors ? `<ul>${anchors}</ul>` : ''
          return `<li><a href="${r.path}">${r.title}</a>${anchorBlock}</li>`
        }).join('')
        return `<section><h2>${locale.toUpperCase()}</h2><ul>${list}</ul></section>`
      }).join('')

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

  # ----------------- Postbuild: write Disallow robots for staging builds -----------------
  - path: scripts/postbuild.mjs
    content: |
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

  # ----------------- README -----------------
  - path: README.md
    content: |
      # GCS MPA — Vite + Nunjucks + i18n (+ Critical CSS, Sitemaps, hreflang in head)

      ## Environments
      - **Production**: `VITE_SITE_HOSTNAME=https://app.mydomain.com` + `VITE_ALLOW_INDEXING=true`
      - **Staging/dev host**: `VITE_SITE_HOSTNAME=https://app-dev.mydomain.com` + `VITE_ALLOW_INDEXING=false`

      ## Build
      - Prod:   `VITE_SITE_HOSTNAME=… VITE_ALLOW_INDEXING=true  npm run build`
      - Stg:    `VITE_SITE_HOSTNAME=… VITE_ALLOW_INDEXING=false npm run build`
      - The layout:
        - Adds `<link rel="canonical">` and all `<link rel="alternate" hreflang="…">` **only when** `allowIndexing` is true.
        - Adds `<meta name="robots" content="noindex,nofollow">` when `allowIndexing` is false.
      - `scripts/postbuild.mjs` writes a `robots.txt` that **Disallow**s everything for staging builds.
      - `vite-plugin-sitemap` runs **only in production**, emitting `sitemap.xml` and `robots.txt`.

      ## Stack
      - Vite MPA, Nunjucks templates + JSON catalogs
      - Declarative Shadow DOM navbar with **language switcher**
      - Current-link highlight + locale switch mapping (`public/js/nav-active-lang.js`)
      - Speculation Rules for prefetch/prerender
      - XML sitemap + robots via `vite-plugin-sitemap` (prod only)
      - HTML sitemap via `scripts/generate-html-sitemap.mjs`
      - Critical CSS via `rollup-plugin-critical`
      - Prettier, Commitlint, Lefthook

      ## Notes
      - The `routes/routes.config.json` includes stable `key`s per route so we can build hreflang alternates reliably across locales.
      - If you add new pages or change slugs, update the route manifest (and `nav-active-lang.js` mapping if slugs differ between locales).
```
