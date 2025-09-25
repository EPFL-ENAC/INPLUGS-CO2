/**
 * Simplified scroll-based info box controller for what_is_gcs page
 * Implements section-based navigation with independent SVG positioning
 */

class WhatIsGCSController {
  constructor() {
    this.sections = [];
    this.infoBoxes = [];
    this.minimapMarkers = [];
    this.currentStep = 1;
    this.totalSteps = 5;

    // SVG positions from bottom (in pixels)
    this.svgPositions = [
      0.04 * 4287, // 172,  // Box 1: 4% from top (0.04 * 4287)
      0.38 * 4287, // 1630, // Box 2: 38% from top (0.38 * 4287)
      0.72 * 4287, // 3086, // Box 3: 72% from top (0.72 * 4287)
      0.67 * 4287, // 2879, // Box 4: 67% from top (0.67 * 4287)
      0.58 * 4287, // 2486, // Box 5: 58% from top (0.58 * 4287)
    ];

    this.init();
  }

  init() {
    // Get all sections with data-step attribute
    this.sections = document.querySelectorAll(".step-section");

    // Get all info boxes
    for (let i = 1; i <= 5; i++) {
      const infoBox = document.getElementById(`info-box-${i}`);
      if (infoBox) {
        this.infoBoxes.push(infoBox);
      }
    }

    // Get minimap markers
    for (let i = 1; i <= 5; i++) {
      const marker = document.getElementById(`scroll-minimap-marker-${i}`);
      if (marker) {
        this.minimapMarkers.push(marker);

        // Add click event to minimap markers
        marker.addEventListener("click", () => {
          this.goToStep(i);
        });
      }
    }

    // Get navigation buttons
    this.prevButton = document.getElementById("scroll-up-btn");
    this.nextButton = document.getElementById("scroll-down-btn");

    if (this.prevButton) {
      this.prevButton.addEventListener("click", () => {
        this.goToStep(this.currentStep - 1);
      });
    }

    if (this.nextButton) {
      this.nextButton.addEventListener("click", () => {
        this.goToStep(this.currentStep + 1);
      });
    }

    // Add keyboard event listeners
    document.addEventListener("keydown", this.handleKeyDown.bind(this));

    // Add scroll event listener for parallax effect
    window.addEventListener("scroll", this.onScroll.bind(this));

    // Initial update
    this.updateUI();
  }

  handleKeyDown(event) {
    // Scroll to next step on Space key
    if (event.key === " ") {
      event.preventDefault(); // Prevent default space behavior (scrolling)
      if (event.shiftKey) {
        this.goToStep(this.currentStep - 1); // Previous step with Shift+Space
      } else {
        this.goToStep(this.currentStep + 1); // Next step with Space
      }
    }
    // Scroll to next step on Right Arrow
    else if (event.key === "ArrowRight") {
      event.preventDefault();
      this.goToStep(this.currentStep + 1);
    }
    // Scroll to previous step on Left Arrow
    else if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.goToStep(this.currentStep - 1);
    }
  }

  goToStep(step) {
    // Validate step
    if (step < 1 || step > this.totalSteps) {
      return;
    }

    // Store the target step
    this.targetStep = step;

    // Calculate target scroll position (each section is 100vh)
    const targetPosition = (step - 1) * window.innerHeight;

    // Scroll to position
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });

    // Update SVG position immediately using target step
    this.updateSvgPosition(step);

    // Use a more sophisticated approach to handle UI updates
    // Wait for scroll to complete or timeout after 600ms
    this.waitForScrollCompletion(targetPosition, () => {
      // Ensure we're still on the target step before updating UI
      if (this.currentStep === this.targetStep) {
        this.updateUI();
      }
    });
  }

  onScroll() {
    // Calculate current step based on scroll position
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const newStep = Math.floor(scrollPosition / windowHeight) + 1;

    // Clamp step between 1 and totalSteps
    const clampedStep = Math.max(1, Math.min(this.totalSteps, newStep));

    if (clampedStep !== this.currentStep) {
      this.currentStep = clampedStep;
      this.updateSvgPosition();
      // Update UI immediately for scroll events
      this.updateUI();
    }
  }

  updateSvgPosition(step = null) {
    // Update SVG position based on specified step or current step
    const targetStep = step || this.currentStep;
    const background = document.querySelector(".landing_page__visual");
    if (background) {
      // Get target position for the specified step
      const targetPosition = this.svgPositions[targetStep - 1];

      // Apply smooth transition
      background.style.transition = "transform 0.6s ease-out";
      background.style.transform = `translateY(-${targetPosition}px)`;
    }
  }

  updateUI() {
    // Update info box visibility
    this.infoBoxes.forEach((infoBox, index) => {
      if (index + 1 === this.currentStep) {
        infoBox.classList.add("active");
      } else {
        infoBox.classList.remove("active");
      }
    });

    // Update navigation buttons
    if (this.prevButton) {
      this.prevButton.disabled = this.currentStep === 1;
    }

    if (this.nextButton) {
      this.nextButton.disabled = this.currentStep === this.totalSteps;
    }

    // Update minimap markers
    this.minimapMarkers.forEach((marker, index) => {
      if (index + 1 === this.currentStep) {
        marker.classList.add("minimap-border");
      } else {
        marker.classList.remove("minimap-border");
      }
    });
  }

  /**
   * Waits for scroll completion or times out after 600ms
   * @param {number} targetPosition - The target scroll position
   * @param {Function} callback - Function to call when scroll is complete
   */
  waitForScrollCompletion(targetPosition, callback) {
    let scrollTimeout;
    let lastPosition = window.scrollY;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50; // Prevent infinite loops

    const checkScroll = () => {
      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Check if we've reached the target position or if scrolling has stopped
      const currentPosition = window.scrollY;
      const distanceToTarget = Math.abs(currentPosition - targetPosition);

      // If we're close enough to the target or if scrolling has stopped, update UI
      if (
        distanceToTarget < 2 ||
        (currentPosition === lastPosition && scrollAttempts > 2)
      ) {
        this.currentStep = this.targetStep;
        callback();
        return;
      }

      // Continue checking if we haven't exceeded max attempts
      if (scrollAttempts < maxScrollAttempts) {
        lastPosition = currentPosition;
        scrollAttempts++;
        scrollTimeout = setTimeout(checkScroll, 20); // Check every 20ms
      } else {
        // Timeout - update UI anyway
        this.currentStep = this.targetStep;
        callback();
      }
    };

    // Start checking after a brief delay to allow scroll to initiate
    scrollTimeout = setTimeout(checkScroll, 20);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new WhatIsGCSController();
  });
} else {
  new WhatIsGCSController();
}
