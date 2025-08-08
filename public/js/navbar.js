/** Navbar adaptive collapse: moves overflowing items into a More dropdown (desktop only) */
(function(){
  const MOBILE_BREAKPOINT = 768; // <= disabled
  const RESIZE_DEBOUNCE = 120;
  const DEBUG = false;
  function log(...args) { if(DEBUG) console.log('[NAV]', ...args); }

  // Locate host & template
  const host = document.querySelector('site-header');
  if(!host) return;
  const tpl = host.querySelector('#header-template');
  if(!tpl) return;
  if(host.shadowRoot) return; // prevent double init (e.g. via HMR)
  const shadowRoot = host.attachShadow({mode:'open'});
  shadowRoot.appendChild(tpl.content.cloneNode(true));
  log('Shadow DOM attached');

  // Elements
  const header = shadowRoot.querySelector('.header');
  const nav = shadowRoot.querySelector('nav');
  const moreWrapper = shadowRoot.querySelector('.nav-more');
  const moreToggle = shadowRoot.querySelector('.nav-more-toggle');
  const moreDropdown = shadowRoot.querySelector('.nav-more-dropdown');
  const logo = shadowRoot.querySelector('.logo-link');
  const lang = shadowRoot.querySelector('.lang');
  const mobileToggle = shadowRoot.querySelector('.mobile-menu-toggle');

  if(!header || !nav || !moreWrapper || !moreDropdown) {
    log('Missing required elements');
    return;
  }

  // Canonical items (direct children anchors of nav) collected once
  const canonicalItems = Array.from(nav.querySelectorAll(':scope > a[data-nav-item]'));
  if(!canonicalItems.length) {
    log('No nav items');
  }

  // Utility: put all items back into nav before the moreWrapper
  function restoreAll() {
    // Move any items from dropdown back to nav (in canonical order)
    canonicalItems.forEach(a => nav.insertBefore(a, moreWrapper));
    moreDropdown.innerHTML = '';
    moreWrapper.style.display = 'none';
    moreDropdown.classList.remove('open');
    if(moreToggle) moreToggle.setAttribute('aria-expanded','false');
  }

  // Measure available horizontal space for nav items inside the grid row
  function getAvailableNavWidth() {
    const headerRect = header.getBoundingClientRect();
    const gapPx = parseFloat(getComputedStyle(header).columnGap || getComputedStyle(header).gap || '0') || 0; // grid gap
    // Width used by other columns (they may have own margins/padding)
    function outerWidth(el){ if(!el) return 0; const cs = getComputedStyle(el); return el.getBoundingClientRect().width + parseFloat(cs.marginLeft)||0 + parseFloat(cs.marginRight)||0; }
    const logoW = outerWidth(logo);
    const langW = outerWidth(lang);
    const mobileW = outerWidth(mobileToggle && mobileToggle.offsetParent ? mobileToggle : null); // hidden on desktop => width 0
    // Grid with 4 columns -> 3 gaps always present at desktop; if mobile toggle hidden still occupies its grid track? It's auto/auto, but the physical width is 0.
    const gapsCount = 3; // logo|nav|lang|mobile-toggle
    const gapsTotal = gapPx * gapsCount;
    const paddingLeft = parseFloat(getComputedStyle(header).paddingLeft)||0;
    const paddingRight = parseFloat(getComputedStyle(header).paddingRight)||0;
    const occupied = logoW + langW + mobileW + gapsTotal + paddingLeft + paddingRight;
    const available = headerRect.width - occupied;
    log('Widths header', headerRect.width.toFixed(1),'occupied', occupied.toFixed(1),'available', available.toFixed(1));
    return available;
  }

  // Collapse logic
  function collapseIfNeeded() {
    const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
    if(isMobile) {
      restoreAll();
      log('Mobile breakpoint - collapse disabled');
      return;
    }

    restoreAll();

    // Quick exit if nothing to do
    if(!canonicalItems.length) return;

    const available = getAvailableNavWidth();

    // Compute current required width for all items (excluding more wrapper)
    const itemsWidth = canonicalItems.reduce((sum,a)=> sum + a.getBoundingClientRect().width, 0);
    const itemGap = parseFloat(getComputedStyle(nav).columnGap || getComputedStyle(nav).gap || '0') || 0; // nav gap (flex gap)
    const totalGap = itemGap * Math.max(0, canonicalItems.length - 1);
    let required = itemsWidth + totalGap;

    log('Initial required', required.toFixed(1),'available', available.toFixed(1));

    if(required <= available) {
      log('All items fit. No collapse.');
      return;
    }

    // Show More button as soon as we begin moving items because it consumes width; include its width in re-measure
    moreWrapper.style.display = 'flex';
    // Need its width in calculations
    const moreWidth = moreWrapper.getBoundingClientRect().width + itemGap; // plus a gap it occupies as an item
    required += moreWidth; // account for adding the button itself

    // Move items from end until they fit
    let moved = 0;
    while(required > available && nav.querySelector(':scope > a[data-nav-item]')) {
      const last = nav.querySelector(':scope > a[data-nav-item]:last-of-type');
      if(!last) break;
      // Update required width: remove last item width + a gap (if there remains at least one item before it)
      const lastWidth = last.getBoundingClientRect().width;
      required -= lastWidth;
      // Removing one item also removes one gap unless it was the only item
      if(nav.querySelectorAll(':scope > a[data-nav-item]').length > 1) {
        required -= itemGap;
      }
      // Prepend to dropdown to maintain canonical order
      if(moreDropdown.firstChild) {
        moreDropdown.insertBefore(last, moreDropdown.firstChild);
      } else {
        moreDropdown.appendChild(last);
      }
      moved++;
      log('Moved', last.getAttribute('data-nav-item'),'required now', required.toFixed(1),'available', available.toFixed(1));
      // Safety to avoid infinite loops
      if(moved > canonicalItems.length) break;
    }

    if(moved === 0) {
      // Nothing moved (rare) -> hide More again
      moreWrapper.style.display = 'none';
      log('No items moved; hiding More');
    } else {
      log('Collapse complete. Items moved:', moved);
    }
  }

  // Dropdown toggle
  if(moreToggle) {
    moreToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = moreDropdown.classList.toggle('open');
      moreToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if(!shadowRoot.contains(e.target)) {
      moreDropdown.classList.remove('open');
      if(moreToggle) moreToggle.setAttribute('aria-expanded','false');
    }
  });

  // Debounced resize
  let resizeTimer;
  function schedule() { clearTimeout(resizeTimer); resizeTimer = setTimeout(collapseIfNeeded, RESIZE_DEBOUNCE); }
  window.addEventListener('resize', schedule);

  // Font / layout readiness
  function initialRun() { collapseIfNeeded(); }
  if(document.fonts && document.fonts.ready) {
    document.fonts.ready.then(()=> { setTimeout(initialRun, 50); });
  } else {
    window.addEventListener('load', ()=> setTimeout(initialRun, 150));
  }

  // Also run after a short delay in case of late layout shifts
  setTimeout(collapseIfNeeded, 400);
  setTimeout(collapseIfNeeded, 1200);

  // Observe nav for mutations (dynamic changes)
  const mo = new MutationObserver(() => schedule());
  mo.observe(nav, { childList: true, subtree: false });

  log('Navbar adaptive collapse initialized');
})();

console.log('SimpleNavbar: loaded (adaptive)');