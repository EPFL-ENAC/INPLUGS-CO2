/**
 * Landing Page Navigation Controller
 * Handles the transition between landing page and full page using View Transitions
 * Progressive enhancement: links work normally, enhanced with View Transitions when supported
 */

class LandingPageController {
  constructor() {
    // Get the shadow root
    const indexContent = document.querySelector("index-content");
    this.shadowRoot = indexContent && indexContent.shadowRoot;

    // Check if we have access to the shadow root
    if (!this.shadowRoot) {
      console.error("Could not access shadow root");
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

    // Get minimap markers from shadow root
    this.minimapMarkers = [];
    for (let i = 1; i <= 5; i++) {
      const marker = this.shadowRoot.getElementById(
        `scroll-minimap-marker-${i}`,
      );
      if (marker) {
        this.minimapMarkers.push(marker);
      }
    }

    if (
      this.scrollUpBtn &&
      this.scrollDownBtn &&
      this.scrollMarkers.length > 0
    ) {
      // Add event listeners
      this.scrollUpBtn.addEventListener("click", () =>
        this.scrollToStep(this.currentStep - 1),
      );
      this.scrollDownBtn.addEventListener("click", () =>
        this.scrollToStep(this.currentStep + 1),
      );

      // Update minimap markers on scroll (don't update navigation step)
      window.addEventListener("scroll", () => {
        this.updateMinimapMarkers();
      });

      // Initial update
      this.updateScrollButtons();
      this.updateMinimapMarkers();
    }
  }

  getCurrentStep() {
    const scrollPosition = window.scrollY;

    // Find the closest step based on visual positioning
    let closestStep = 1;
    let minDistance = Math.abs(
      scrollPosition - this.scrollMarkers[0].offsetTop,
    );

    for (let i = 1; i < this.scrollMarkers.length; i++) {
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
    // Disable/enable buttons based on current step
    // We use the stored currentStep for navigation, not the visually detected step
    if (this.scrollUpBtn) {
      this.scrollUpBtn.disabled = this.currentStep === 1;
    }

    if (this.scrollDownBtn) {
      this.scrollDownBtn.disabled =
        this.currentStep === this.scrollMarkers.length;
    }
  }

  updateMinimapMarkers() {
    // Get current step based on scroll position (visually closest)
    const visuallyClosestStep = this.getCurrentStep();

    // Update minimap markers to highlight the visually closest step
    this.minimapMarkers.forEach((marker, index) => {
      if (index + 1 === visuallyClosestStep) {
        marker.classList.add("minimap-border");
      } else {
        marker.classList.remove("minimap-border");
      }
    });
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
      behavior: "smooth",
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
    // Only handle keys on the interactive landing page
    if (!this.isFullPage) return;

    // Go back to landing page on Escape key
    if (event.key === "Escape") {
      this.navigateToLandingPage();
    }
    // Scroll to next step on Space key
    else if (event.key === " " && !event.shiftKey) {
      event.preventDefault(); // Prevent default space behavior (scrolling)
      this.scrollToStep(this.currentStep + 1);
    }
    // Scroll to previous step on Shift+Space
    else if (event.key === " " && event.shiftKey) {
      event.preventDefault(); // Prevent default space behavior (scrolling)
      this.scrollToStep(this.currentStep - 1);
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
