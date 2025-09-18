#!/usr/bin/env node

import sharp from "sharp";
import { glob } from "glob";
import path from "path";
import fs from "fs/promises";

/**
 * Generate basic WebP versions of PNG images for development
 * No optimization, just format conversion for <picture> element testing
 */

const PUBLIC_DIR = "public";
const IMAGES_PATTERN = `${PUBLIC_DIR}/**/*.png`;

async function generateDevWebP() {
  console.log("🔄 Generating basic WebP files for development...");

  try {
    // Find all PNG files in public directory
    const pngFiles = await glob(IMAGES_PATTERN);

    if (pngFiles.length === 0) {
      console.log("ℹ️  No PNG files found in public directory");
      return;
    }

    console.log(`📁 Found ${pngFiles.length} PNG files`);

    // Convert each PNG to WebP (basic quality, no optimization)
    for (const pngFile of pngFiles) {
      const webpFile = pngFile.replace(".png", ".webp");

      try {
        // Check if WebP already exists and is newer than PNG
        const pngStats = await fs.stat(pngFile);
        let webpStats;
        try {
          webpStats = await fs.stat(webpFile);
        } catch {
          // WebP doesn't exist, we'll create it
        }

        if (webpStats && webpStats.mtime > pngStats.mtime) {
          console.log(
            `⏭️  Skipping ${path.basename(webpFile)} (already up to date)`,
          );
          continue;
        }

        // Convert PNG to WebP with basic quality (fast conversion)
        await sharp(pngFile)
          .webp({ quality: 80, effort: 1 }) // Low effort = fast conversion
          .toFile(webpFile);

        console.log(`✅ Generated ${path.basename(webpFile)}`);
      } catch (error) {
        console.error(`❌ Error converting ${pngFile}:`, error.message);
      }
    }

    console.log("🎉 WebP generation complete!");
  } catch (error) {
    console.error("❌ Error generating WebP files:", error.message);
    process.exit(1);
  }
}

generateDevWebP();
