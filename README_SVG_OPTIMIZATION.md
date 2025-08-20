# SVG Optimization Pipeline

## Directories
- `src/assets/svg-raw/` : Place original, unoptimized fragment SVGs here.
- `public/assets/svg-optimized/` : Output of SVGO (git-ignored recommended).

## Commands
- `npm run svg:inspect` : Dry-run – shows potential optimizations without writing.
- `npm run svg:optimize` : Optimize all fragments from `svg-raw` to `svg-optimized`.

## Suggested Fragment Breakdown
- `base.svg` (geology + underground, no ladder)
- `surface-back.svg` (background surface life)
- `surface-front.svg` (foreground surface life / people)
- `smoke.svg` (animatable smoke groups only)
- `ladder.svg` (optional scale, load on demand)

## Post-Processing / Assembly
Client-side custom element loads fragments in sequence:
1. Base (immediate)
2. Surface layers (IntersectionObserver)
3. Overlays / smoke (after idle)
4. Ladder (on user request toggle)

## Tips for Further Size Reduction
- Remove embedded raster <image> elements; export them as external WebP assets.
- Consolidate repeated drop-shadow filters into one reusable filter.
- Use <symbol> + <use> for repeated small circles / dots.
- Adjust `floatPrecision` (try 2) if visuals remain acceptable.
- If very dense decorative patterns: rasterize to a tiny repeating PNG/WebP.

## Animation Hook
Ensure animatable groups (e.g. `fumée_1er_plan_gauche`) retain stable IDs; loader will add `smoke-anim` class after injection.

