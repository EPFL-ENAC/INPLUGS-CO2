/**
 * Landing Page Navigation Controller
 * Handles the transition between landing page and full page using View Transitions
 * Progressive enhancement: links work normally, enhanced with View Transitions when supported
 */

class LandingPageController {
  constructor() {
    this.landingPageSection = document.querySelector('.landing_page');
    this.ctaButton = document.querySelector('.btn-cta');
    this.backButton = document.querySelector('.btn-back');
    this.isFullPage = false;
    
    // Check for View Transition API support
    this.supportsViewTransitions = 'startViewTransition' in document;
    
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.init();
  }

  init() {
    if (!this.landingPageSection) return;
    
    // Determine current page
    this.isFullPage = window.location.pathname.includes('landing_page_full');
    
    // Enhance CTA button with View Transitions if on landing page
    if (this.ctaButton && !this.isFullPage) {
      this.ctaButton.addEventListener('click', this.handleCTAClick.bind(this));
    }
    
    // Enhance back button with View Transitions if on full page
    if (this.backButton && this.isFullPage) {
      this.backButton.addEventListener('click', this.handleBackClick.bind(this));
    }
    
    // Listen for escape key to go back to landing page
    if (this.isFullPage) {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    // After existing init logic, start illustration loader
    this.initIllustrationLoader();
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
    if (event.key === 'Escape' && this.isFullPage) {
      this.navigateToLandingPage();
    }
  }

  navigateToFullPage() {
    const navigation = () => {
      window.location.href = '/landing_page_full';
    };

    document.startViewTransition(navigation);
  }

  navigateToLandingPage() {
    const navigation = () => {
      window.location.href = '/landing_page';
    };

    document.startViewTransition(navigation);
  }

  // Progressive SVG fragment loader
  initIllustrationLoader() {
    const container = document.querySelector('[data-illustration]');
    if (!container) return;

    const prefersReducedMotion = this.prefersReducedMotion;
    const fragmentList = JSON.parse(container.getAttribute('data-fragments') || '[]');
    const skipSmoke = prefersReducedMotion && container.getAttribute('data-skip-smoke-reduced-motion') === 'true';
    const maxRetries = parseInt(container.getAttribute('data-max-retries') || '1', 10);
    const timeoutMs = parseInt(container.getAttribute('data-timeout-ms') || '6000', 10);

    // If skipping smoke layer, remove last fragment (assumed smoke) & corresponding layer element
    if (skipSmoke && fragmentList.length) {
      fragmentList.pop();
      const smokeLayer = container.querySelector('[data-layer="3"]');
      if (smokeLayer) smokeLayer.remove();
    }

    const loadSequentially = async () => {
      for (let i = 0; i < fragmentList.length; i++) {
        const url = fragmentList[i];
        const layerEl = container.querySelector(`[data-layer="${i}"]`);
        if (!layerEl) continue;
        try {
          const svgMarkup = await this.fetchWithRetry(url, maxRetries, timeoutMs);
          // Basic sanitization: only allow <svg ...> ... </svg>
          const sanitized = this.extractSVG(svgMarkup);
          if (sanitized) {
            layerEl.innerHTML = sanitized;
            layerEl.classList.add('is-loaded');
          }
        } catch (e) {
          layerEl.classList.add('is-error');
          container.classList.add('has-error');
          break; // Abort remaining layers on error
        }
      }
      container.classList.add('is-complete');
    };

    // Defer to next frame to not block initial rendering
    requestAnimationFrame(loadSequentially);
  }

  fetchWithRetry(url, maxRetries, timeoutMs) {
    const attempt = (n) => new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      fetch(url, { signal: controller.signal })
        .then(resp => {
          clearTimeout(timer);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.text();
        })
        .then(resolve)
        .catch(err => {
          clearTimeout(timer);
          if (n < maxRetries) {
            attempt(n + 1).then(resolve).catch(reject);
          } else {
            reject(err);
          }
        });
    });
    return attempt(0);
  }

  extractSVG(text) {
    const match = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (!match) return null;
    // Optionally strip script tags if any (defensive)
    return match[0].replace(/<script[\s\S]*?<\/script>/gi, '');
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
