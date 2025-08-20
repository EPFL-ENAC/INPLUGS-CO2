import { join, dirname, basename, extname } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'fs'
import { glob } from 'glob'
import { generateHash } from './locale-utils.js'

/**
 * AssetProcessor - A flexible asset processing utility using glob patterns
 * 
 * Features:
 * - Dynamic file discovery using configurable glob patterns
 * - CSS/JS minification and cache-busting hashes in production
 * - Image optimization with WebP generation
 * - Configurable source directories and patterns
 * 
 * Usage:
 * const processor = new AssetProcessor({
 *   srcDir: 'src',
 *   outputDir: 'dist', 
 *   cssPattern: 'src/styles/*.css',        // Find all CSS files
 *   jsPattern: 'public/js/*.js',           // Find all JS files  
 *   imagePattern: 'src/assets/*.{svg,png,jpg,jpeg,webp,gif}' // Find all images
 * })
 */
export class AssetProcessor {
  constructor(options = {}) {
    this.srcDir = options.srcDir || 'src'
    this.outputDir = options.outputDir || 'dist'
    this.copyPublic = options.copyPublic !== false
    this.isProduction = false
    this.assetHashes = {}
    
    // Configurable glob patterns
    this.patterns = {
      css: options.cssPattern || join(this.srcDir, 'styles', '*.css'),
      js: options.jsPattern || 'public/js/*.js',
      images: options.imagePattern || join(this.srcDir, 'assets', '*.{svg,png,jpg,jpeg,webp,gif}')
    }
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
      return { originalSize: 0, optimizedSize: 0, format: 'copied' }
    }

    try {
      const sharp = (await import('sharp')).default
      const ext = extname(inputPath).toLowerCase()
      const originalBuffer = readFileSync(inputPath)
      const originalSize = originalBuffer.length
      
      let optimizedBuffer
      let outputFormat = ext.slice(1) // Remove the dot
      
      if (ext === '.svg') {
        // For SVG, just copy for now (could use SVGO here)
        optimizedBuffer = originalBuffer
        outputFormat = 'svg (copied)'
      } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        // Convert PNG/JPG to WebP for better compression
        const webpPath = outputPath.replace(ext, '.webp')
        optimizedBuffer = await sharp(originalBuffer)
          .webp({ quality: 75, effort: 6, lossless: false })
          .toBuffer()
        
        // Write the WebP version
        writeFileSync(webpPath, optimizedBuffer)
        outputFormat = 'webp'
        
        // Also keep the original format but optimized
        let originalOptimized
        if (ext === '.png') {
          originalOptimized = await sharp(originalBuffer)
            .png({ quality: 85, compressionLevel: 9, effort: 10 })
            .toBuffer()
        } else {
          originalOptimized = await sharp(originalBuffer)
            .jpeg({ quality: 85, progressive: true, mozjpeg: true })
            .toBuffer()
        }
        
        writeFileSync(outputPath, originalOptimized)
        
        return {
          originalSize,
          optimizedSize: originalOptimized.length,
          webpSize: optimizedBuffer.length,
          format: `${outputFormat} + optimized ${ext.slice(1)}`,
          webpPath: basename(webpPath)
        }
      } else if (ext === '.webp') {
        // Already WebP, just optimize more aggressively
        optimizedBuffer = await sharp(originalBuffer)
          .webp({ quality: 75, effort: 6, lossless: false })
          .toBuffer()
        outputFormat = 'webp (optimized)'
      } else {
        // Unknown format, just copy
        optimizedBuffer = originalBuffer
        outputFormat = 'copied'
      }
      
      writeFileSync(outputPath, optimizedBuffer)
      
      return {
        originalSize,
        optimizedSize: optimizedBuffer.length,
        format: outputFormat
      }
    } catch (error) {
      console.warn(`⚠️  Image optimization failed for ${inputPath}:`, error.message)
      copyFileSync(inputPath, outputPath)
      return { originalSize: 0, optimizedSize: 0, format: 'error (copied)' }
    }
  }

  // Copy public directory contents to dist, excluding files that will be processed separately
  async copyPublicAssets() {
    const publicDir = 'public'
    
    if (!existsSync(publicDir)) {
      console.warn('Public directory not found, skipping public assets copy')
      return
    }

    // Files/paths to exclude from public copy (will be processed separately)
    const excludePatterns = [
      'site.webmanifest', // This gets localized per locale
    ]

    // Track optimization stats
    let totalOptimizations = 0
    let totalOriginalSize = 0
    let totalOptimizedSize = 0
    let totalWebpSavings = 0

    function shouldExclude(relativePath) {
      return excludePatterns.some(pattern => relativePath.includes(pattern))
    }

    const copyRecursively = async (sourceDir, targetDir, basePath = '') => {
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }

      const items = readdirSync(sourceDir, { withFileTypes: true })
      
      for (const item of items) {
        const sourcePath = join(sourceDir, item.name)
        const targetPath = join(targetDir, item.name)
        const relativePath = join(basePath, item.name).replace(/\\/g, '/') // Normalize for Windows
        
        if (item.isDirectory()) {
          await copyRecursively(sourcePath, targetPath, relativePath)
        } else if (item.isFile() && !shouldExclude(relativePath)) {
          const ext = extname(item.name).toLowerCase()
          const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)
          
          if (isImage && this.isProduction) {
            // Optimize images in production
            const result = await this.optimizeImage(sourcePath, targetPath)
            totalOptimizations++
            totalOriginalSize += result.originalSize || 0
            totalOptimizedSize += result.optimizedSize || 0
            
            let sizeInfo = ''
            if (result.originalSize > 0) {
              const savings = ((result.originalSize - result.optimizedSize) / result.originalSize * 100).toFixed(1)
              sizeInfo = ` (${result.originalSize}B → ${result.optimizedSize}B, -${savings}%)`
              
              if (result.webpSize) {
                const webpSavings = ((result.originalSize - result.webpSize) / result.originalSize * 100).toFixed(1)
                sizeInfo += ` + ${result.webpPath} (-${webpSavings}%)`
                totalWebpSavings += result.originalSize - result.webpSize
              }
            }
            
            console.log(`  🖼️  ${relativePath} → ${relativePath} [${result.format}]${sizeInfo}`)
          } else {
            // Copy non-images or in development mode
            copyFileSync(sourcePath, targetPath)
            console.log(`  ✓ ${relativePath} → ${relativePath}`)
          }
        }
      }
    }

    await copyRecursively(publicDir, this.outputDir)
    
    // Show optimization summary
    if (this.isProduction && totalOptimizations > 0) {
      const totalSavings = totalOriginalSize - totalOptimizedSize
      const percentSavings = ((totalSavings / totalOriginalSize) * 100).toFixed(1)
      console.log(`📊 Image optimization summary: ${totalOptimizations} images, ${totalOriginalSize}B → ${totalOptimizedSize}B (-${percentSavings}%)`)
      if (totalWebpSavings > 0) {
        console.log(`📊 Additional WebP savings: ${totalWebpSavings}B`)
      }
    }
  }

  // Copy assets to /assets/ directory (dev: no hash, prod: with hash)
  async processAssets() {
    if (this.copyPublic) {
      console.log('📁 Copying public directory...')
      await this.copyPublicAssets()
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
    
    // Use configurable glob pattern to find CSS files
    const cssFiles = await glob(this.patterns.css)
    
    if (cssFiles.length === 0) {
      console.log(`  ℹ️  No CSS files found matching pattern: ${this.patterns.css}`)
      return
    }
    
    let combinedCssContent = ''
    let totalOriginalSize = 0
    let totalMinifiedSize = 0
    
    // First pass: read all CSS content to create a combined hash
    for (const filePath of cssFiles) {
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8')
        combinedCssContent += content
        totalOriginalSize += content.length
      }
    }
    
    // Minify combined content for production
    const minifiedCombinedContent = await this.minifyCSS(combinedCssContent)
    const cssHash = minifiedCombinedContent ? generateHash(minifiedCombinedContent) : ''
    if (cssHash) this.assetHashes.cssHash = cssHash
    
    // Second pass: process and copy files with the combined hash
    for (const filePath of cssFiles) {
      if (existsSync(filePath)) {
        const fileName = basename(filePath)
        const content = readFileSync(filePath, 'utf8')
        const processedContent = await this.minifyCSS(content)
        totalMinifiedSize += processedContent.length
        
        const outputFileName = this.isProduction ? 
          fileName.replace('.css', `.${cssHash}.css`) : 
          fileName
        
        writeFileSync(join(cssDir, outputFileName), processedContent)
        
        if (this.isProduction) {
          const savings = ((content.length - processedContent.length) / content.length * 100).toFixed(1)
          console.log(`  🎨 ${fileName} → assets/styles/${outputFileName} (${content.length}B → ${processedContent.length}B, -${savings}%)`)
        } else {
          console.log(`  ✓ ${fileName} → assets/styles/${outputFileName}`)
        }
      }
    }
    
    if (this.isProduction && totalOriginalSize > 0) {
      const totalSavings = ((totalOriginalSize - totalMinifiedSize) / totalOriginalSize * 100).toFixed(1)
      console.log(`📊 CSS optimization summary: ${totalOriginalSize}B → ${totalMinifiedSize}B (-${totalSavings}%)`)
    }
  }

  async processJSFiles(assetsDir) {
    const jsDir = join(assetsDir, 'js')
    if (!existsSync(jsDir)) mkdirSync(jsDir, { recursive: true })
    
    // Use configurable glob pattern to find JS files
    const jsFiles = await glob(this.patterns.js)
    
    if (jsFiles.length === 0) {
      console.log(`  ℹ️  No JS files found matching pattern: ${this.patterns.js}`)
      return
    }
    
    for (const jsPath of jsFiles) {
      if (existsSync(jsPath)) {
        const fileName = basename(jsPath)
        const content = readFileSync(jsPath, 'utf8')
        const minifiedContent = await this.minifyJS(content)
        const hash = generateHash(minifiedContent)
        
        // Store hash with file-specific key (in case there are multiple JS files)
        const hashKey = fileName.replace('.js', 'Hash')
        this.assetHashes[hashKey] = hash
        
        const outputFileName = this.isProduction ? 
          fileName.replace('.js', `.${hash}.js`) : 
          fileName
        
        writeFileSync(join(jsDir, outputFileName), minifiedContent)
        
        if (this.isProduction) {
          const savings = ((content.length - minifiedContent.length) / content.length * 100).toFixed(1)
          console.log(`  ⚡ ${fileName} → assets/js/${outputFileName} (${content.length}B → ${minifiedContent.length}B, -${savings}%)`)
        } else {
          console.log(`  ✓ ${fileName} → assets/js/${outputFileName}`)
        }
      }
    }
  }

  async processImages(assetsDir) {
    const imgDir = join(assetsDir, 'images')
    if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true })
    
    // Use configurable glob pattern to find image files
    const imageFiles = await glob(this.patterns.images)
    
    if (imageFiles.length === 0) {
      console.log(`  ℹ️  No image files found matching pattern: ${this.patterns.images}`)
      return
    }
    
    for (const imagePath of imageFiles) {
      if (existsSync(imagePath)) {
        const fileName = basename(imagePath)
        const content = readFileSync(imagePath)
        const hash = generateHash(content)
        
        // Store hash with file-specific key
        const name = basename(fileName, extname(fileName))
        const hashKey = `${name}Hash`
        this.assetHashes[hashKey] = hash
        
        // For backwards compatibility, also store as imgHash if this is logo.svg
        if (fileName === 'logo.svg') {
          this.assetHashes.imgHash = hash
        }
        
        const ext = extname(fileName)
        const outputFileName = this.isProduction ? 
          `${name}.${hash}${ext}` : 
          fileName
        
        const outputPath = join(imgDir, outputFileName)
        const result = await this.optimizeImage(imagePath, outputPath)
        
        if (this.isProduction && result.originalSize > 0) {
          const savings = result.originalSize !== result.optimizedSize ? 
            ` (-${(((result.originalSize - result.optimizedSize) / result.originalSize) * 100).toFixed(1)}%)` : ''
          console.log(`  🖼️  ${fileName} → assets/images/${outputFileName} [${result.format}] (${result.originalSize}B → ${result.optimizedSize}B${savings})`)
        } else {
          console.log(`  ✓ ${fileName} → assets/images/${outputFileName}`)
        }
      }
    }
  }
}
