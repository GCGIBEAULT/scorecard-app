// Consolidated runtime for Start Your Round
// Replace entire script.js with this exact content

(function () {
  // Config
  const totalHoles = 18;

  // State
  let currentHole = 1;
  let clickCount = 0;

  // Utilities
  function safeQuery(selector) {
    try { return document.querySelector(selector); } catch (e) { return null; }
  }
  function safeQueryAll(selector) {
    try { return Array.from(document.querySelectorAll(selector)); } catch (e) { return []; }
  }

  function scrollToHole(n) {
    const el = document.getElementById('hole' + n) || safeQuery('#hole-view h2');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  // Visual selected style
  (function ensureStyle() {
    const id = 'syrr-runtime-style';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = '.selected-runtime{ outline:3px solid #0b84ff; background:#eaf4ff; }';
    document.head.appendChild(s);
  })();

  // Mark selected within same label (by text) for current runtime
  function markSelected(btn) {
    const txt = (btn.textContent || '').trim();
    const sameText = safeQueryAll('button').filter(b => (b.textContent || '').trim() === txt);
    sameText.forEach(s => s.classList.remove('selected-runtime'));
    btn.classList.add('selected-runtime');
  }

  // Stat click handler
  function onStatClick(e) {
    const btn = e.currentTarget;
    markSelected(btn);
    clickCount++;
    console.log('stat clicked', clickCount);
    if (clickCount >= 4) {
      clickCount = 0;
      currentHole = Math.min(totalHoles, currentHole + 1);
      console.log('ADVANCE HOLE ->', currentHole);
      scrollToHole(currentHole);
      // Optional: fire an event other code can listen to
      document.dispatchEvent(new CustomEvent('syrr:holeAdvanced', { detail: { hole: currentHole } }));
    }
  }

  // Attach runtime handlers to stat buttons
  function attachStatHandlers() {
    const statButtons = safeQueryAll('button').filter(b => {
      const t = (b.textContent || '').trim();
      return /^\d+$/.test(t) || t === 'Hit' || t === 'X';
    });
    if (!statButtons.length) {
      console.warn('No stat buttons found to attach handlers');
      return false;
    }
    statButtons.forEach(b => {
      // remove previously attached handler if present
      if (b.__syrrRuntimeHandler) b.removeEventListener('click', b.__syrrRuntimeHandler);
      const h = onStatClick.bind(b);
      b.addEventListener('click', h);
      b.__syrrRuntimeHandler = h;
    });
    console.log('Runtime handlers attached to', statButtons.length, 'stat buttons');
    return true;
  }

  // Attach Start Round listener to initialize selectedStats flow if needed
  function attachStartListener() {
    const btn = safeQueryAll('button').find(b => (b.textContent || '').trim() === 'Start Round') || safeQuery('button');
    if (!btn) {
      console.warn('Start Round button not found');
      return;
    }
    if (btn.__syrrStartHandler) btn.removeEventListener('click', btn.__syrrStartHandler);
    const handler = () => {
      // reset state and attach stat handlers when round starts
      clickCount = 0;
      currentHole = 1;
      attachStatHandlers();
      console.log('Start Round clicked (runtime) — handlers attached');
    };
    btn.addEventListener('click', handler);
    btn.__syrrStartHandler = handler;
  }

  // Try to attach on DOM ready
  function init() {
    attachStartListener();
    const attached = attachStatHandlers();
    if (!attached) {
      // fallback: try again after short delay in case buttons render later
      setTimeout(() => {
        attachStartListener();
        attachStatHandlers();
      }, 450);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.__syrrRuntime = {
    advanceHole: () => { clickCount = 4; onStatClick({ currentTarget: document.querySelector('button') }); },
    getState: () => ({ currentHole, clickCount })
  };
})();
