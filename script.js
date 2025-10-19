// script.js — Replace entire file with this exact content
(function(){
  const TOTAL_HOLES = 18;

  // runtime state
  let currentHole = 1;
  let clickCount = 0;

  // utilities
  function qAll(sel){ try{ return Array.from(document.querySelectorAll(sel)); }catch(e){ return []; } }
  function q(sel){ try{ return document.querySelector(sel); }catch(e){ return null; } }
  function isStatButton(b){
    if(!b || !b.textContent) return false;
    const t = b.textContent.trim();
    return /^\d+$/.test(t) || t === 'Hit' || t === 'X';
  }
  function ensureStyle(){
    if(document.getElementById('__syrr_style')) return;
    const s = document.createElement('style');
    s.id = '__syrr_style';
    s.textContent = '.selected-runtime{ outline:3px solid #0b84ff; background:#eaf4ff; }';
    document.head.appendChild(s);
  }

  // visual selection
  function markSelected(btn){
    const txt = (btn.textContent || '').trim();
    qAll('button').filter(b => (b.textContent || '').trim() === txt).forEach(x => x.classList.remove('selected-runtime'));
    btn.classList.add('selected-runtime');
  }

  // advance logic
  function scrollToHole(n){
    const el = document.getElementById('hole' + n) || q('#hole-view h2') || q('#hole-view');
    if(el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' });
  }

  function onStatClick(e){
    const btn = e.currentTarget;
    markSelected(btn);
    clickCount++;
    console.log('stat clicked', clickCount);
    if(clickCount >= 4){
      clickCount = 0;
      currentHole = Math.min(TOTAL_HOLES, currentHole + 1);
      console.log('ADVANCE HOLE ->', currentHole);
      scrollToHole(currentHole);
      document.dispatchEvent(new CustomEvent('syrr:holeAdvanced', { detail: { hole: currentHole } }));
    }
  }

  function attachStatHandlers(){
    ensureStyle();
    const stats = qAll('button').filter(isStatButton);
    if(!stats.length){
      console.warn('SYRR: no stat buttons found to attach');
      return false;
    }
    stats.forEach(b => {
      if(b.__syrrHandler) b.removeEventListener('click', b.__syrrHandler);
      b.__syrrHandler = onStatClick;
      b.addEventListener('click', onStatClick);
    });
    console.log('SYRR: attached stat handlers to', stats.length, 'buttons');
    return true;
  }

  function attachStartListener(){
    const btn = document.getElementById('start-round') || qAll('button').find(b => (b.textContent || '').trim() === 'Start Round');
    if(!btn){
      console.warn('SYRR: Start Round button not found');
      return;
    }
    if(btn.__syrrStartHandler) btn.removeEventListener('click', btn.__syrrStartHandler);
    btn.__syrrStartHandler = function(){
      clickCount = 0;
      currentHole = 1;
      attachStatHandlers();
      console.log('SYRR: Start Round clicked — handlers attached');
    };
    btn.addEventListener('click', btn.__syrrStartHandler);
  }

  // safe global for any inline calls or external callers
  window.startRound = window.startRound || function(){
    const btn = document.getElementById('start-round') || qAll('button').find(b => (b.textContent || '').trim() === 'Start Round');
    if(btn && typeof btn.click === 'function') {
      btn.click();
      console.log('SYRR: startRound() shim invoked');
      return true;
    }
    console.warn('SYRR: startRound() shim could not find Start Round button');
    return false;
  };

  // init
  function init(){
    attachStartListener();
    attachStatHandlers();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // debug API
  window.__syrrRuntime = {
    getState: () => ({ currentHole, clickCount }),
    reset: () => { clickCount = 0; currentHole = 1; }
  };
})();
