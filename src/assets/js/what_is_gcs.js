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
    this.isScrolling = false;
    this.scrollMomentum = 0;

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

    // Add scroll event listener for parallax effect and momentum tracking
    window.addEventListener("scroll", this.onScroll.bind(this));

    // Track scroll momentum for better feedback\n    this.setupScrollMomentumTracking();\n\n    // Create progress indicator\n    this.createProgressIndicator();\n\n    // Initial update\n    this.updateUI();\n    this.updateProgressIndicator();
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

  setupScrollMomentumTracking() {
    let lastScrollTime = Date.now();
    let lastScrollY = window.scrollY;

    const trackMomentum = () => {
      const now = Date.now();
      const currentScrollY = window.scrollY;
      const timeDelta = now - lastScrollTime;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);

      if (timeDelta > 0) {
        this.scrollMomentum = scrollDelta / timeDelta;
      }

      lastScrollTime = now;
      lastScrollY = currentScrollY;

      requestAnimationFrame(trackMomentum);
    };

    requestAnimationFrame(trackMomentum);
  }

  createProgressIndicator() {
    // Create a progress bar for user feedback
    const progressContainer = document.createElement("div");
    progressContainer.className = "scroll-progress-container";
    progressContainer.innerHTML = `
      <div class="scroll-progress-bar">
        <div class="scroll-progress-fill"></div>
      </div>
      <div class="scroll-step-indicator">
        <span class="current-step">${this.currentStep}</span>
        <span class="step-separator">/</span>
        <span class="total-steps">${this.totalSteps}</span>
      </div>
    `;

    document.body.appendChild(progressContainer);

    this.progressContainer = progressContainer;
    this.progressFill = progressContainer.querySelector(
      ".scroll-progress-fill",
    );
    this.currentStepElement = progressContainer.querySelector(".current-step");
  }

  updateProgressIndicator() {
    if (this.progressFill && this.currentStepElement) {
      const progress = (this.currentStep / this.totalSteps) * 100;
      this.progressFill.style.width = `${progress}%`;
      this.currentStepElement.textContent = this.currentStep;
    }
  }

  goToStep(step) {
    // Validate step
    if (step < 1 || step > this.totalSteps) {
      return;
    }

    // Prevent multiple simultaneous transitions
    if (this.isScrolling) {
      return;
    }

    this.isScrolling = true;

    // Store the target step
    this.targetStep = step;

    // Add visual feedback
    if (this.progressContainer) {
      this.progressContainer.classList.add("scrolling");
    }

    // Add haptic feedback on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Calculate target scroll position (each section is 100vh)
    const targetPosition = (step - 1) * window.innerHeight;

    // Scroll to position
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });

    // Update SVG position immediately using target step
    this.updateSvgPosition(step);

    // Update progress indicator immediately
    this.currentStep = step;
    this.updateProgressIndicator();
    this.updateUI();

    // Add step transition effect to info boxes
    this.addStepTransitionEffect(step);

    // Wait for scroll completion with faster timeout
    this.waitForScrollCompletion(targetPosition, () => {
      this.isScrolling = false;
      if (this.progressContainer) {
        this.progressContainer.classList.remove("scrolling");
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
      this.updateUI();
      this.updateProgressIndicator();

      // Add momentum-based feedback
      this.addScrollMomentumFeedback();
    }
  }

  updateSvgPosition(step = null) {
    // Update SVG position based on specified step or current step
    const targetStep = step || this.currentStep;
    const background = document.querySelector(".landing_page__visual");
    if (background) {
      // Get target position for the specified step
      const targetPosition = this.svgPositions[targetStep - 1];

      // Apply ultra-fast transition (80ms)
      background.style.transition =
        "transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      background.style.transform = `translateY(-${targetPosition}px)`;
    }
  }

  addStepTransitionEffect(targetStep) {
    // Add smooth transition effect to info boxes
    this.infoBoxes.forEach((infoBox, index) => {
      const stepNumber = index + 1;

      if (stepNumber === targetStep) {
        // Animate in the active box
        infoBox.style.transform = "scale(1.05)";
        setTimeout(() => {
          infoBox.style.transform = "scale(1)";
        }, 80);
      } else if (stepNumber === this.currentStep && stepNumber !== targetStep) {
        // Animate out the previous box
        infoBox.style.transform = "scale(0.95)";
        setTimeout(() => {
          infoBox.style.transform = "scale(1)";
        }, 80);
      }
    });
  }

  addScrollMomentumFeedback() {
    // Visual feedback based on scroll momentum
    const momentumClass =
      this.scrollMomentum > 2 ? "high-momentum" : "low-momentum";
    document.body.classList.add(momentumClass);

    setTimeout(() => {
      document.body.classList.remove(momentumClass);
    }, 200);
  }

  updateUI() {
    // Update info box visibility with enhanced transitions
    this.infoBoxes.forEach((infoBox, index) => {
      if (index + 1 === this.currentStep) {
        infoBox.classList.add("active");
        infoBox.style.transition =
          "all 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      } else {
        infoBox.classList.remove("active");
      }
    });

    // Update navigation buttons with enhanced feedback
    if (this.prevButton) {
      this.prevButton.disabled = this.currentStep === 1;
      this.prevButton.style.opacity = this.currentStep === 1 ? "0.3" : "1";
      this.prevButton.style.transition = "all 0.08s ease";
    }

    if (this.nextButton) {
      this.nextButton.disabled = this.currentStep === this.totalSteps;
      this.nextButton.style.opacity =
        this.currentStep === this.totalSteps ? "0.3" : "1";
      this.nextButton.style.transition = "all 0.08s ease";
    }

    // Update minimap markers with fast transitions
    this.minimapMarkers.forEach((marker, index) => {
      marker.style.transition =
        "all 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

      if (index + 1 === this.currentStep) {
        marker.classList.add("minimap-border");
        marker.style.transform = "scale(1.15)";
      } else {
        marker.classList.remove("minimap-border");
        marker.style.transform = "scale(1)";
      }
    });
  }

  /**
   * Waits for scroll completion with ultra-fast timeout (200ms)
   * @param {number} targetPosition - The target scroll position
   * @param {Function} callback - Function to call when scroll is complete
   */
  waitForScrollCompletion(targetPosition, callback) {
    let scrollTimeout;
    let lastPosition = window.scrollY;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20; // Reduced for faster response

    const checkScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      const currentPosition = window.scrollY;
      const distanceToTarget = Math.abs(currentPosition - targetPosition);

      // More aggressive completion detection for faster response
      if (
        distanceToTarget < 5 ||
        (currentPosition === lastPosition && scrollAttempts > 1)
      ) {
        callback();
        return;
      }

      if (scrollAttempts < maxScrollAttempts) {
        lastPosition = currentPosition;
        scrollAttempts++;
        scrollTimeout = setTimeout(checkScroll, 10); // Check every 10ms for faster response
      } else {
        callback();
      }
    };

    // Start checking immediately for ultra-fast response
    scrollTimeout = setTimeout(checkScroll, 5);
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
