// vite.config.js
import { defineConfig } from 'vite'
import { createMultiLocalePlugin } from './plugins/multi-locale-plugin.js'

export default defineConfig({
  plugins: [
    createMultiLocalePlugin({
      srcDir: 'src',
      pagesDir: 'src/pages',
      layoutsDir: 'src/layouts',
      partialsDir: 'src/partials', 
      dataDir: 'src/data',
      outputDir: 'dist',
      defaultLocale: 'en',
      locales: ['en', 'fr']
    })
  ],
  // Don't use publicDir since we're handling our own static generation
  publicDir: false,
  build: {
    rollupOptions: {
      input: {
        // Use the generated index.html as entry point
        main: 'dist/index.html'
      }
    }
  }
})