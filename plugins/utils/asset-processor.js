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

  // Minify CSS content
  async minifyCSS(cssContent) {
    if (!this.isProduction) return cssContent
    
    try {
      // Basic CSS minification - remove comments, whitespace, etc.
      return cssContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove last semicolon before }
        .replace(/{\s*/g, '{') // Remove space after {
        .replace(/;\s*/g, ';') // Remove space after ;
        .replace(/,\s*/g, ',') // Remove space after ,
        .replace(/:\s*/g, ':') // Remove space after :
        .trim()
    } catch (error) {
      console.warn('CSS minification failed:', error.message)
      return cssContent
    }
  }

  // Minify JS content  
  async minifyJS(jsContent) {
    if (!this.isProduction) return jsContent
    
    try {
      // Basic JS minification - remove comments and unnecessary whitespace
      return jsContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, ';}') // Clean up semicolons
        .replace(/{\s*/g, '{') // Remove space after {
        .replace(/}\s*/g, '}') // Remove space after }
        .trim()
    } catch (error) {
      console.warn('JS minification failed:', error.message)
      return jsContent
    }
  }

  // Optimize images using Sharp
  async optimizeImage(inputPath, outputPath) {
    if (!this.isProduction) {
      copyFileSync(inputPath, outputPath)
      return { originalSize: 0, optimizedSize: 0 }
    }

    try {
      const sharp = (await import('sharp')).default
      const ext = extname(inputPath).toLowerCase()
      const originalBuffer = readFileSync(inputPath)
      const originalSize = originalBuffer.length
      
      let optimizedBuffer
      
      if (ext === '.svg') {
        // For SVG, just copy for now (could use SVGO here)
        optimizedBuffer = originalBuffer
      } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        // Optimize with Sharp
        optimizedBuffer = await sharp(originalBuffer)
          .resize({ withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .png({ quality: 85, compressionLevel: 9 })
          .webp({ quality: 85 })
          .toBuffer()
      } else {
        // Unknown format, just copy
        optimizedBuffer = originalBuffer
      }
      
      writeFileSync(outputPath, optimizedBuffer)
      
      return {
        originalSize,
        optimizedSize: optimizedBuffer.length
      }
    } catch (error) {
      console.warn(`Image optimization failed for ${inputPath}:`, error.message)
      copyFileSync(inputPath, outputPath)
      return { originalSize: 0, optimizedSize: 0 }
    }
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
  async processAssets() {
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
    await this.processCSSFiles(assetsDir)
    
    // Process JS files  
    await this.processJSFiles(assetsDir)
    
    // Process images
    await this.processImages(assetsDir)
  }

  async processCSSFiles(assetsDir) {
    const cssDir = join(assetsDir, 'styles')
    if (!existsSync(cssDir)) mkdirSync(cssDir, { recursive: true })
    
    const cssFiles = ['main.css', 'tokens.css', 'navbar.css']
    let combinedCssContent = ''
    
    // First pass: read all CSS content to create a combined hash
    for (const file of cssFiles) {
      const srcPath = join(this.srcDir, 'styles', file)
      if (existsSync(srcPath)) {
        const content = readFileSync(srcPath, 'utf8')
        combinedCssContent += content
      }
    }
    
    // Minify combined content for production
    const minifiedCombinedContent = await this.minifyCSS(combinedCssContent)
    const cssHash = minifiedCombinedContent ? generateHash(minifiedCombinedContent) : ''
    if (cssHash) this.assetHashes.cssHash = cssHash
    
    // Second pass: process and copy files with the combined hash
    for (const file of cssFiles) {
      const srcPath = join(this.srcDir, 'styles', file)
      if (existsSync(srcPath)) {
        const content = readFileSync(srcPath, 'utf8')
        const processedContent = await this.minifyCSS(content)
        
        const fileName = this.isProduction ? 
          file.replace('.css', `.${cssHash}.css`) : 
          file
        
        writeFileSync(join(cssDir, fileName), processedContent)
        const sizeInfo = this.isProduction ? 
          ` (${content.length}B → ${processedContent.length}B)` : ''
        console.log(`  ✓ ${file} → assets/styles/${fileName}${sizeInfo}`)
      }
    }
  }

  async processJSFiles(assetsDir) {
    const jsDir = join(assetsDir, 'js')
    if (!existsSync(jsDir)) mkdirSync(jsDir, { recursive: true })
    
    const jsPath = 'public/js/nav-active-lang.js'
    if (existsSync(jsPath)) {
      const content = readFileSync(jsPath, 'utf8')
      const minifiedContent = await this.minifyJS(content)
      const hash = generateHash(minifiedContent)
      this.assetHashes.jsHash = hash
      
      const fileName = this.isProduction ? 
        `nav-active-lang.${hash}.js` : 
        'nav-active-lang.js'
      
      writeFileSync(join(jsDir, fileName), minifiedContent)
      const sizeInfo = this.isProduction ? 
        ` (${content.length}B → ${minifiedContent.length}B)` : ''
      console.log(`  ✓ nav-active-lang.js → assets/js/${fileName}${sizeInfo}`)
    }
  }

  async processImages(assetsDir) {
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
      
      const outputPath = join(imgDir, fileName)
      const { originalSize, optimizedSize } = await this.optimizeImage(logoPath, outputPath)
      
      const sizeInfo = this.isProduction && originalSize > 0 ? 
        ` (${originalSize}B → ${optimizedSize}B)` : ''
      console.log(`  ✓ logo.svg → assets/images/${fileName}${sizeInfo}`)
    }
  }
}
