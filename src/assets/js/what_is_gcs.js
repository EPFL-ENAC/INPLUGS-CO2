/**
 * Simple scroll-based controller for what_is_gcs page
 * Natural scroll behavior with basic SVG positioning
 */

class WhatIsGCSController {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 5;

    // SVG positions from bottom (in pixels)
    this.svgPositions = [
      // 0.00 * 4287, // Step 0: Title screen - 0% from top
      0.0 * 4287, // Step 1: Intro - 0% from top (same as step 0 initially)
      0.05 * 4287, // Step 2: Box 1 - 4% from top
      0.38 * 4287, // Step 3: Box 2 - 38% from top
      0.72 * 4287, // Step 4: Box 3 - 72% from top
      0.67 * 4287, // Step 5: Box 4 - 67% from top
      0.58 * 4287, // Step 6: Box 5 - 58% from top
    ];

    this.init();
  }

  init() {
    // Navigation buttons
    const prevButton = document.getElementById("scroll-up-btn");
    const nextButton = document.getElementById("scroll-down-btn");

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        this.goToStep(this.currentStep - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        this.goToStep(this.currentStep + 1);
      });
    }

    // Minimap markers
    for (let i = 1; i <= 5; i++) {
      const marker = document.getElementById(`scroll-minimap-marker-${i}`);
      if (marker) {
        marker.addEventListener("click", () => {
          this.goToStep(i);
        });
      }
    }

    // Add click handler for step 0 to advance to step 1
    const step0Section = document.querySelector('.step-section[data-step="0"]');
    if (step0Section) {
      step0Section.addEventListener("click", () => {
        if (this.currentStep === 0) {
          this.goToStep(1);
        }
      });
    }

    // Update body data attribute for CSS targeting
    document.body.setAttribute("data-current-step", this.currentStep);

    // Keyboard navigation
    document.addEventListener("keydown", (event) => {
      if (event.key === " ") {
        event.preventDefault();
        this.goToStep(
          event.shiftKey ? this.currentStep - 1 : this.currentStep + 1,
        );
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        this.goToStep(this.currentStep + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.goToStep(this.currentStep - 1);
      }
    });

    // Simple scroll listener
    window.addEventListener("scroll", () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      let newStep;

      if (scrollPosition < windowHeight * 0.1) {
        newStep = 0; // Stay at step 0 until significant scroll
      } else {
        // Steps 1-5 correspond to scroll sections 1-5
        newStep = Math.floor(scrollPosition / windowHeight);
        newStep = Math.max(1, newStep); // Ensure we don't go below step 1 after leaving step 0
      }

      const clampedStep = Math.max(0, Math.min(this.totalSteps, newStep));

      if (clampedStep !== this.currentStep) {
        this.currentStep = clampedStep;
        this.updateSvgPosition();
        this.updateUI();
        document.body.setAttribute("data-current-step", this.currentStep);
      }
    });

    // Run on load + resize
    this.updateSvgAspectRatio();
    window.addEventListener("resize", this.updateSvgAspectRatio);

    // Initial update
    this.updateUI();
  }

  updateSvgAspectRatio() {
    console.log("changing SVG aspect ratio!");
    const svg = document.querySelector(".landing_page__visual svg");
    if (svg) {
      if (window.innerWidth < 1930) {
        svg.setAttribute("preserveAspectRatio", "xMaxYMin slice");
      } else {
        svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
      }
    } else {
      console.warn("SVG element not found for aspect ratio update");
    }
  }

  goToStep(step) {
    // Validate step
    if (step < 0 || step > this.totalSteps) {
      return;
    }

    this.currentStep = step;
    document.body.setAttribute("data-current-step", step);

    // Calculate scroll position:
    // Step 0: scroll to top (0)
    // Step 1: scroll to 1st section (1 * windowHeight)
    // Step 2: scroll to 2nd section (2 * windowHeight)
    // etc.
    const targetPosition = step * window.innerHeight;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });

    this.updateUI();

    this.updateSvgPosition();
  }

  updateSvgPosition() {
    const background = document.querySelector(".landing_page__visual");
    if (background) {
      // Add smooth transition if not already set
      if (!background.style.transition) {
        // equivalent of easeout but easeOutQuint
        // background.style.transition = "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)";
        background.style.transition =
          "transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)";
      }

      const targetPosition = this.svgPositions[this.currentStep];
      background.style.transform = `translateY(-${targetPosition}px)`;
    }
  }

  updateUI() {
    // Update navigation buttons
    const prevButton = document.getElementById("scroll-up-btn");
    const nextButton = document.getElementById("scroll-down-btn");

    if (prevButton) {
      prevButton.disabled = this.currentStep === 0;
      prevButton.style.opacity = this.currentStep === 0 ? "0.3" : "1";
    }

    if (nextButton) {
      nextButton.disabled = this.currentStep === this.totalSteps;
      nextButton.style.opacity =
        this.currentStep === this.totalSteps ? "0.3" : "1";
    }

    // Handle minimap visibility - hide at step 0
    const minimap = document.querySelector(".minimap");
    if (minimap) {
      minimap.style.opacity = this.currentStep === 0 ? "0" : "0.8";
      minimap.style.pointerEvents = this.currentStep === 0 ? "none" : "auto";
    }

    // Update minimap markers (only for steps 1-5)
    for (let i = 1; i <= this.totalSteps; i++) {
      const marker = document.getElementById(`scroll-minimap-marker-${i}`);
      if (marker) {
        if (i === this.currentStep) {
          marker.classList.add("minimap-border");
        } else {
          marker.classList.remove("minimap-border");
        }
      }
    }

    // Handle reservoir-too-complex visibility (hidden at step 3, shown at steps 4 and 5)
    const reservoirTooComplex = document.querySelector(
      '[data-name="reservoir-too-complex"]',
    );
    const flecheReservoir = document.querySelector(
      '[data-name="flèche reservoir"]',
    );
    const co2PointsReservoirTopLine = document.querySelector(
      '[data-name="co2 points reservoir top line"]',
    );

    if (reservoirTooComplex) {
      // Add smooth transition if not already set
      if (!reservoirTooComplex.style.transition) {
        reservoirTooComplex.style.transition =
          "opacity 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)";
      }
      if (!flecheReservoir.style.transition) {
        flecheReservoir.style.transition =
          "opacity 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)";
      }
      if (!co2PointsReservoirTopLine.style.transition) {
        co2PointsReservoirTopLine.style.transition =
          "opacity 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)";
      }

      // also handle the arrow and the co2 points line the same way

      if (this.currentStep === 3) {
        // Hide at step 3
        reservoirTooComplex.style.opacity = "0";
        flecheReservoir.style.opacity = "0";
        co2PointsReservoirTopLine.style.opacity = "0";
        // Use setTimeout to delay visibility change until after opacity transition
        setTimeout(() => {
          if (this.currentStep === 3) {
            // Check step again in case it changed
            reservoirTooComplex.style.visibility = "hidden";
            flecheReservoir.style.visibility = "hidden";
            co2PointsReservoirTopLine.style.visibility = "hidden";
          }
        }, 400);
      } else if (this.currentStep === 4 || this.currentStep === 5) {
        // Show at steps 4 and 5
        reservoirTooComplex.style.visibility = "visible";
        reservoirTooComplex.style.opacity = "0.7"; // Restore original opacity

        // show fleche and co2 points line too
        flecheReservoir.style.visibility = "visible";
        flecheReservoir.style.opacity = "1"; // Restore original opacity

        co2PointsReservoirTopLine.style.visibility = "visible";
        co2PointsReservoirTopLine.style.opacity = "1"; // Restore original opacity
      }
    }

    // handle caprock visibility
    const caprock = document.querySelector('[data-name="5_caprock_shadow"]');
    if (caprock) {
      // Add smooth transition if not already set
      if (!caprock.style.transition) {
        caprock.style.transition =
          "opacity 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)";
      }
      if (this.currentStep === 5) {
        caprock.style.opacity = "1";
      } else {
        caprock.style.opacity = "0"; // Restore original opacity
      }
    }
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
