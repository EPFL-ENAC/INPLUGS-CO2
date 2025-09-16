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




    this.svg = this.shadowRoot.querySelector("#inplugs-svg");
    this.steps = [
      this.shadowRoot.querySelector("#landing_svg_step1_animate"),
      this.shadowRoot.querySelector("#landing_svg_step2_animate"),
      this.shadowRoot.querySelector("#landing_svg_step3_animate"),
      this.shadowRoot.querySelector("#landing_svg_step4_animate"),
      this.shadowRoot.querySelector("#landing_svg_step5_animate"),
    ];

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
    this.infoBoxes = [];

    // Touch swipe variables
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.swipeThreshold = 20; // Minimum swipe distance in pixels

    // Throttling variables for scroll updates
    this.ticking = false;
    this.lastStep = -1;

    // Debounce timer for minimap updates
    this.minimapUpdateTimer = null;
    /* we could optimize via other strategies

    1. Throttle the scroll event handler using requestAnimationFrame
    2. Optimize the getCurrentStep method to reduce computational overhead
    3. Track the last calculated step to prevent unnecessary updates
    4. Improve marker updates to minimize DOM manipulations
    */
    this.minimapDebounceDelay = 20; // milliseconds

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

      // Scroll to the first marker (4% position) on page load
      this.scrollToFirstMarkerOnLoad();

      // Add touch event listeners for mobile swipe navigation
      document.addEventListener("touchstart", this.handleTouchStart.bind(this));
      document.addEventListener("touchmove", this.handleTouchMove.bind(this));
      document.addEventListener("touchend", this.handleTouchEnd.bind(this));
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

        marker.addEventListener("click", () => {
          this.scrollToStep(i);
        });
      }
    }

    if (
      this.scrollUpBtn &&
      this.scrollDownBtn &&
      this.scrollMarkers.length > 0
    ) {
      // Get info boxes from shadow root
      for (let i = 1; i <= 5; i++) {
        const infoBox = this.shadowRoot.getElementById(`info-box-${i}`);
        if (infoBox) {
          this.infoBoxes.push(infoBox);
        }
      }

      // Add event listeners
      this.scrollUpBtn.addEventListener("click", () =>
        this.scrollToStep(this.currentStep - 1),
      );
      this.scrollDownBtn.addEventListener("click", () =>
        this.scrollToStep(this.currentStep + 1),
      );

      // Update minimap markers on scroll (don't update navigation step)
      window.addEventListener("scroll", () => {
        this.onScroll();
      });

      // Initial update
      this.updateScrollButtons();
      this.updateMinimapMarkers();

      // Use double requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.updateInfoBoxVisibility();
        });
      });
    }
  }

  removeEventListeners() {
    // Remove all event listeners to prevent memory leaks
    if (this.ctaButton) {
      this.ctaButton.removeEventListener("click", this.handleCTAClick);
    }
    if (this.backButton) {
      this.backButton.removeEventListener("click", this.handleBackClick);
    }
    document.removeEventListener("keydown", this.handleKeyDown);
    if (this.scrollUpBtn) {
      this.scrollUpBtn.removeEventListener("click", this.scrollToStep);
    }
    if (this.scrollDownBtn) {
      this.scrollDownBtn.removeEventListener("click", this.scrollToStep);
    }
    window.removeEventListener("scroll", this.onScroll);
    document.removeEventListener("touchstart", this.handleTouchStart);
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);
    this.minimapMarkers.forEach((marker, index) => {
      marker.removeEventListener("click", () => {
        this.scrollToStep(index + 1);
      });
    });
  }

  // call removeEventListeners when navigating away
  // window.addEventListener("beforeunload", this.removeEventListeners.bind(this));
  getCurrentStep() {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const viewportCenter = scrollPosition + windowHeight / 2;

    // Find the step that is most visible based on a scoring system
    // Now focusing only on info boxes instead of trying to correlate with scroll markers
    let bestScore = -Infinity;
    let bestStep = 1;

    // Loop through info boxes directly instead of scroll markers
    for (let i = 0; i < this.infoBoxes.length; i++) {
      const infoBox = this.infoBoxes[i];

      // Calculate visibility metrics for the info box
      let visibilityRatio = 0;
      let centerDistance = 0;
      let elementTop = 0;
      let elementBottom = 0;

      if (infoBox) {
        // For info boxes, calculate how much is visible in viewport
        const rect = infoBox.getBoundingClientRect();
        elementTop = rect.top + scrollPosition;
        elementBottom = rect.bottom + scrollPosition;

        // Calculate intersection with viewport
        const visibleTop = Math.max(scrollPosition, elementTop);
        const visibleBottom = Math.min(
          scrollPosition + windowHeight,
          elementBottom,
        );
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const elementHeight = elementBottom - elementTop;

        visibilityRatio = elementHeight > 0 ? visibleHeight / elementHeight : 0;

        // Distance from element center to viewport center
        const elementCenter = (elementTop + elementBottom) / 2;
        centerDistance = Math.abs(viewportCenter - elementCenter);
      }

      // Calculate score (higher is better)
      // Prefer elements that are more visible and closer to center
      // Enhanced scoring: heavily prioritize fully visible elements
      let score = 0;
      const centerScore = 1 / (1 + centerDistance / 1000);

      if (visibilityRatio >= 0.95) {
        // If almost fully visible, prioritize center proximity heavily (90% center, 10% visibility)
        score = visibilityRatio * 0.1 + centerScore * 0.9;
      } else if (visibilityRatio >= 0.5) {
        // If moderately visible, balance visibility and center proximity (60% visibility, 40% center)
        score = visibilityRatio * 0.6 + centerScore * 0.4;
      } else {
        // If barely visible, prioritize visibility heavily (80% visibility, 20% center)
        score = visibilityRatio * 0.8 + centerScore * 0.2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestStep = i + 1; // Step number corresponds to info box index + 1
      }
    }

    return bestStep;
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
    // Clear existing timer
    if (this.minimapUpdateTimer) {
      clearTimeout(this.minimapUpdateTimer);
    }

    // Set new timer
    this.minimapUpdateTimer = setTimeout(() => {
      // Get current step based on scroll position (visually closest)
      const visuallyClosestStep = this.getCurrentStep();

      // Update currentStep to match the visually closest step
      this.currentStep = visuallyClosestStep;

      // Only update if the step has changed
      if (visuallyClosestStep === this.lastStep) {
        return;
      }

      // Update the last step
      this.lastStep = visuallyClosestStep;

      // Update minimap markers to highlight the visually closest step
      this.minimapMarkers.forEach((marker, index) => {
        if (index + 1 === visuallyClosestStep) {
          marker.classList.add("minimap-border");
        } else {
          marker.classList.remove("minimap-border");
        }
      });
    }, this.minimapDebounceDelay);
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
    // SCROLL BEHAVIOR "instant" TO AVOID INTERFERING WITH VIEW TRANSITIONS
    // SCROLL BEHAVIOR "smooth" CAUSES JANK WITH VIEW TRANSITIONS
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });

    // Update current step
    this.currentStep = step;

    // Update UI elements after a short delay to allow scroll to complete
    // This ensures the UI is updated based on the actual scroll position
    setTimeout(() => {
      this.updateUIElements();
    }, 300); // Slightly longer than typical scroll duration
  }

  scrollToFirstMarkerOnLoad() {
    // Small delay to ensure everything is rendered
    setTimeout(() => {
      this.scrollToStep(1);
    }, 100);
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
    // Scroll to next step on Space key or Right Arrow
    else if (
      (event.key === " " && !event.shiftKey) ||
      event.key === "ArrowRight"
    ) {
      event.preventDefault(); // Prevent default space behavior (scrolling)
      this.scrollToStep(this.currentStep + 1);
    }
    // Scroll to previous step on Shift+Space or Left Arrow
    else if (
      (event.key === " " && event.shiftKey) ||
      event.key === "ArrowLeft"
    ) {
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

  handleTouchStart(event) {
    // Only handle touch events on the interactive landing page
    if (!this.isFullPage) return;

    // Store the initial touch position
    this.touchStartX = event.changedTouches[0].screenX;
  }

  handleTouchMove(event) {
    // Only handle touch events on the interactive landing page
    if (!this.isFullPage) return;

    // Prevent scrolling during swipe gesture
    event.preventDefault();
  }

  handleTouchEnd(event) {
    // Only handle touch events on the interactive landing page
    if (!this.isFullPage) return;

    // Store the final touch position
    this.touchEndX = event.changedTouches[0].screenX;

    // Calculate the swipe distance
    const swipeDistance = this.touchStartX - this.touchEndX;

    // Check if swipe distance exceeds threshold
    if (Math.abs(swipeDistance) > this.swipeThreshold) {
      // Swipe right - go to previous step
      if (swipeDistance < 0) {
        this.scrollToStep(this.currentStep - 1);
      }
      // Swipe left - go to next step
      else {
        this.scrollToStep(this.currentStep + 1);
      }
    }
  }

  /**
   * Throttled scroll handler using requestAnimationFrame
   */
  onScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateUIElements();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }


  resetSteps() {
    this.steps.forEach((s) => {
      if (s === null) return;
      // For <animateTransform> set repeatCount=0
      if (s.tagName === "animateTransform") s.setAttribute("repeatCount", "0");
      // For <g> (step3) hide it
      if (s.tagName === "g") s.setAttribute("visibility", "hidden");
    });
}
    showAnimateStep(step) {
      this.svg.pauseAnimations();
      this.svg.setCurrentTime(0);
      this.resetSteps();
      const s = this.steps[step - 1];
      if (s === null) return;
      if (s.tagName === "animateTransform") {
        s.setAttribute("repeatCount", "indefinite");
        s.beginElement();
      } else if (s.tagName === "g") {
        if (step === 2) {
        }
        s.setAttribute("visibility", "visible");
        // Arrows already repeat indefinitely
      }

      this.svg.unpauseAnimations();
  }
  /**
   * Unified method to update all UI elements based on current scroll position
   */
  updateUIElements() {
    // Recalculate current step based on actual scroll position
    this.currentStep = this.getCurrentStep();

    // Update all UI elements
    this.updateInfoBoxVisibility();
    this.updateScrollButtons();
    this.updateMinimapMarkers();
    this.showAnimateStep(this.currentStep);

    
  }

  /**
   * Update info box visibility based on current step
   */
  updateInfoBoxVisibility() {
    // Check if infoBoxes are initialized
    if (!this.infoBoxes || this.infoBoxes.length === 0) {
      return;
    }

    // Update all info boxes
    this.infoBoxes.forEach((infoBox, index) => {
      if (index + 1 === this.currentStep) {
        infoBox.classList.add("visible");
      } else {
        infoBox.classList.remove("visible");
      }
    });
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
