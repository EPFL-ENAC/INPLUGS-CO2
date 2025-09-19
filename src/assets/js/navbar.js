/**
 * Enhanced Navbar Dropdown Handler
 * Adds mouseover/mouseout events to dropdown menus with proper positioning and easing
 * Uses pre-calculated positions with ResizeObserver for dynamic layout changes
 */

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Calculate and set the position for a single dropdown
function setPositionForDropdown(toggle, dropdownMenu) {
  // Get the position of the toggle element
  const toggleRect = toggle.getBoundingClientRect();
  const navRect = document.querySelector("nav").getBoundingClientRect();

  // Calculate the position relative to the nav container
  const leftPosition = toggleRect.left - navRect.left;

  // Store the position as a CSS variable on the dropdown menu
  dropdownMenu.style.setProperty(
    "--dropdown-left-position",
    `${leftPosition}px`,
  );
}

// Calculate and set positions for all dropdowns
function setPositionsForAllDropdowns() {
  // Target all dropdown toggle elements
  const dropdownToggles = document.querySelectorAll(".nav-dropdown-toggle");

  dropdownToggles.forEach((toggle) => {
    // Get the key from data attribute or class name
    const navItem =
      toggle.getAttribute("data-nav-item") ||
      toggle.className.match(/nav-(\w+)/)?.[1];

    if (navItem) {
      // Find the corresponding dropdown menu
      const dropdownMenu = document.getElementById(
        `nav-${navItem}-dropdown-menu`,
      );

      if (dropdownMenu) {
        setPositionForDropdown(toggle, dropdownMenu);
      }
    }
  });
}

// Initialize dropdown functionality
function initDropdowns() {
  // Set initial positions
  setPositionsForAllDropdowns();

  // Target all dropdown toggle elements
  const dropdownToggles = document.querySelectorAll(".nav-dropdown-toggle");

  dropdownToggles.forEach((toggle) => {
    // Get the key from data attribute or class name
    const navItem =
      toggle.getAttribute("data-nav-item") ||
      toggle.className.match(/nav-(\w+)/)?.[1];

    if (navItem) {
      // Find the corresponding dropdown menu
      const dropdownMenu = document.getElementById(
        `nav-${navItem}-dropdown-menu`,
      );

      if (dropdownMenu) {
        // Add mouseover event to toggle
        toggle.addEventListener("mouseover", function () {
          // Add the active class to show the dropdown
          dropdownMenu.classList.add("dropdown-active");
        });

        // Add mouseout event to toggle
        toggle.addEventListener("mouseout", function (e) {
          // Use a timeout to allow for transition to the dropdown menu
          setTimeout(() => {
            // Check if the mouse is still not over the dropdown or toggle
            if (!dropdownMenu.matches(":hover") && !toggle.matches(":hover")) {
              // Remove the active class to hide the dropdown
              dropdownMenu.classList.remove("dropdown-active");
            }
          }, 100); // Small delay to allow for transition
        });

        // Add mouse events to the dropdown menu itself
        dropdownMenu.addEventListener("mouseover", function () {
          // Keep the dropdown open when hovering over it
          dropdownMenu.classList.add("dropdown-active");
        });

        dropdownMenu.addEventListener("mouseout", function (e) {
          // Use a timeout to allow for transition back to the toggle
          setTimeout(() => {
            // Check if the mouse is still not over the dropdown or toggle
            if (!dropdownMenu.matches(":hover") && !toggle.matches(":hover")) {
              // Remove the active class to hide the dropdown
              dropdownMenu.classList.remove("dropdown-active");
            }
          }, 100); // Small delay to allow for transition
        });
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialize dropdowns
  initDropdowns();

  // Set up ResizeObserver to handle layout changes
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(
      debounce(setPositionsForAllDropdowns, 100),
    );

    // Observe the navbar for resize events
    const navbar = document.querySelector("nav");
    if (navbar) {
      resizeObserver.observe(navbar);
    }

    // Also observe the body to catch window resize events
    resizeObserver.observe(document.body);
  } else {
    // Fallback for browsers that don't support ResizeObserver
    window.addEventListener(
      "resize",
      debounce(setPositionsForAllDropdowns, 250),
    );
  }
});
