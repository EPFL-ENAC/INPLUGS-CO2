/**
 * Simple Navbar Dropdown Handler
 * Adds mouseover/mouseout events to dropdown menus with proper positioning and easing
 */

document.addEventListener('DOMContentLoaded', function() {
  // Target all dropdown toggle elements
  const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
  
  dropdownToggles.forEach(toggle => {
    // Get the key from data attribute or class name
    const navItem = toggle.getAttribute('data-nav-item') || 
                   toggle.className.match(/nav-(\w+)/)[1];
    
    if (navItem) {
      // Find the corresponding dropdown menu
      const dropdownMenu = document.getElementById(`nav-${navItem}-dropdown-menu`);
      
      if (dropdownMenu) {
        // Set initial transition style for smooth animation
        dropdownMenu.style.transition = 'opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease';
        
        // Add mouseover event to toggle
        toggle.addEventListener('mouseover', function() {
          // Get the position of the toggle element
          const toggleRect = toggle.getBoundingClientRect();
          const navRect = document.querySelector('nav').getBoundingClientRect();
          
          // Calculate the position relative to the nav container
          const leftPosition = toggleRect.left - navRect.left;
          
          // Apply styles
          dropdownMenu.style.opacity = '1';
          dropdownMenu.style.visibility = 'visible';
          dropdownMenu.style.transform = `translateY(0) translateX(${leftPosition}px)`;
        });
        
        // Add mouseout event to toggle
        toggle.addEventListener('mouseout', function(e) {
          // Use a timeout to allow for transition to the dropdown menu
          setTimeout(() => {
            // Check if the mouse is still not over the dropdown or toggle
            if (!dropdownMenu.matches(':hover') && !toggle.matches(':hover')) {
              dropdownMenu.style.opacity = '0';
              dropdownMenu.style.visibility = 'hidden';
              dropdownMenu.style.transform = 'translateY(-10px)';
            }
          }, 100); // Small delay to allow for transition
        });
        
        // Add mouse events to the dropdown menu itself
        dropdownMenu.addEventListener('mouseover', function() {
          // Keep the dropdown open when hovering over it
          dropdownMenu.style.opacity = '1';
          dropdownMenu.style.visibility = 'visible';
        });
        
        dropdownMenu.addEventListener('mouseout', function(e) {
          // Use a timeout to allow for transition back to the toggle
          setTimeout(() => {
            // Check if the mouse is still not over the dropdown or toggle
            if (!dropdownMenu.matches(':hover') && !toggle.matches(':hover')) {
              dropdownMenu.style.opacity = '0';
              dropdownMenu.style.visibility = 'hidden';
              dropdownMenu.style.transform = 'translateY(-10px)';
            }
          }, 100); // Small delay to allow for transition
        });
      }
    }
  });
});
