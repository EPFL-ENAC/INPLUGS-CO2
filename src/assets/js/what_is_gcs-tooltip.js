// term-tooltip.js
class TermTooltip extends HTMLElement {
  constructor() {
    super();
    this.currentLang = "en"; // Get from your i18n system
  }

  connectedCallback() {
    const term = this.getAttribute("term");
    const text = this.textContent;

    // Replace content with styled term
    this.innerHTML = `
      <i class="term-link" style="cursor: pointer; text-decoration: underline; text-decoration-style: dotted;">
        ${text}
      </i>
    `;

    const termLink = this.querySelector(".term-link");

    // Detect if device has hover capability (desktop)
    const hasHover = window.matchMedia("(hover: hover)").matches;

    if (hasHover) {
      // Desktop: use hover
      termLink.addEventListener("mouseenter", (e) => {
        e.preventDefault();
        this.openModal(term);
      });
    } else {
      // Mobile: use click/touch
      termLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.openModal(term);
      });
    }
  }

  openModal(term) {
    // Create modal structure
    const modal = document.createElement("div");
    modal.className = "term-modal";

    // Get i18n data first and check if it exists
    const i18nData = this.getI18nText(term);
    modal.innerHTML = `
      <div class="term-modal-backdrop"></div>
      <div class="term-modal-content">
        <div class="term-modal-header">
          <h2>${i18nData?.title || `Term: ${term}`}</h2>
          <button class="term-modal-close" aria-label="Close">&times;</button>
          <a href="/${this.currentLang}/dictionary#${term}" class="term-modal-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
          </a>
        </div>
        <div class="term-modal-body">
          <p>${i18nData?.definition || `No description available for ${term}`}</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Add animation
    requestAnimationFrame(() => {
      modal.classList.add("active");
    });

    // Close handlers
    const close = () => {
      modal.classList.remove("active");
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = "";
      }, 300);
    };

    modal.querySelector(".term-modal-close").addEventListener("click", close);
    modal
      .querySelector(".term-modal-backdrop")
      .addEventListener("click", close);

    // ESC key
    const escHandler = (e) => {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  getI18nText(key) {
    // Get the element and parse JSON content for i18n
    const el = document.getElementById("i18n-dictionary");
    if (!el) {
      return null;
    }

    try {
      const dictionary = JSON.parse(el.textContent);
      return dictionary[key] || null;
    } catch (error) {
      return null;
    }
  }
}

// Register the custom element
customElements.define("term-tooltip", TermTooltip);
