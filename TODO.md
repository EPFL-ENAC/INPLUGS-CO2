# Project TODO List

## PLugin asset management

- [x] Asset management should be logically following the readme
      not weird stuff like /styles or public/js in assets
      this.patterns = {
      css: options.cssPattern || join(this.srcDir, "styles", "\*_", "_.css"),
      js: options.jsPattern || "public/js/_.js",
      images:
      options.imagePattern ||
      join(this.srcDir, "assets", "_.{svg,png,jpg,jpeg,webp,gif}"),
      };

## Site Structure & Navigation

- [ ] Review and optimize site navigation flow
- [ ] Ensure consistent navbar implementation across all pages
- [ ] Verify footer content is up-to-date and consistent

## Page Content

- [ ] Audit all page content for accuracy and completeness
- [ ] Check language consistency between EN/FR versions
- [ ] Update meta descriptions and SEO elements

## Styling & UI

- [ ] Review CSS for unused or redundant styles
- [ ] Ensure responsive design works across all device sizes
- [ ] Check color scheme consistency with design tokens
- [ ] Optimize font loading and performance

## Performance Optimization

- [ ] Audit image sizes and formats (WebP conversion)
- [ ] Minify CSS and JavaScript assets
- [ ] Implement proper caching strategies
- [ ] Run Lighthouse tests and address issues

## JavaScript Functionality

- [ ] Review and optimize existing JS files
- [ ] Ensure progressive enhancement principles
- [ ] Add error handling where missing

## Accessibility

- [ ] Run accessibility audit
- [ ] Ensure proper semantic HTML
- [ ] Check color contrast ratios
- [ ] Verify keyboard navigation

## Build & Deployment

- [ ] Review build process efficiency
- [ ] Check Docker configuration
- [ ] Validate nginx configuration
  - [ ] focus on app.mydomain.com and host name
- [ ] Test deployment process
- [ ] redirect html (index.html) don't take into account the port when redirecting to fr or en (maybe find a better nginx ? trick ?)

## Documentation

- [ ] Update README with latest project info
- [ ] Document build process
- [ ] Add comments to complex code sections
