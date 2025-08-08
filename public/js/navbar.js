/** Navbar adaptive collapse: moves overflowing items into a More dropdown (desktop only) */
(function(){
  const MOBILE_BREAKPOINT = 768;
  const RESIZE_DEBOUNCE = 120;
  const DEBUG = false; // turned off after stabilizing
  function log(..._args){ if(DEBUG) console.log('[NAV]', ..._args); }

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
  if(moreDropdown && !moreDropdown.id) moreDropdown.id = 'nav-more-dropdown';

  if(!header || !nav || !moreWrapper || !moreDropdown) {
    log('Missing required elements');
    return;
  }

  // Canonical items (direct children anchors of nav) collected once
  const canonicalItems = Array.from(nav.querySelectorAll(':scope > a[data-nav-item]'));
  if(!canonicalItems.length) {
    log('No nav items');
  }

  // Insert missing helper functions used later
  function snapshotItemWidths(list){
    return list.map(a => ({ key: a.getAttribute('data-nav-item'), w: a.getBoundingClientRect().width.toFixed(1) }));
  }
  function isWrapping(){
    return nav.scrollHeight - nav.clientHeight > 2; // height-based wrap detection
  }

  // Utility: put all items back into nav before the moreWrapper
  function restoreAll() {
    // Move any items from dropdown back to nav (in canonical order)
    canonicalItems.forEach(a => nav.insertBefore(a, moreWrapper));
    moreDropdown.innerHTML = '';
    moreWrapper.style.display = 'none';
    moreDropdown.classList.remove('open');
    if(moreToggle) moreToggle.setAttribute('aria-expanded','false');
    // ARIA cleanup
    if(moreDropdown.children.length === 0) {
      moreDropdown.removeAttribute('role');
      moreDropdown.setAttribute('aria-hidden','true');
    }
    canonicalItems.forEach(a => a.removeAttribute('role')); // remove menuitem role when restored
  }

  // Measure available horizontal space for nav items inside the grid row
  function getAvailableNavWidth() {
    const headerRect = header.getBoundingClientRect();
    const gapPx = parseFloat(getComputedStyle(header).columnGap || getComputedStyle(header).gap || '0') || 0; // grid gap
    // Width used by other columns (they may have own margins/padding)
    function outerWidth(el){ if(!el) return 0; const cs = getComputedStyle(el); return el.getBoundingClientRect().width + (parseFloat(cs.marginLeft)||0) + (parseFloat(cs.marginRight)||0); }
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

  const ANIMATE_CLASS = 'nav-collapsing';
  // Inject optional style hook once (lightweight, can be overridden in real CSS)
  try {
    const style = document.createElement('style');
    style.textContent = `nav.${ANIMATE_CLASS}{transition:opacity .18s ease;}`;
    shadowRoot.appendChild(style);
  } catch(_){}

  // Collapse logic
  let collapsing = false;
  let lastSignature='';
  // Persist last applied collapsed layout to avoid immediate duplicate recomputation flicker
  let lastLayout = { available: 0, requiredAll: 0, dropdownKeys: [] };
  let lastRunTime = 0;

  function applyLayoutFromSignature(keys){
    if(!keys.length) return;
    moreWrapper.style.display = 'flex';
    const keySet = new Set(keys);
    canonicalItems.forEach(a => {
      if(keySet.has(a.getAttribute('data-nav-item'))){
        a.setAttribute('role','menuitem');
        if(moreDropdown.firstChild) moreDropdown.insertBefore(a, moreDropdown.firstChild); else moreDropdown.appendChild(a);
      }
    });
    if(moreDropdown.children.length){
      moreDropdown.setAttribute('role','menu');
      moreDropdown.removeAttribute('aria-hidden');
    } else {
      moreDropdown.removeAttribute('role');
      moreDropdown.setAttribute('aria-hidden','true');
    }
  }

  function collapseIfNeeded(){
    if(collapsing) { log('Skip: collapsing already running'); return; }
    collapsing = true;
    const now = performance.now();

    const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
    log('--- collapseIfNeeded START --- mobile?', isMobile);
    if(isMobile){ restoreAll(); lastLayout = { available:0, requiredAll:0, dropdownKeys:[] }; collapsing = false; return; }
    if(moreDropdown.classList.contains('open')) { log('Dropdown open: skip'); collapsing = false; return; }
    mo.disconnect();
    restoreAll();
    log('After restore: items', canonicalItems.length, snapshotItemWidths(canonicalItems));
    if(!canonicalItems.length){ log('No items after restore'); mo.observe(nav,{childList:true,subtree:false}); collapsing=false; return; }

    // Measure current full set widths
    const available = getAvailableNavWidth();
    const gap = parseFloat(getComputedStyle(nav).columnGap || getComputedStyle(nav).gap || '0') || 0;
    const itemsWidth = canonicalItems.reduce((s,a)=> s + a.getBoundingClientRect().width, 0);
    const requiredAll = itemsWidth + gap * Math.max(0, canonicalItems.length - 1);

    // All fit -> record empty layout
    if(requiredAll <= available){
      lastLayout = { available, requiredAll, dropdownKeys: [] };
      lastRunTime = now;
      mo.observe(nav,{childList:true,subtree:false}); collapsing=false; return;
    }

    // Reuse previous layout if geometry essentially unchanged (tolerance) and we previously collapsed
    const tol = 2; // px
    if(lastLayout.dropdownKeys.length && Math.abs(lastLayout.available - available) <= tol && Math.abs(lastLayout.requiredAll - requiredAll) <= tol){
      applyLayoutFromSignature(lastLayout.dropdownKeys);
      lastRunTime = now;
      mo.observe(nav,{childList:true,subtree:false}); collapsing=false; return;
    }

    // Fresh collapse pass
    moreWrapper.style.display = 'flex';
    // Force layout flush
    void moreWrapper.offsetWidth; // ensures style applied
    const moreWidth = moreWrapper.getBoundingClientRect().width + gap; // include gap slot
    let required = requiredAll + moreWidth;

    let moved = 0;
    while(required > available && nav.querySelector(':scope > a[data-nav-item]')) {
      const last = nav.querySelector(':scope > a[data-nav-item]:last-of-type');
      if(!last) break;
      const w = last.getBoundingClientRect().width;
      required -= w;
      if(nav.querySelectorAll(':scope > a[data-nav-item]').length > 1) required -= gap;
      if(moreDropdown.firstChild) moreDropdown.insertBefore(last, moreDropdown.firstChild); else moreDropdown.appendChild(last);
      last.setAttribute('role','menuitem');
      moved++;
      if(moved > canonicalItems.length) break;
    }

    if(moreDropdown.children.length){
      moreDropdown.setAttribute('role','menu');
      moreDropdown.removeAttribute('aria-hidden');
    } else {
      moreWrapper.style.display = 'none';
      moreDropdown.removeAttribute('role');
      moreDropdown.setAttribute('aria-hidden','true');
    }

    lastLayout = { available, requiredAll, dropdownKeys: Array.from(moreDropdown.querySelectorAll('a[data-nav-item]')).map(a=> a.getAttribute('data-nav-item')) };
    lastRunTime = now;
    mo.observe(nav,{childList:true,subtree:false});
    collapsing=false;
    log('--- collapseIfNeeded END ---');
  }

  // Dropdown toggle
  if(moreToggle) {
    moreToggle.setAttribute('aria-controls', moreDropdown.id);

    // Shared helpers
    function getDropdownItems(){ return Array.from(moreDropdown.querySelectorAll('a[data-nav-item]')); }
    function focusFirstDropdownItem(){ const items = getDropdownItems(); if(items.length) items[0].focus(); }
    function focusLastDropdownItem(){ const items = getDropdownItems(); if(items.length) items[items.length-1].focus(); }
    function openDropdown(focus='first') {
      if(!moreDropdown.classList.contains('open')) {
        moreDropdown.classList.add('open');
        moreToggle.setAttribute('aria-expanded','true');
      }
      if(focus === 'first') requestAnimationFrame(focusFirstDropdownItem);
      else if(focus === 'last') requestAnimationFrame(focusLastDropdownItem);
    }
    function closeDropdown(returnFocus=true){
      if(!moreDropdown.classList.contains('open')) return;
      moreDropdown.classList.remove('open');
      moreToggle.setAttribute('aria-expanded','false');
      if(returnFocus) moreToggle.focus();
    }

    // Click (mouse) toggle (keeps previous behavior; focus handled only for keyboard via key events)
    moreToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = moreDropdown.classList.contains('open');
      const open = !wasOpen;
      moreDropdown.classList.toggle('open', open);
      moreToggle.setAttribute('aria-expanded', String(open));
      if(open && e.detail === 0) { // keyboard-triggered (Enter/Space dispatch click with detail 0)
        requestAnimationFrame(focusFirstDropdownItem);
      }
      if(!open) closeDropdown(false); // normalize state
    });

    // Keyboard on toggle (2a, 2b already + extend for 2c,2f)
    moreToggle.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'Enter':
        case ' ': // Space
          e.preventDefault();
          moreToggle.click();
          break;
        case 'ArrowDown': // 2c open + focus first
          e.preventDefault();
          openDropdown('first');
          break;
        case 'ArrowUp': // optional: open + focus last for symmetry
          e.preventDefault();
          openDropdown('last');
          break;
        case 'Escape': // 2f close
          e.preventDefault();
          closeDropdown(true);
          break;
      }
    });

    // Dropdown keyboard navigation (2d,2f,2g)
    moreDropdown.addEventListener('keydown', (e) => {
      if(!moreDropdown.classList.contains('open')) return;
      const items = getDropdownItems();
      if(!items.length) return;
      const currentIndex = items.indexOf(document.activeElement);
      switch(e.key) {
        case 'ArrowDown': // cycle forward
          e.preventDefault();
          if(currentIndex === -1) items[0].focus(); else items[(currentIndex + 1) % items.length].focus();
          break;
        case 'ArrowUp': // cycle backward
          e.preventDefault();
            if(currentIndex === -1) items[items.length-1].focus(); else items[(currentIndex - 1 + items.length) % items.length].focus();
          break;
        case 'Escape': // 2f
          e.preventDefault();
          closeDropdown(true);
          break;
        case 'Tab': // 2g close when tabbing out past ends
          if(currentIndex === -1) return; // let browser handle
          if(!e.shiftKey && currentIndex === items.length - 1) {
            // forward past last
            closeDropdown(false);
          } else if(e.shiftKey && currentIndex === 0) {
            // backward before first
            closeDropdown(false);
          }
          break;
      }
    });

    // Close when focus leaves toggle + dropdown
    shadowRoot.addEventListener('focusin', (e) => {
      if(!moreDropdown.classList.contains('open')) return;
      if(e.target === moreToggle) return;
      if(moreDropdown.contains(e.target)) return;
      // Focus moved elsewhere inside header; keep open? We choose to close.
      closeDropdown(false);
    });
  }

  // Initial collapse check on font load
  function initialRun(){ collapseIfNeeded(); }
  if(document.fonts && document.fonts.ready) { document.fonts.ready.then(()=> { setTimeout(initialRun,50); }); } else { window.addEventListener('load', ()=> setTimeout(initialRun,150)); }

  // Resize observer (debounced)
  let resizeTimer; function schedule(){ clearTimeout(resizeTimer); resizeTimer = setTimeout(()=> { collapseIfNeeded(); }, RESIZE_DEBOUNCE); }
  window.addEventListener('resize', schedule);

  // Mutation observer to detect nav changes
  const mo = new MutationObserver(()=> schedule());
  mo.observe(nav,{childList:true,subtree:false});
})();

console.log('SimpleNavbar: loaded (adaptive)');