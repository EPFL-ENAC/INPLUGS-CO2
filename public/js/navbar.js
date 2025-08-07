/**
 * Responsive Navigation System
 * Creates shadow DOM imperatively and implements progressive collapse
 */
class ResponsiveNavigation {
  constructor() {
    this.initialized = false;
    this.mobileMenuOpen = false;
    this.moreDropdownOpen = false;
    this.resizeTimeout = null;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    console.log('ResponsiveNavigation: Initializing...');
    
    // Create shadow DOM for site-header
    this.setupShadowDOM();
    
    // Wait a bit for shadow DOM to be attached
    setTimeout(() => {
      this.setupEventListeners();
      this.handleResize();
      this.initialized = true;
      console.log('ResponsiveNavigation: Initialization complete');
    }, 10);
  }

  setupShadowDOM() {
    const siteHeader = document.querySelector('site-header');
    const template = siteHeader?.querySelector('#header-template');
    
    if (!siteHeader || !template) {
      console.error('ResponsiveNavigation: Could not find site-header or template');
      return;
    }

    // Create shadow root
    const shadowRoot = siteHeader.attachShadow({ mode: 'open' });
    
    // Clone template content
    const templateContent = template.content.cloneNode(true);
    shadowRoot.appendChild(templateContent);
    
    console.log('ResponsiveNavigation: Shadow DOM created');
    this.shadowRoot = shadowRoot;
    this.siteHeader = siteHeader;
  }

  setupEventListeners() {
    if (!this.shadowRoot) {
      console.error('ResponsiveNavigation: Shadow root not available');
      return;
    }

    // Mobile menu toggle
    const mobileToggle = this.shadowRoot.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
    }

    // More dropdown toggle
    const moreToggle = this.shadowRoot.querySelector('.nav-more-toggle');
    if (moreToggle) {
      moreToggle.addEventListener('click', () => this.toggleMoreDropdown());
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.siteHeader.contains(e.target)) {
        this.closeDropdowns();
      }
    });

    // Handle resize
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.handleResize(), 150);
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDropdowns();
      }
    });

    console.log('ResponsiveNavigation: Event listeners attached');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    
    const header = this.shadowRoot.querySelector('.header');
    const mobileToggle = this.shadowRoot.querySelector('.mobile-menu-toggle');
    
    if (header && mobileToggle) {
      header.classList.toggle('mobile-menu-open', this.mobileMenuOpen);
      mobileToggle.setAttribute('aria-expanded', this.mobileMenuOpen.toString());
    }

    console.log('ResponsiveNavigation: Mobile menu toggled:', this.mobileMenuOpen);
  }

  toggleMoreDropdown() {
    this.moreDropdownOpen = !this.moreDropdownOpen;
    
    const moreToggle = this.shadowRoot.querySelector('.nav-more-toggle');
    const moreDropdown = this.shadowRoot.querySelector('.nav-more-dropdown');
    
    if (moreToggle && moreDropdown) {
      moreToggle.setAttribute('aria-expanded', this.moreDropdownOpen.toString());
      moreDropdown.classList.toggle('open', this.moreDropdownOpen);
    }

    console.log('ResponsiveNavigation: More dropdown toggled:', this.moreDropdownOpen);
  }

  closeDropdowns() {
    let changed = false;
    
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
      const header = this.shadowRoot.querySelector('.header');
      const mobileToggle = this.shadowRoot.querySelector('.mobile-menu-toggle');
      
      if (header && mobileToggle) {
        header.classList.remove('mobile-menu-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        changed = true;
      }
    }

    if (this.moreDropdownOpen) {
      this.moreDropdownOpen = false;
      const moreToggle = this.shadowRoot.querySelector('.nav-more-toggle');
      const moreDropdown = this.shadowRoot.querySelector('.nav-more-dropdown');
      
      if (moreToggle && moreDropdown) {
        moreToggle.setAttribute('aria-expanded', 'false');
        moreDropdown.classList.remove('open');
        changed = true;
      }
    }

    if (changed) {
      console.log('ResponsiveNavigation: Dropdowns closed');
    }
  }

  handleResize() {
    if (!this.shadowRoot) return;

    // Close mobile menu if we're on desktop
    if (window.innerWidth >= 1024 && this.mobileMenuOpen) {
      this.closeDropdowns();
    }

    // Handle navigation overflow for "More" dropdown
    this.handleNavigationOverflow();

    console.log('ResponsiveNavigation: Resize handled, width:', window.innerWidth);
  }

  handleNavigationOverflow() {
    const nav = this.shadowRoot.querySelector('nav');
    const navItems = this.shadowRoot.querySelectorAll('nav > a[data-priority]');
    const moreButton = this.shadowRoot.querySelector('.nav-more');
    const moreDropdown = this.shadowRoot.querySelector('.nav-more-dropdown');
    
    if (!nav || !moreButton || !moreDropdown) return;

    // Reset all items to nav first and make them visible
    navItems.forEach(item => {
      if (item.parentElement !== nav) {
        nav.insertBefore(item, moreButton);
      }
      item.style.display = '';
    });

    // Hide more button initially
    moreButton.style.display = 'none';
    moreDropdown.innerHTML = '';

    // Force a reflow to get accurate measurements
    nav.offsetHeight;

    // Get the header container width
    const header = this.shadowRoot.querySelector('.header');
    const headerRect = header.getBoundingClientRect();
    const langSwitcher = this.shadowRoot.querySelector('.lang');
    const langRect = langSwitcher?.getBoundingClientRect();
    const logo = this.shadowRoot.querySelector('.logo-link');
    const logoRect = logo?.getBoundingClientRect();
    
    if (!langRect || !logoRect) return;

    // Calculate available space more accurately
    const usedSpace = logoRect.width + langRect.width + 40; // 40px for margins
    const availableNavWidth = headerRect.width - usedSpace - 120; // 120px buffer for "More" button
    
    // Get actual widths of navigation items
    let navItemsWidth = 0;
    const itemWidths = [];
    
    navItems.forEach(item => {
      const itemRect = item.getBoundingClientRect();
      const itemWidth = itemRect.width + 16; // 16px for margins between items
      itemWidths.push({ item, width: itemWidth });
      navItemsWidth += itemWidth;
    });

    console.log('Navigation overflow check:', {
      headerWidth: headerRect.width,
      availableNavWidth,
      navItemsWidth,
      needsCollapse: navItemsWidth > availableNavWidth
    });

    // Only collapse if navigation items actually overflow
    if (navItemsWidth > availableNavWidth) {
      moreButton.style.display = 'flex';
      
      // Sort items by priority for collapsing (tertiary first, then secondary)
      const sortedItems = [...itemWidths].sort((a, b) => {
        const priorities = { 'tertiary': 3, 'secondary': 2, 'primary': 1 };
        const aPriority = priorities[a.item.getAttribute('data-priority')] || 1;
        const bPriority = priorities[b.item.getAttribute('data-priority')] || 1;
        return bPriority - aPriority;
      });

      // Collapse items until we fit
      let currentWidth = navItemsWidth;
      const moreButtonWidth = 80; // Approximate width of "More" button
      
      for (const { item, width } of sortedItems) {
        if (currentWidth + moreButtonWidth <= availableNavWidth) {
          break; // We fit now
        }
        
        // Move this item to dropdown
        const clonedItem = item.cloneNode(true);
        moreDropdown.appendChild(clonedItem);
        item.style.display = 'none';
        currentWidth -= width;
        
        console.log('Moved item to dropdown:', item.getAttribute('data-nav-item'), 'remaining width:', currentWidth);
      }
    }
  }
}

// Initialize the responsive navigation
new ResponsiveNavigation();

console.log('ResponsiveNavigation: Script loaded');