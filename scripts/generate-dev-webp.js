#!/usr/bin/env node

import sharp from "sharp";
import { glob } from "glob";
import path from "path";
import fs from "fs/promises";

/**
 * Generate basic WebP versions of PNG/JPG/JPEG images for development
 * No optimization, just format conversion for <picture> element testing
 * Processes both public/ and src/assets/ directories
 */

const PUBLIC_DIR = "public";
const ASSETS_DIR = "src/assets";
const PUBLIC_IMAGES_PATTERN = `${PUBLIC_DIR}/**/*.{png,jpg,jpeg}`;
const ASSETS_IMAGES_PATTERN = `${ASSETS_DIR}/**/*.{png,jpg,jpeg}`;

async function generateDevWebP() {
  console.log("🔄 Generating basic WebP files for development...");

  try {
    // Find all PNG/JPG/JPEG files in both public and src/assets directories
    const publicImageFiles = await glob(PUBLIC_IMAGES_PATTERN);
    const assetsImageFiles = await glob(ASSETS_IMAGES_PATTERN);
    const allImageFiles = [...publicImageFiles, ...assetsImageFiles];

    if (allImageFiles.length === 0) {
      console.log(
        "ℹ️  No PNG/JPG/JPEG files found in public or src/assets directories",
      );
      return;
    }

    console.log(
      `📁 Found ${allImageFiles.length} image files (${publicImageFiles.length} in public/, ${assetsImageFiles.length} in src/assets/)`,
    );

    // Convert each image to WebP (basic quality, no optimization)
    for (const imageFile of allImageFiles) {
      // Determine WebP filename based on original extension
      let webpFile;
      if (imageFile.endsWith(".png")) {
        webpFile = imageFile.replace(".png", ".webp");
      } else if (imageFile.endsWith(".jpg")) {
        webpFile = imageFile.replace(".jpg", ".webp");
      } else if (imageFile.endsWith(".jpeg")) {
        webpFile = imageFile.replace(".jpeg", ".webp");
      } else {
        // Skip unsupported formats
        continue;
      }

      try {
        // Check if WebP already exists and is newer than source image
        const imageStats = await fs.stat(imageFile);
        let webpStats;
        try {
          webpStats = await fs.stat(webpFile);
        } catch {
          // WebP doesn't exist, we'll create it
        }

        if (webpStats && webpStats.mtime > imageStats.mtime) {
          console.log(
            `⏭️  Skipping ${path.basename(webpFile)} (already up to date)`,
          );
          continue;
        }

        // Convert image to WebP with basic quality (fast conversion)
        await sharp(imageFile)
          .webp({ quality: 80, effort: 1 }) // Low effort = fast conversion
          .toFile(webpFile);

        console.log(`✅ Generated ${path.basename(webpFile)}`);
      } catch (error) {
        console.error(`❌ Error converting ${imageFile}:`, error.message);
      }
    }

    console.log("🎉 WebP generation complete!");
  } catch (error) {
    console.error("❌ Error generating WebP files:", error.message);
    process.exit(1);
  }
}

generateDevWebP();
