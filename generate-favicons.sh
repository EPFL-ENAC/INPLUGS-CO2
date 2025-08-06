#!/bin/bash

# Generate favicons from logo
cd public/assets/images

echo "🎨 Generating favicons from logo..."

# Android Chrome icons
echo "📱 Generating Android Chrome icons..."
magick "logo/logo_inplugs_756x604.png" -resize 192x192 -gravity center -extent 192x192 favicon/android-chrome-192x192.png
magick "logo/logo_inplugs_756x604.png" -resize 384x384 -gravity center -extent 384x384 favicon/android-chrome-384x384.png

# Apple Touch Icon
echo "🍎 Generating Apple Touch Icon..."
magick "logo/logo_inplugs_756x604.png" -resize 180x180 -gravity center -extent 180x180 favicon/apple-touch-icon.png

# Standard PNG favicons
echo "🖼️  Generating standard favicons..."
magick "logo/logo_inplugs_756x604.png" -resize 16x16 -gravity center -extent 16x16 favicon/favicon-16x16.png
magick "logo/logo_inplugs_756x604.png" -resize 32x32 -gravity center -extent 32x32 favicon/favicon-32x32.png

# Multi-size ICO file
echo "🏷️  Generating favicon.ico..."
magick "logo/logo_inplugs_756x604.png" \
  \( -clone 0 -resize 16x16 -gravity center -extent 16x16 \) \
  \( -clone 0 -resize 32x32 -gravity center -extent 32x32 \) \
  \( -clone 0 -resize 48x48 -gravity center -extent 48x48 \) \
  -delete 0 favicon/favicon.ico

echo "✅ All favicons generated successfully!"
echo "📊 Generated files:"
ls -la favicon/
