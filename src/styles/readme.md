# CSS Architecture: Hybrid Approach

This project uses a **hybrid CSS architecture** that combines CSS layers for global styles with encapsulated component styles for Shadow DOM components.

## File Structure

```
src/styles/
├── 00-reset.css      # @layer reset - Global resets
├── 01-tokens.css     # @layer tokens - Design tokens + layer definitions  
├── 02-components.css # @layer components - Global layout components
├── 03-utilities.css  # @layer utilities - Global utility classes
├── navbar.css        # Shadow DOM component styles (not layered)
├── landing_page.css  # Shadow DOM component styles (not layered)
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
@layer reset, tokens, components, utilities;
```

**Priority (lowest to highest):**
1. `reset` - Browser resets and base styles
2. `tokens` - Design tokens (colors, spacing, fonts)
3. `components` - Global layout components
4. `utilities` - Utility classes and overrides

## Loading Strategy

### **Global CSS (in `main.njk`)**
```html
<link rel="stylesheet" href="/assets/styles/00-reset.css" />
<link rel="stylesheet" href="/assets/styles/01-tokens.css" />
<link rel="stylesheet" href="/assets/styles/02-components.css" />
<link rel="stylesheet" href="/assets/styles/03-utilities.css" />
```

### **Shadow DOM Components**
Each component loads its own CSS within its shadow root:

```html
<!-- In header.njk -->
<template id="header-template">
  <link rel="stylesheet" href="/assets/styles/navbar.css">
  <!-- component content -->
</template>

<!-- In landing_page.njk -->
<template shadowrootmode="open">
  <link rel="stylesheet" href="/assets/styles/landing_page.css">
  <!-- component content -->
</template>
```

## File Details

### Global Files

**`00-reset.css`** - Reset Layer
- Browser resets and base HTML element styles
- Global typography and spacing resets

**`01-tokens.css`** - Tokens Layer + Layer Definitions
- **Contains the layer order declaration** (must load first!)
- CSS custom properties (design tokens)
- Font face declarations

**`02-components.css`** - Components Layer
- Global layout components (`.container`, `.svg-wrap`)
- Non-Shadow DOM component styles

**`03-utilities.css`** - Utilities Layer
- Utility classes that override component defaults
- Helper classes for spacing, layout

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
1. Create a dedicated CSS file (e.g., `component-name.css`)
2. Use `@layer components` to respect the hierarchy
3. Import the CSS within the component's template
4. Access design tokens via CSS custom properties

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