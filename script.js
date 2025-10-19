// script.js — Replace entire file with this exact content
(function () {
  const TOTAL_HOLES = 18;
  let currentHole = 1;
  let clickCount = 0;

  function qAll(sel) {
    try { return Array.from(document.querySelectorAll(sel)); } catch (e) { return []; }
  }

  function q(sel) {
    try { return document.querySelector(sel); } catch (e) { return null; }
  }

  function isStatButton(b) {
    if (!b || !b.textContent) return false;
    const t = b.textContent.trim();
    return /^\d+$/.test(t) || t === 'Hit' || t === 'X';
  }

  function ensureStyle() {
    if (document.getElementById('__syrr_style')) return;
    const s = document.createElement('style');
    s.id = '__syrr_style';
    s.textContent = '.selected-runtime{ outline:3px solid #0b84ff; background:#eaf4ff; }';
    document.head.appendChild(s);
  }

  function markSelected(btn) {
    const txt = (btn.textContent || '').trim();
    qAll('button').filter(b => (b.textContent || '').trim() === txt)
      .forEach(x => x.classList.remove('selected-runtime'));
    btn.classList.add('selected-runtime');
  }

  function scrollToHole(n) {
    const el = document.getElementById('hole' + n) || q('#hole-view h2') || q('#hole-view');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' });
  }

  function onStatClick(e) {
    const btn = e.currentTarget;
    markSelected(btn);
    clickCount++;
    console.log('stat clicked', clickCount);
    if (clickCount >= 4) {
      clickCount = 0;
      currentHole = Math.min(TOTAL_HOLES, currentHole + 1);
      console.log('ADVANCE HOLE ->', currentHole);
      scrollToHole(currentHole);
      document.dispatchEvent(new CustomEvent('syrr:holeAdvanced', { detail: { hole: currentHole } }));
    }
  }

  function attachStatHandlers() {
    ensureStyle();
    const stats = qAll('button').filter(isStatButton);
    if (!stats.length) {
      console.warn('SYRR: no stat buttons found to attach');
      return false;
    }
    stats.forEach(b => {
      if (b.__syrrHandler) b.removeEventListener('click', b.__syrrHandler);
      b.__syrrHandler = onStatClick;
      b.addEventListener('click', onStatClick);
    });
  }

  function onStartRound() {
    const courseName = q('#courseName')?.value || '';
    const roundDate = q('#roundDate')?.value || '';
    const handicap = q('#handicap')?.value || '';
    const selectedStats = qAll('#stat-selector input[type="checkbox"]:checked')
      .map(cb => cb.value);

    const roundData = { courseName, roundDate, handicap, selectedStats };
    console.log('Round started:', roundData);

    const statusBlock = q('#top-running-status');
    if (statusBlock) {
      statusBlock.textContent = `Round started at ${courseName} on ${roundDate}`;
    }

    const holeView = q('#hole-view');
    if (holeView) {
      holeView.innerHTML = "<p>Hole tracking will appear here.</p>";
    }

    attachStatHandlers();
  }

  document.addEventListener('DOMContentLoaded', function () {
    const startButton = q('#start-round');
    if (!startButton) {
      console.error('Start Round button not found');
      return;
    }
    startButton.addEventListener('click', onStartRound);
  });
})();
