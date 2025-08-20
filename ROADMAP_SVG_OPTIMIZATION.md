# SVG Optimization & Fragmentation Roadmap

> Living document tracking all steps to split, optimize, and progressively load the landing illustration.

## Goals
- Eliminate giant inline SVG causing dev/build instability.
- Reduce transfer size & improve time-to-interactive.
- Preserve animatable / semantic IDs (smoke groups).
- Enable progressive, layered loading + graceful fallback.
- Maintain visual fidelity with acceptable precision loss.

## Target Fragments (raw → optimized)
Placed first in `src/assets/svg-raw/`, optimized to `public/assets/svg-optimized/`:
1. `base.svg` – shared <defs>, static structure (ground, buildings, static objects).
2. `surface-back.svg` – rear surface layer ("vie_surface" back if applicable).
3. `surface-front.svg` – foreground surface elements (interactive / highlight layer).
4. `smoke.svg` – only smoke/animated plumes: `fumée_1er_plan_gauche`, `fumée_1er_plan_droite`, `fumee_voiture`.
5. (Optional later) `ladder.svg` – removed for now.

All fragments retain identical `viewBox` and omit explicit width/height.

## Extraction Procedure
- [ ] Copy original monolith to `src/assets/svg-raw/INPLUG_illustration.original.svg` (archive).
- [ ] Duplicate it per planned fragment; delete unrelated groups per file.
- [ ] Normalize file headers: XML decl optional → keep only minimal `<svg>` root attrs.
- [ ] Remove empty groups and editor metadata.

## Defs / Dependency Pruning
For each fragment:
- [ ] Identify referenced IDs: search for `url(#` / `xlink:href="#` / `fill="url(#` / `clip-path="url(#` / `mask="url(#`.
- [ ] Build list of required `<defs>` children (filters, gradients, patterns, symbols, clipPaths, masks).
- [ ] Move ALL shared defs (used by >1 fragment) into `base.svg` only.
- [ ] In non-base fragments remove shared defs and ensure references still resolve after injection (same DOM tree root).
- [ ] Remove unused `<defs>` entries (SVGO can help confirm).
- [ ] Ensure no ID collisions after pruning (fallback: enable `prefixIds` per fragment if collisions appear—currently avoided by centralizing shared defs).

## SVGO Pipeline
Config: `svgo.config.mjs` (already created).
Steps:
- [ ] Run `npm run svg:inspect` for raw size baselines.
- [ ] Adjust `floatPrecision` (start 3; test 2 for non-critical fragments) — do not overoptimize smoke blurs if artifacts appear.
- [ ] Optionally add per-fragment overrides (e.g., keep precision=3 for smoke).
- [ ] Run `npm run svg:optimize` to produce optimized outputs.
- [ ] Verify visual parity by overlay testing (manual: open raw vs optimized in separate tabs / compositing diff if needed).

## Template & Loader Integration
- [ ] Update `landing_page.njk` placeholders to reference `/assets/svg-optimized/*.svg` by new names.
- [ ] Ensure placeholder order matches layering: base → surface-back → surface-front → smoke.
- [ ] Add `data-svg-order` attributes (optional) for deterministic sequential load.

## Loader Enhancements (`public/js/landing-page.js`)
- [ ] Implement sequential fetch (Promise chain) or priority queue; smoke last.
- [ ] Add retry (e.g., 1–2 retries with exponential backoff).
- [ ] Timeout safeguard (abort or skip after X ms).
- [ ] After smoke inject: ensure `.smoke-anim` class applied to target IDs; guard against duplicates.
- [ ] Expose hook `window.INPLUGIllustrationReady` (optional) after last layer.
- [ ] Respect `prefers-reduced-motion` (already partially covered) — skip animation class if reduced.

## Accessibility & Fallback
- [ ] Add `<noscript><img src="/assets/svg-optimized/base.svg" alt="Illustration" loading="lazy" decoding="async"></noscript>`.
- [ ] Provide `aria-hidden="true"` on decorative layers (unless labeled contextually).
- [ ] If semantic meaning needed, wrap in `<figure>` with `<figcaption>`.

## Performance Validation
- [ ] Measure individual fragment sizes (optimized) & total vs original monolith.
- [ ] Lighthouse / WebPageTest: LCP, TBT, CLS impact before/after.
- [ ] Confirm network waterfall: parallelizable fetches do not block main thread long.
- [ ] Check memory: ensure no duplicate defs cause bloat (DevTools Elements search for duplicated filter IDs).

## Animation Integrity
- [ ] Validate smoke keyframes run once fragment inserted.
- [ ] Ensure filters referenced by smoke are present (either in smoke.svg or base.svg defs before smoke load).
- [ ] Confirm no layout shift when smoke layer appears (placeholder sized via CSS to full viewBox ratio if needed).

## Error Handling & Resilience
- [ ] On fetch failure: log warning + optionally display compressed fallback image.
- [ ] Add small inline base64 placeholder (1×1 transparent) if needed to reserve space.
- [ ] Fail-safe: do not block other layers if one fails (except base failure may abort sequence).

## Optional Future Enhancements
- [ ] Convert static layers to `<img src>` (allow browser caching) and animate only an inline smoke `<svg>`.
- [ ] IntersectionObserver rootMargin tuning for earlier prefetch.
- [ ] Introduce `<inplug-illustration>` custom element encapsulating logic.
- [ ] Use `requestIdleCallback` for non-critical layer injection.
- [ ] Implement hash-based cache-busting (SVGO output hash in filename).
- [ ] Add automated visual regression test (Pixelmatch or Puppeteer) for optimized vs raw.

## Checklist Snapshot
- [ ] Archive & fragment raw SVG
- [ ] Prune defs per fragment
- [ ] Centralize shared defs in base
- [ ] Optimize & verify output
- [ ] Update template placeholders
- [ ] Enhance loader (sequential + retry)
- [ ] Add noscript fallback
- [ ] Validate animation & filters
- [ ] Run performance audits
- [ ] Document results in README_SVG_OPTIMIZATION.md (append delta metrics)

## Exit Criteria
Completed when: fragmented assets load without errors, size reduction >= X% (define threshold, e.g. 60%), no visual regressions, LCP/TBT improve or unchanged, build no longer impacted by inline SVG.

---
Update this file as tasks complete. Use PR checklists referencing these boxes.
