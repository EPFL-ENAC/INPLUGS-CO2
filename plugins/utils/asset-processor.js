import { join, dirname, basename, extname } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'fs'
import { generateHash } from './locale-utils.js'

export class AssetProcessor {
  constructor(options = {}) {
    this.srcDir = options.srcDir || 'src'
    this.outputDir = options.outputDir || 'dist'
    this.copyPublic = options.copyPublic !== false
    this.isProduction = false
    this.assetHashes = {}
  }

  setProduction(isProduction) {
    this.isProduction = isProduction
  }

  getAssetHashes() {
    return this.assetHashes
  }

  // Copy public directory contents to dist, excluding files that will be processed separately
  copyPublicAssets() {
    const publicDir = 'public'
    
    if (!existsSync(publicDir)) {
      console.warn('Public directory not found, skipping public assets copy')
      return
    }

    // Files/paths to exclude from public copy (will be processed separately)
    const excludePatterns = [
      'js/nav-active-lang.js', // This gets processed with hash
      'site.webmanifest', // This gets localized per locale
    ]

    function shouldExclude(relativePath) {
      return excludePatterns.some(pattern => relativePath.includes(pattern))
    }

    function copyRecursively(sourceDir, targetDir, basePath = '') {
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }

      const items = readdirSync(sourceDir, { withFileTypes: true })
      
      for (const item of items) {
        const sourcePath = join(sourceDir, item.name)
        const targetPath = join(targetDir, item.name)
        const relativePath = join(basePath, item.name).replace(/\\/g, '/') // Normalize for Windows
        
        if (item.isDirectory()) {
          copyRecursively(sourcePath, targetPath, relativePath)
        } else if (item.isFile() && !shouldExclude(relativePath)) {
          copyFileSync(sourcePath, targetPath)
          console.log(`  ✓ ${relativePath} → ${relativePath}`)
        }
      }
    }

    copyRecursively(publicDir, this.outputDir)
  }

  // Copy assets to /assets/ directory (dev: no hash, prod: with hash)
  processAssets() {
    if (this.copyPublic) {
      console.log('📁 Copying public directory...')
      this.copyPublicAssets()
    }
    
    console.log('🎨 Processing styled assets...')
    const assetsDir = join(this.outputDir, 'assets')
    if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true })
    
    // Reset hashes for this build
    this.assetHashes = {}
    
    // Process CSS files
    this.processCSSFiles(assetsDir)
    
    // Process JS files  
    this.processJSFiles(assetsDir)
    
    // Process images
    this.processImages(assetsDir)
  }

  processCSSFiles(assetsDir) {
    const cssDir = join(assetsDir, 'styles')
    if (!existsSync(cssDir)) mkdirSync(cssDir, { recursive: true })
    
    const cssFiles = ['main.css', 'tokens.css', 'navbar.css']
    let combinedCssContent = ''
    
    // First pass: read all CSS content to create a combined hash
    cssFiles.forEach(file => {
      const srcPath = join(this.srcDir, 'styles', file)
      if (existsSync(srcPath)) {
        combinedCssContent += readFileSync(srcPath, 'utf8')
      }
    })
    
    const cssHash = combinedCssContent ? generateHash(combinedCssContent) : ''
    if (cssHash) this.assetHashes.cssHash = cssHash
    
    // Second pass: copy files with the combined hash
    cssFiles.forEach(file => {
      const srcPath = join(this.srcDir, 'styles', file)
      if (existsSync(srcPath)) {
        const fileName = this.isProduction ? 
          file.replace('.css', `.${cssHash}.css`) : 
          file
        copyFileSync(srcPath, join(cssDir, fileName))
        console.log(`  ✓ ${file} → assets/styles/${fileName}`)
      }
    })
  }

  processJSFiles(assetsDir) {
    const jsDir = join(assetsDir, 'js')
    if (!existsSync(jsDir)) mkdirSync(jsDir, { recursive: true })
    
    const jsPath = 'public/js/nav-active-lang.js'
    if (existsSync(jsPath)) {
      const content = readFileSync(jsPath, 'utf8')
      const hash = generateHash(content)
      this.assetHashes.jsHash = hash
      const fileName = this.isProduction ? 
        `nav-active-lang.${hash}.js` : 
        'nav-active-lang.js'
      copyFileSync(jsPath, join(jsDir, fileName))
      console.log(`  ✓ nav-active-lang.js → assets/js/${fileName}`)
    }
  }

  processImages(assetsDir) {
    const imgDir = join(assetsDir, 'images')
    if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true })
    
    const logoPath = join(this.srcDir, 'assets/logo.svg')
    if (existsSync(logoPath)) {
      const content = readFileSync(logoPath)
      const hash = generateHash(content)
      this.assetHashes.imgHash = hash
      const fileName = this.isProduction ? 
        `logo.${hash}.svg` : 
        'logo.svg'
      copyFileSync(logoPath, join(imgDir, fileName))
      console.log(`  ✓ logo.svg → assets/images/${fileName}`)
    }
  }
}
