/**
 * Landing Page Navigation Controller
 * Handles the transition between landing page and full page using View Transitions
 * Progressive enhancement: links work normally, enhanced with View Transitions when supported
 */

class LandingPageController {
  constructor() {
    // Get the shadow root
    const indexContent = document.querySelector('index-content');
    this.shadowRoot = indexContent && indexContent.shadowRoot;
    
    // Check if we have access to the shadow root
    if (!this.shadowRoot) {
      console.error('Could not access shadow root');
      return;
    }
    
    this.landingPageSection = this.shadowRoot.querySelector(".landing_page");
    this.ctaButton = this.shadowRoot.querySelector(".btn-cta");
    this.backButton = this.shadowRoot.querySelector(".btn-back");
    this.isFullPage = false;

    // Check for View Transition API support
    this.supportsViewTransitions = "startViewTransition" in document;

    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Scroll navigation elements
    this.scrollUpBtn = null;
    this.scrollDownBtn = null;
    this.scrollMarkers = [];
    this.currentStep = 1;

    this.init();
  }

  init() {
    if (!this.landingPageSection) return;

    // Determine current page
    this.isFullPage = window.location.pathname.includes(
      "landing_page_interactive",
    );

    // Enhance CTA button with View Transitions if on landing page
    if (this.ctaButton && !this.isFullPage) {
      this.ctaButton.addEventListener("click", this.handleCTAClick.bind(this));
    }

    // Enhance back button with View Transitions if on full page
    if (this.backButton && this.isFullPage) {
      this.backButton.addEventListener(
        "click",
        this.handleBackClick.bind(this),
      );
    }

    // Listen for escape key to go back to landing page
    if (this.isFullPage) {
      document.addEventListener("keydown", this.handleKeyDown.bind(this));
      
      // Initialize scroll navigation
      this.initScrollNavigation();
    }
  }

  initScrollNavigation() {
    // Get scroll navigation buttons from shadow root
    this.scrollUpBtn = this.shadowRoot.getElementById("scroll-up-btn");
    this.scrollDownBtn = this.shadowRoot.getElementById("scroll-down-btn");
    
    // Get scroll markers from shadow root
    for (let i = 1; i <= 5; i++) {
      const marker = this.shadowRoot.getElementById(`scroll-marker-${i}`);
      if (marker) {
        this.scrollMarkers.push(marker);
      }
    }
    
    if (this.scrollUpBtn && this.scrollDownBtn && this.scrollMarkers.length > 0) {
      // Add event listeners
      this.scrollUpBtn.addEventListener("click", () => this.scrollToStep(this.currentStep - 1));
      this.scrollDownBtn.addEventListener("click", () => this.scrollToStep(this.currentStep + 1));
      
      // Update button states on scroll
      window.addEventListener("scroll", () => this.updateScrollButtons());
      
      // Initial update
      this.updateScrollButtons();
    }
  }

  getCurrentStep() {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // Find the closest step
    let closestStep = 1;
    let minDistance = Math.abs(scrollPosition - 0);
    
    for (let i = 0; i < this.scrollMarkers.length; i++) {
      const markerPosition = this.scrollMarkers[i].offsetTop;
      const distance = Math.abs(scrollPosition - markerPosition);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestStep = i + 1;
      }
    }
    
    return closestStep;
  }

  updateScrollButtons() {
    this.currentStep = this.getCurrentStep();
    
    // Disable/enable buttons based on current step
    if (this.scrollUpBtn) {
      this.scrollUpBtn.disabled = this.currentStep === 1;
    }
    
    if (this.scrollDownBtn) {
      this.scrollDownBtn.disabled = this.currentStep === this.scrollMarkers.length;
    }
  }

  scrollToStep(step) {
    // Validate step
    if (step < 1 || step > this.scrollMarkers.length) {
      return;
    }
    
    // Get target position
    const targetMarker = this.scrollMarkers[step - 1];
    if (!targetMarker) {
      return;
    }
    
    // Scroll to position
    const targetPosition = targetMarker.offsetTop;
    
    // Use smooth scrolling
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth"
    });
    
    // Update current step
    this.currentStep = step;
    
    // Update button states
    this.updateScrollButtons();
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
    if (event.key === "Escape" && this.isFullPage) {
      this.navigateToLandingPage();
    }
  }

  navigateToFullPage() {
    const navigation = () => {
      window.location.href = "/landing_page_interactive";
    };

    document.startViewTransition(navigation);
  }

  navigateToLandingPage() {
    const navigation = () => {
      window.location.href = "/landing_page";
    };

    document.startViewTransition(navigation);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new LandingPageController();
  });
} else {
  new LandingPageController();
}
