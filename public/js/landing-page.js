/**
 * Landing Page State Toggle
 * Handles the transition between hero state and explore state
 */

class LandingPageController {
  constructor() {
    this.heroSection = document.querySelector('.landing_page');
    this.ctaButton = document.querySelector('.btn-cta');
    this.closeButton = null;
    this.isState2 = false;
    
    // Check for View Transition API support
    this.supportsViewTransitions = 'startViewTransition' in document;
    
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.init();
  }

  init() {
    if (!this.heroSection || !this.ctaButton) return;
    
    // Bind event listeners
    this.ctaButton.addEventListener('click', this.handleCTAClick.bind(this));
    
    // Listen for escape key to close state 2
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Create close button for state 2 (initially hidden)
    this.createCloseButton();
  }

  createCloseButton() {
    this.closeButton = document.createElement('button');
    this.closeButton.className = 'btn-close';
    this.closeButton.textContent = '✕ Close';
    this.closeButton.setAttribute('aria-label', 'Close and return to welcome');
    this.closeButton.style.display = 'none';
    
    this.closeButton.addEventListener('click', this.handleCloseClick.bind(this));
    
    // Insert close button into the hero section
    this.heroSection.appendChild(this.closeButton);
  }

  handleCTAClick(event) {
    event.preventDefault();
    this.transitionToState2();
  }

  handleCloseClick(event) {
    event.preventDefault();
    this.transitionToState1();
  }

  handleKeyDown(event) {
    // Close state 2 on Escape key
    if (event.key === 'Escape' && this.isState2) {
      this.transitionToState1();
    }
  }

  transitionToState2() {
    if (this.isState2) return;
    
    const transition = () => {
      this.heroSection.classList.add('is-state2');
      this.isState2 = true;
      
      // Show close button and manage focus
      setTimeout(() => {
        this.closeButton.style.display = 'block';
        this.closeButton.focus();
      }, 300); // After transition starts
    };

    // Use View Transition API if supported and motion is allowed
    if (this.supportsViewTransitions && !this.prefersReducedMotion) {
      document.startViewTransition(transition);
    } else {
      transition();
    }
  }

  transitionToState1() {
    if (!this.isState2) return;
    
    const transition = () => {
      this.heroSection.classList.remove('is-state2');
      this.isState2 = false;
      
      // Hide close button and restore focus to CTA
      this.closeButton.style.display = 'none';
      setTimeout(() => {
        this.ctaButton.focus();
      }, 300); // After transition completes
    };

    // Use View Transition API if supported and motion is allowed
    if (this.supportsViewTransitions && !this.prefersReducedMotion) {
      document.startViewTransition(transition);
    } else {
      transition();
    }
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
