Suggested next refinements (pick any):

Refine tolerance: dynamic tolerance based on average item width to better reuse layouts.
Persist layout across reload via localStorage keyed by breakpoint range.
Add smooth opacity/translate animation for moved items (CSS only).
Improve accessibility: set aria-haspopup="menu" on button, aria-label for dropdown, focus trap while open (optional).
Support live addition/removal of nav items (update canonicalItems, re-collapse).
Expose a custom event (e.g. header.dispatchEvent(new CustomEvent('navcollapse',{detail:{movedKeys}}))).
Provide an API window.siteHeader?.recalculate() for manual triggers.
Reduce layout thrash: measure widths in a single loop using getBoundingClientRect once (cache).
Lazy-init: delay collapse until first scroll/interaction to improve LCP.
Unit test harness: small script to simulate viewport widths and assert moved keys.