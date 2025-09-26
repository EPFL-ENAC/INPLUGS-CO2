/**
 * Simple scroll-based controller for what_is_gcs page
 * Natural scroll behavior with basic SVG positioning
 */

class WhatIsGCSController {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;

    // SVG positions from bottom (in pixels)
    this.svgPositions = [
      0.05 * 4287, // Box 1: 4% from top
      0.38 * 4287, // Box 2: 38% from top
      0.72 * 4287, // Box 3: 72% from top
      0.67 * 4287, // Box 4: 67% from top
      0.58 * 4287, // Box 5: 58% from top
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
      const newStep = Math.floor(scrollPosition / windowHeight) + 1;
      const clampedStep = Math.max(1, Math.min(this.totalSteps, newStep));

      if (clampedStep !== this.currentStep) {
        this.currentStep = clampedStep;
        this.updateSvgPosition();
        this.updateUI();
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
    if (step < 1 || step > this.totalSteps) {
      return;
    }

    // Simple smooth scroll - let the browser handle it naturally
    const targetPosition = (step - 1) * window.innerHeight;
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
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

      const targetPosition = this.svgPositions[this.currentStep - 1];
      background.style.transform = `translateY(-${targetPosition}px)`;
    }
  }

  updateUI() {
    // Update navigation buttons
    const prevButton = document.getElementById("scroll-up-btn");
    const nextButton = document.getElementById("scroll-down-btn");

    if (prevButton) {
      prevButton.disabled = this.currentStep === 1;
      prevButton.style.opacity = this.currentStep === 1 ? "0.3" : "1";
    }

    if (nextButton) {
      nextButton.disabled = this.currentStep === this.totalSteps;
      nextButton.style.opacity =
        this.currentStep === this.totalSteps ? "0.3" : "1";
    }

    // Update minimap markers
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
