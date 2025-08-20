/**
 * Landing Page Navigation Controller
 * Handles the transition between landing page and full page using View Transitions
 * Progressive enhancement: links work normally, enhanced with View Transitions when supported
 */

class LandingPageController {
  constructor() {
    this.landingPageSection = document.querySelector('.landing_page');
    this.ctaButton = document.querySelector('.btn-cta');
    this.backButton = document.querySelector('.btn-back');
    this.isFullPage = false;
    
    // Check for View Transition API support
    this.supportsViewTransitions = 'startViewTransition' in document;
    
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.init();
  }

  init() {
    if (!this.landingPageSection) return;
    
    // Determine current page
    this.isFullPage = window.location.pathname.includes('landing_page_full');
    
    // Enhance CTA button with View Transitions if on landing page
    if (this.ctaButton && !this.isFullPage) {
      this.ctaButton.addEventListener('click', this.handleCTAClick.bind(this));
    }
    
    // Enhance back button with View Transitions if on full page
    if (this.backButton && this.isFullPage) {
      this.backButton.addEventListener('click', this.handleBackClick.bind(this));
    }
    
    // Listen for escape key to go back to landing page
    if (this.isFullPage) {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  handleCTAClick(event) {
    // Only enhance with View Transitions if supported and motion allowed
    if (this.supportsViewTransitions && !this.prefersReducedMotion) {
      event.preventDefault();
      this.navigateToFullPage();
    }
    // Otherwise, let the regular link navigation happen
  }

  handleBackClick(event) {
    // Only enhance with View Transitions if supported and motion allowed
    if (this.supportsViewTransitions && !this.prefersReducedMotion) {
      event.preventDefault();
      this.navigateToLandingPage();
    }
    // Otherwise, let the regular link navigation happen
  }

  handleKeyDown(event) {
    // Go back to landing page on Escape key when on full page
    if (event.key === 'Escape' && this.isFullPage) {
      this.navigateToLandingPage();
    }
  }

  navigateToFullPage() {
    const navigation = () => {
      window.location.href = '/landing_page_full';
    };

    document.startViewTransition(navigation);
  }

  navigateToLandingPage() {
    const navigation = () => {
      window.location.href = '/landing_page';
    };

    document.startViewTransition(navigation);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LandingPageController();
  });
} else {
  new LandingPageController();
}
