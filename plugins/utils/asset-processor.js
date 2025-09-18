// asset-processor.js
import { join, dirname, basename, extname } from "path";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { parse } from "path";
import { glob } from "glob";
import { generateHash } from "./locale-utils.js";

/**
 * AssetProcessor - A flexible asset processing utility using glob patterns
 * - Incremental: caches image hashes & outputs; skips unchanged work
 * - CSS/JS minification and cache-busting hashes in production
 * - Image optimization with WebP generation via sharp (in production)
 * - Copies/optimizes public assets incrementally too
 */
export class AssetProcessor {
  constructor(options = {}) {
    this.srcDir = options.srcDir || "src";
    this.outputDir = options.outputDir || "dist";
    this.copyPublic = options.copyPublic !== false;
    this.isProduction = false;
    this.assetHashes = {};
    this.manifest = {};
    this.patterns = {
      css: options.cssPattern || join(this.srcDir, "styles", "*.css"),
      js: options.jsPattern || "public/js/*.js",
      images:
        options.imagePattern ||
        join(this.srcDir, "assets", "*.{svg,png,jpg,jpeg,webp,gif}"),
    };

    this.cacheFile =
      options.cacheFile || join(this.outputDir, ".asset-cache.json");
    this.cache = this.#loadCache();
  }

  setProduction(isProduction) {
    this.isProduction = isProduction;
  }

  getAssetHashes() {
    return this.assetHashes;
  }
  getManifest() {
    return this.manifest;
  }
  // ---------- Cache helpers ----------
  #loadCache() {
    try {
      if (existsSync(this.cacheFile)) {
        return JSON.parse(readFileSync(this.cacheFile, "utf8"));
      }
    } catch {}
    return { images: {} };
  }

  #saveCache() {
    try {
      mkdirSync(dirname(this.cacheFile), { recursive: true });
      writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch {}
  }

  #saveManifest() {
    try {
      console.log(JSON.stringify(this.manifest, null, 2));
      writeFileSync(
        join(this.outputDir, "asset-manifest.json"),
        JSON.stringify(this.manifest, null, 2),
      );
    } catch (error) {
      console.warn("Failed to save asset manifest:", error.message);
    }
  }

  // inside the class
  #toSafeKey(base) {
    // turn "landing-page", "landing_page", "landing page" → "landingPage"
    const camel = base
      .trim()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, ch) => (ch ? ch.toUpperCase() : ""));
    const normalized = camel ? camel[0].toLowerCase() + camel.slice(1) : camel;
    // identifiers can't start with a digit; prefix with "_" if so
    return /^[a-zA-Z]/.test(normalized) ? normalized : `_${normalized}`;
  }

  // Requires: import { parse } from "path" (or node:path)
  // import { parse } from "node:path"
  #imageOutputsFor(
    fileName,
    hash,
    ext,
    imgDir,
    publicImgDir = "/assets/images",
  ) {
    const { name } = parse(fileName);
    const extLower = ext.toLowerCase();

    // Logical/physical PUBLIC urls (for templates)
    const mainLogical = `${publicImgDir}/${fileName}`;
    const mainPhysical = this.isProduction
      ? `${publicImgDir}/${name}.${hash}${extLower}`
      : mainLogical;

    // Register main asset
    this.manifest[mainLogical] = mainPhysical;

    // Optional webp sibling (for png/jpg/jpeg)
    let webpPhysical = null;
    if ([".png", ".jpg", ".jpeg"].includes(extLower)) {
      const webpLogical = `${publicImgDir}/${name}.webp`;
      webpPhysical = this.isProduction
        ? `${publicImgDir}/${name}.${hash}.webp`
        : webpLogical;

      this.manifest[webpLogical] = webpPhysical;
    }

    // Still return file-system paths if you need them elsewhere
    const mainFs = this.isProduction
      ? `${imgDir}/${name}.${hash}${extLower}`
      : `${imgDir}/${fileName}`;

    const webpFs = webpPhysical
      ? this.isProduction
        ? `${imgDir}/${name}.${hash}.webp`
        : `${imgDir}/${name}.webp`
      : null;

    return {
      // FS paths (write/copy work)
      fs: { main: mainFs, webp: webpFs },
      // Public URLs (templating)
      url: { main: mainPhysical, webp: webpPhysical },
    };
  }

  #isImageStale(srcPath, currentHash, outputs) {
    const cached = this.cache.images[srcPath];
    if (!cached) return true;
    if (cached.hash !== currentHash) return true;
    if (!existsSync(outputs.fs?.main)) return true;
    if (outputs.fs?.webp && !existsSync(outputs.fs?.webp)) return true;
    return false;
  }

  #updateImageCache(srcPath, newHash, outputs) {
    let mtimeMs = 0;
    try {
      mtimeMs = statSync(srcPath).mtimeMs;
    } catch {}
    this.cache.images[srcPath] = {
      hash: newHash,
      main: outputs.fs?.main,
      webp: outputs.fs?.webp || null,
      mtimeMs,
    };
  }

  #pruneOldHashedFiles(dir, baseName, keepHash, ext) {
    // remove old name.<hash>.<ext> siblings
    const prefix = `${baseName}.`;
    try {
      for (const f of readdirSync(dir)) {
        if (f.startsWith(prefix) && f.endsWith(ext) && !f.includes(keepHash)) {
          try {
            unlinkSync(join(dir, f));
          } catch {}
        }
      }
    } catch {}
  }

  // ---------- Minifiers ----------
  async minifyCSS(cssContent) {
    if (!this.isProduction) return cssContent;
    try {
      return cssContent
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\s+/g, " ")
        .replace(/;\s*}/g, "}")
        .replace(/{\s*/g, "{")
        .replace(/;\s*/g, ";")
        .replace(/,\s*/g, ",")
        .replace(/:\s*/g, ":")
        .trim();
    } catch (error) {
      console.warn("CSS minification failed:", error.message);
      return cssContent;
    }
  }

  async minifyJS(jsContent) {
    if (!this.isProduction) return jsContent;
    try {
      return jsContent
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
        .replace(/\s+/g, " ")
        .replace(/;\s*}/g, ";}")
        .replace(/{\s*/g, "{")
        .replace(/}\s*/g, "}")
        .trim();
    } catch (error) {
      console.warn("JS minification failed:", error.message);
      return jsContent;
    }
  }

  // ---------- Images ----------
  async optimizeImage(inputPath, outputPath) {
    if (!this.isProduction) {
      copyFileSync(inputPath, outputPath);
      return { originalSize: 0, optimizedSize: 0, format: "copied" };
    }

    try {
      const sharp = (await import("sharp")).default;
      const ext = extname(inputPath).toLowerCase();
      const originalBuffer = readFileSync(inputPath);
      const originalSize = originalBuffer.length;

      let optimizedBuffer;
      let outputFormat = ext.slice(1);

      if (ext === ".svg") {
        optimizedBuffer = originalBuffer;
        outputFormat = "svg (copied)";
      } else if ([".png", ".jpg", ".jpeg"].includes(ext)) {
        const webpPath = outputPath.replace(ext, ".webp");
        optimizedBuffer = await sharp(originalBuffer)
          .webp({ quality: 75, effort: 6, lossless: false })
          .toBuffer();
        writeFileSync(webpPath, optimizedBuffer);
        outputFormat = "webp";

        let originalOptimized;
        if (ext === ".png") {
          originalOptimized = await sharp(originalBuffer)
            .png({ quality: 85, compressionLevel: 9, effort: 10 })
            .toBuffer();
        } else {
          originalOptimized = await sharp(originalBuffer)
            .jpeg({ quality: 85, progressive: true, mozjpeg: true })
            .toBuffer();
        }
        writeFileSync(outputPath, originalOptimized);

        return {
          originalSize,
          optimizedSize: originalOptimized.length,
          webpSize: optimizedBuffer.length,
          format: `${outputFormat} + optimized ${ext.slice(1)}`,
          webpPath: basename(webpPath),
        };
      } else if (ext === ".webp") {
        optimizedBuffer = await (await import("sharp"))
          .default(originalBuffer)
          .webp({ quality: 75, effort: 6, lossless: false })
          .toBuffer();
        outputFormat = "webp (optimized)";
      } else {
        optimizedBuffer = originalBuffer;
        outputFormat = "copied";
      }

      writeFileSync(outputPath, optimizedBuffer);

      return {
        originalSize,
        optimizedSize: optimizedBuffer.length,
        format: outputFormat,
      };
    } catch (error) {
      console.warn(
        `⚠️  Image optimization failed for ${inputPath}:`,
        error.message,
      );
      copyFileSync(inputPath, outputPath);
      return { originalSize: 0, optimizedSize: 0, format: "error (copied)" };
    }
  }

  // ---------- Public assets (incremental) ----------
  async copyPublicAssets() {
    const publicDir = "public";
    if (!existsSync(publicDir)) {
      console.warn("Public directory not found, skipping public assets copy");
      return;
    }

    const excludePatterns = ["site.webmanifest"];

    const shouldExclude = (relativePath) =>
      excludePatterns.some((p) => relativePath.includes(p));

    const copyRecursively = async (sourceDir, targetDir, basePath = "") => {
      if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
      const items = readdirSync(sourceDir, { withFileTypes: true });

      for (const item of items) {
        const sourcePath = join(sourceDir, item.name);
        const targetPath = join(targetDir, item.name);
        const relativePath = join(basePath, item.name).replace(/\\/g, "/");

        if (item.isDirectory()) {
          await copyRecursively(sourcePath, targetPath, relativePath);
          continue;
        }
        if (!item.isFile() || shouldExclude(relativePath)) continue;

        const ext = extname(item.name).toLowerCase();
        const isImage = [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(
          ext,
        );

        if (isImage && this.isProduction) {
          const buf = readFileSync(sourcePath);
          const hash = generateHash(buf);
          const outputs = { fs: { main: targetPath, webp: null } };
          if (!this.#isImageStale(sourcePath, hash, outputs)) {
            console.log(`  ⏭️  ${relativePath} (cached)`);
            continue;
          }
          const result = await this.optimizeImage(sourcePath, targetPath);
          if ([".png", ".jpg", ".jpeg"].includes(ext)) {
            outputs.webp = targetPath.replace(ext, ".webp");
          }
          this.#updateImageCache(sourcePath, hash, outputs);

          let sizeInfo = "";
          if (result.originalSize > 0) {
            const savings = (
              ((result.originalSize - result.optimizedSize) /
                result.originalSize) *
              100
            ).toFixed(1);
            sizeInfo = ` (${result.originalSize}B → ${result.optimizedSize}B, -${savings}%)`;
            if (result.webpSize) {
              const webpSavings = (
                ((result.originalSize - result.webpSize) /
                  result.originalSize) *
                100
              ).toFixed(1);
              sizeInfo += ` + ${result.webpPath} (-${webpSavings}%)`;
            }
          }
          console.log(
            `  🖼️  ${relativePath} → ${relativePath} [${result.format}]${sizeInfo}`,
          );
        } else {
          // fast copy only when needed
          const needCopy =
            !existsSync(targetPath) ||
            (existsSync(targetPath) &&
              statSync(targetPath).mtimeMs < statSync(sourcePath).mtimeMs);
          if (needCopy) copyFileSync(sourcePath, targetPath);
          console.log(
            `  ✓ ${relativePath} → ${relativePath}${needCopy ? "" : " (unchanged)"}`,
          );
        }
      }
    };

    await copyRecursively(publicDir, this.outputDir);
  }

  // ---------- Pipeline ----------
  async processAssets() {
    if (this.copyPublic) {
      console.log("📁 Copying public directory...");
      await this.copyPublicAssets();
    }

    console.log("🎨 Processing styled assets...");
    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
    const assetsDir = join(this.outputDir, "assets");
    if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

    this.assetHashes = {};

    await this.processCSSFiles(assetsDir);
    await this.processJSFiles(assetsDir);
    await this.processImages(assetsDir);

    this.#saveManifest();
    this.#saveCache();
  }

  // ---------- CSS ----------
  async processCSSFiles(assetsDir) {
    const cssDir = join(assetsDir, "styles");
    if (!existsSync(cssDir)) mkdirSync(cssDir, { recursive: true });

    const cssFiles = await glob(this.patterns.css);
    if (cssFiles.length === 0) {
      console.log(
        `  ℹ️  No CSS files found matching pattern: ${this.patterns.css}`,
      );
      return;
    }

    let combinedCssContent = "";
    let totalOriginalSize = 0;
    let totalMinifiedSize = 0;

    for (const filePath of cssFiles) {
      if (!existsSync(filePath)) continue;
      try {
        const content = readFileSync(filePath, "utf8");
        combinedCssContent += content;
        totalOriginalSize += content.length;
      } catch (error) {
        console.warn(`⚠️  Failed to read CSS file ${filePath}:`, error.message);
        continue;
      }
    }

    const minifiedCombinedContent = await this.minifyCSS(combinedCssContent);
    const cssHash = minifiedCombinedContent
      ? generateHash(minifiedCombinedContent)
      : "";
    if (cssHash) this.assetHashes.cssHash = cssHash;

    for (const filePath of cssFiles) {
      if (!existsSync(filePath)) continue;
      try {
        const fileName = basename(filePath);
        const content = readFileSync(filePath, "utf8");
        const processedContent = await this.minifyCSS(content);
        totalMinifiedSize += processedContent.length;

        const outputFileName = this.isProduction
          ? fileName.replace(".css", `.${cssHash}.css`)
          : fileName;
        this.manifest[`/assets/styles/${fileName}`] =
          `/assets/styles/${outputFileName}`;

        // Ensure the CSS directory exists before writing
        if (!existsSync(cssDir)) {
          mkdirSync(cssDir, { recursive: true });
        }

        writeFileSync(join(cssDir, outputFileName), processedContent);

        if (this.isProduction) {
          const savings = (
            ((content.length - processedContent.length) / content.length) *
            100
          ).toFixed(1);
          console.log(
            `  🎨 ${fileName} → assets/styles/${outputFileName} (${content.length}B → ${processedContent.length}B, -${savings}%)`,
          );
        } else {
          console.log(`  ✓ ${fileName} → assets/styles/${outputFileName}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process CSS file ${filePath}:`, error.message);
        continue;
      }
    }

    if (this.isProduction && totalOriginalSize > 0) {
      const totalSavings = (
        ((totalOriginalSize - totalMinifiedSize) / totalOriginalSize) *
        100
      ).toFixed(1);
      console.log(
        `📊 CSS optimization summary: ${totalOriginalSize}B → ${totalMinifiedSize}B (-${totalSavings}%)`,
      );
    }
  }

  // ---------- JS ----------
  async processJSFiles(assetsDir) {
    const jsDir = join(assetsDir, "js");
    if (!existsSync(jsDir)) mkdirSync(jsDir, { recursive: true });

    const jsFiles = await glob(this.patterns.js);
    if (jsFiles.length === 0) {
      console.log(
        `  ℹ️  No JS files found matching pattern: ${this.patterns.js}`,
      );
      return;
    }

    for (const jsPath of jsFiles) {
      if (!existsSync(jsPath)) continue;

      const fileName = basename(jsPath);
      const content = readFileSync(jsPath, "utf8");
      const minifiedContent = await this.minifyJS(content);
      const hash = generateHash(minifiedContent);

      const fileBase = fileName.replace(/\.js$/i, "");
      const unsafeKey = `${fileBase}Hash`;
      const safeKey = `${this.#toSafeKey(fileBase)}Hash`;

      // expose both: original (may contain -) and safe camelCase
      this.assetHashes[unsafeKey] = hash;
      this.assetHashes[safeKey] = hash;

      const outputFileName = this.isProduction
        ? fileName.replace(".js", `.${hash}.js`)
        : fileName;
      writeFileSync(join(jsDir, outputFileName), minifiedContent);
      this.manifest[`/assets/js/${fileName}`] = `/assets/js/${outputFileName}`;
      if (this.isProduction) {
        const savings = (
          ((content.length - minifiedContent.length) / content.length) *
          100
        ).toFixed(1);
        console.log(
          `  ⚡ ${fileName} → assets/js/${outputFileName} (${content.length}B → ${minifiedContent.length}B, -${savings}%)`,
        );
      } else {
        console.log(`  ✓ ${fileName} → assets/js/${outputFileName}`);
      }
    }
  }

  // ---------- Images (incremental, hashed in prod) ----------
  async processImages(assetsDir) {
    const imgDir = join(assetsDir, "images");
    if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });

    const imageFiles = await glob(this.patterns.images);
    if (imageFiles.length === 0) {
      console.log(
        `  ℹ️  No image files found matching pattern: ${this.patterns.images}`,
      );
      return;
    }

    for (const imagePath of imageFiles) {
      if (!existsSync(imagePath)) continue;

      const fileName = basename(imagePath);
      const content = readFileSync(imagePath);
      const hash = generateHash(content);
      const ext = extname(fileName);

      // template hashes
      const name = basename(fileName, ext);
      const unsafeKey = `${name}Hash`;
      const safeKey = `${this.#toSafeKey(name)}Hash`;

      this.assetHashes[unsafeKey] = hash;
      this.assetHashes[safeKey] = hash;
      if (fileName === "logo.svg") this.assetHashes.imgHash = hash;

      const publicImgDir = "/assets/images"; // public URL base
      const outputs = this.#imageOutputsFor(
        fileName,
        hash,
        ext,
        imgDir,
        publicImgDir,
      );

      if (!this.isProduction) {
        const needCopy =
          !existsSync(outputs.fs.main) ||
          (existsSync(outputs.fs.main) &&
            statSync(outputs.fs.main).mtimeMs < statSync(imagePath).mtimeMs);
        if (needCopy) {
          copyFileSync(imagePath, outputs.fs.main);
          console.log(
            `  ✓ ${fileName} → assets/images/${basename(outputs.fs.main)}`,
          );
        } else {
          console.log(`  ↺ ${fileName} (unchanged)`);
        }
        continue;
      }

      if (!this.#isImageStale(imagePath, hash, outputs)) {
        console.log(
          `  ⏭️  ${fileName} → assets/images/${basename(outputs.fs.main)} (cached)`,
        );
        continue;
      }

      const result = await this.optimizeImage(imagePath, outputs.fs.main);

      // // ensure webp path captured in cache for jpeg/png
      // if ([".png", ".jpg", ".jpeg"].includes(ext.toLowerCase())) {
      //   outputs.webp = outputs.main.replace(ext, ".webp");
      // }

      // prune old hashed siblings
      this.#pruneOldHashedFiles(imgDir, name, hash, ext);
      if (outputs.fs.webp)
        this.#pruneOldHashedFiles(imgDir, name, hash, ".webp");

      this.#updateImageCache(imagePath, hash, outputs);

      if (result.originalSize > 0) {
        const savings =
          result.originalSize !== result.optimizedSize
            ? ` (-${(((result.originalSize - result.optimizedSize) / result.originalSize) * 100).toFixed(1)}%)`
            : "";
        console.log(
          `  🖼️  ${fileName} → assets/images/${basename(outputs.fs.main)} [${result.format}] (${result.originalSize}B → ${result.optimizedSize}B${savings})`,
        );
      } else {
        console.log(
          `  ✓ ${fileName} → assets/images/${basename(outputs.fs.main)}`,
        );
      }
    }
  }
}
