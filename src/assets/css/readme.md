# CSS Architecture: Hybrid Approach

This project uses a **hybrid CSS architecture** that combines CSS layers for global styles with encapsulated component styles for Shadow DOM components.

## File Structure

```
src/styles/
├── 00-reset.css      # @layer reset - Global resets
├── 01-tokens.css     # @layer tokens - Design tokens + layer definitions
├── 02-layout.css     # @layer layout - Global layout systems
├── 03-utilities.css  # @layer utilities - Global utility classes
├── 04-components.css # @layer components - Global reusable components
├── navbar.css        # Shadow DOM component styles (@layer components)
├── landing_page.css  # Shadow DOM component styles (@layer components)
├── component.example.css # Template for new Shadow DOM components
└── readme.md
```

## Architecture Principles

### **Global CSS (Layered)**

Used for styles that affect the entire document:

- Layout components (`.container`, `.svg-wrap`)
- Base resets and typography
- Utility classes

### **Component CSS (Encapsulated)**

Used for Shadow DOM components that need style encapsulation:

- Navbar component (`navbar.css`)
- Landing page component (`landing_page.css`)

## Layer Order (Global Only)

The layer order is defined in `01-tokens.css`:

```css
@layer reset, tokens, layout, utilities, components;
```

**Priority (lowest to highest):**

1. `reset` - Browser resets and base styles
2. `tokens` - Design tokens (colors, spacing, fonts)
3. `layout` - Global layout systems (container, grids)
4. `utilities` - Utility classes and overrides
5. `components` - Reusable components (highest priority)

## Loading Strategy

### **Global CSS (in `main.njk`)**

````html
The files are loaded in `main.njk` in the correct order: ```html
<link rel="stylesheet" href="/assets/styles/00-reset.css" />
<link rel="stylesheet" href="/assets/styles/01-tokens.css" />
<link rel="stylesheet" href="/assets/styles/02-layout.css" />
<link rel="stylesheet" href="/assets/styles/03-utilities.css" />
<link rel="stylesheet" href="/assets/styles/04-components.css" />
````

````

### **Shadow DOM Components**
Each component loads its own CSS within its shadow root:

```html
<!-- In navbar.njk -->
<template id="header-template">
  <link rel="stylesheet" href="/assets/styles/navbar.css">
  <!-- component content -->
</template>

<!-- In landing_page.njk -->
<template shadowrootmode="open">
  <link rel="stylesheet" href="/assets/styles/landing_page.css">
  <!-- component content -->
</template>
````

### Recommendation

Remove shadow DOM from your project because

YAGNI Principle: You aren't reusing components, so you don't need the encapsulation benefits
Simplicity: Removing shadow DOM simplifies both HTML structure and JavaScript
Easier Maintenance: Less complex code is easier to maintain and debug
Better Developer Experience: Easier to inspect and modify in browser dev tools
Instead, focus on:

Using consistent CSS naming conventions (like BEM)
Proper semantic HTML structure
Well-organized partial templates

## File Details

### Global Files

**`00-reset.css`** - Reset Layer

- Browser resets and base HTML element styles
- Global typography and spacing resets

**`01-tokens.css`** - Tokens Layer + Layer Definitions

- **Contains the layer order declaration** (must load first!)
- CSS custom properties (design tokens)
- Font face declarations

**`02-layout.css`** - Layout Layer

- Global layout systems (`.container`, `.svg-wrap`, `.full-bleed`)
- Grid systems and page structure
- Layout utilities that affect document flow

**`03-utilities.css`** - Utilities Layer

- Utility classes that override layout and component defaults
- Helper classes for spacing, layout, display
- Classes that should override components when needed

**`04-components.css`** - Components Layer

- Reusable UI components (buttons, cards, modals)
- Non-Shadow DOM component styles
- Highest priority for complex component interactions

### Component Files

**`navbar.css`** - Navbar Component

- All navbar styles within `@layer components`
- Includes responsive behavior and interactions
- Loaded only within the navbar shadow root

**`landing_page.css`** - Landing Page Component

- All landing page styles within `@layer components`
- Includes animations and state management
- Loaded only within landing page shadow roots

## Why This Hybrid Approach?

### **Benefits of Layered Global CSS:**

- Predictable cascade for document-wide styles
- Clear separation of concerns
- Easy maintenance of base styles

### **Benefits of Encapsulated Component CSS:**

- **True style isolation** for Shadow DOM components
- **Prevents style leakage** between components
- **Reusable components** with their own styling
- **Component-specific** CSS loading

### **Design Token Sharing:**

- Components can access CSS custom properties from `01-tokens.css`
- Consistent colors, spacing, and breakpoints across all styles
- Global design system with local implementation

## Component Development Guidelines

### **For Shadow DOM Components:**

1. **Copy `component.example.css`** as a starting point for new components
2. Use `@layer components` to respect the hierarchy
3. Import the CSS within the component's template
4. Access design tokens via CSS custom properties
5. **Important**: Use raw pixel values for breakpoints in media queries - CSS custom properties cannot be used directly in media query conditions (they're documented in the example file for reference only)

### **For Global Styles:**

1. Use the appropriate layered CSS file
2. Avoid component-specific styles in global files
3. Focus on layout, utilities, and base styles

## Migration Benefits

This hybrid approach provides:

1. **Style Encapsulation** - Shadow DOM components are truly isolated
2. **Design System Consistency** - Shared tokens across all components
3. **Performance** - CSS only loads where needed
4. **Maintainability** - Clear separation between global and component styles
5. **Flexibility** - Components can be moved/reused without style conflicts

## Best Practices

1. **Global styles should be generic** - layout, utilities, base elements
2. **Component styles should be specific** - all styles for that component
3. **Use design tokens** - access shared variables in component CSS
4. **Load `01-tokens.css` first** - it defines layers and provides tokens
5. **Keep Shadow DOM CSS encapsulated** - don't leak styles outside components
