/**
 * CURTAIN ART — what the curtain pillars carry while they drop.
 *
 * The switch runtime (src/sectionSwitch.ts) owns the pillars and their sweep; this module only paints
 * their faces. Each pillar gets a full-viewport slice positioned so that the six of them assemble one
 * poster, and the face morphs between the plain "mediocre" layout and the polished poster on cue.
 *
 * Edits here must not touch the pillars' geometry or timing: the runtime calls mount() once, then
 * play(direction, CURTAIN_TOTAL_MS) as the curtains start dropping.
 */

export const TransitionArt = (() => {
  const root = document.documentElement;
  const POLYS = [
    '0,14 16,8 66,62 54,76',
    '56,0 72,0 80,56 64,66',
    '40,66 90,58 98,112 58,115',
    '4,10 18,4 22,14 8,22'
  ];
  const COPY = {
    toW: {
      lines: ['PERFECTIONISM', 'NEVER MAKES', 'ANYTHING', 'UNIVERSALLY', 'LIKABLE'],
      flat: 'Perfectionism never makes anything universally likable',
      sub: 'wabi-sabi can',
      credit: 'portfolio / 2026'
    },
    toL: {
      lines: ['BACK', 'TO', 'MEDIOCRITY'],
      flat: 'Back to mediocrity',
      sub: '',
      credit: 'portfolio / 2026'
    }
  };
  let pillars = [], slices = [], dir = 'toW', timer = 0, raf = 0;

  const svg = cls =>
    `<svg class="${cls}" viewBox="0 0 100 115" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">` +
    POLYS.map(p => `<polygon points="${p}"/>`).join('') + `</svg>`;

  const sliceHTML = () => `
    <div class="tpa-layer tpa-flat">
      <div class="tpa-frame"></div>
      <div class="tpa-fig">${svg('tpa-fig-fill')}</div>
      <div class="tpa-copy">
        <h2 class="tpa-hl" data-flat></h2>
        <p class="tpa-sub" data-sub></p>
        <p class="tpa-credit" data-credit></p>
      </div>
    </div>
    <div class="tpa-layer tpa-prime">
      <div class="tpa-frame" data-i></div>
      <div class="tpa-fig" data-i><div class="tpa-speck"></div>${svg('tpa-fig-fill')}${svg('tpa-fig-line')}</div>
      <div class="tpa-copy">
        <h2 class="tpa-hl" data-lines></h2>
        <p class="tpa-sub" data-i data-sub></p>
        <p class="tpa-credit" data-i data-credit></p>
      </div>
      <div class="tpa-grain"></div>
    </div>`;

  function setCopy() {
    const c = COPY[dir];
    let n = 0;
    slices.forEach(s => {
      s.querySelector('[data-flat]').textContent = c.flat;
      s.querySelectorAll('[data-sub]').forEach(e => { e.textContent = c.sub; e.hidden = !c.sub; });
      s.querySelectorAll('[data-credit]').forEach(e => { e.textContent = c.credit; });
      s.querySelector('[data-lines]').innerHTML =
        c.lines.map(l => `<span class="tpa-ln"><span data-i>${l}</span></span>`).join('');
      let k = 0;
      s.querySelectorAll('.tpa-prime [data-i]').forEach(e => e.style.setProperty('--i', k++));
      n = k;
    });
    root.style.setProperty('--n', n);
  }

  // sizes the big headline so the widest word always fits, on any screen
  function fit() {
    const W = root.clientWidth, H = window.innerHeight;
    const c = COPY[dir], portrait = H > W, m = Math.min(W, H);
    const probe = document.createElement('h2');
    probe.className = 'tpa-hl';
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-size:100px';
    document.body.appendChild(probe);
    let em = 0;
    c.lines.forEach(t => { probe.textContent = t; em = Math.max(em, probe.offsetWidth / 100); });
    probe.remove();
    em = em || 6;
    const pad = Math.min(30, Math.max(10, m * .03));
    const x = pad + m * .045;
    const maxW = portrait ? W - 2 * x : (W - 2 * x) * .52;
    const maxH = portrait ? H * .40 : H * .58;
    const size = Math.min(maxW / em, maxH / (c.lines.length * .9));
    root.style.setProperty('--tpa-hl', Math.floor(size) + 'px');
  }

  function layout() {
    if (!pillars.length) return;
    const W = root.clientWidth, H = window.innerHeight;
    root.style.setProperty('--tpa-w', W + 'px');
    root.style.setProperty('--tpa-h', H + 'px');
    pillars.forEach((p, i) => {
      const s = slices[i];
      const box = p.getBoundingClientRect();
      // A face is the curtain's own box, which begins below the sticky header and is ~65px shorter than
      // the viewport. Sizing the slice to the face keeps the poster's bottom copy clear of that edge.
      s.style.width = W + 'px';
      s.style.height = (box.height || H) + 'px';
      s.style.left = -box.left + 'px';  // each pillar shows its own slice
    });
    fit();
  }

  function mount(els) {
    unmount();
    pillars = [...els];
    pillars.forEach((p, i) => {
      if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
      p.style.overflow = 'hidden';
      const s = document.createElement('div');
      s.className = 'tpa-slice';
      s.style.setProperty('--pi', i);
      s.innerHTML = sliceHTML();
      p.appendChild(s);
      slices.push(s);
    });
    root.style.setProperty('--pn', pillars.length);
    setCopy();
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  }

  function unmount() {
    slices.forEach(s => s.remove());
    pillars = []; slices = [];
    clearTimeout(timer);
    root.classList.remove('tpa-on', 'tpa-rev', 'tpa-noanim');
  }

  // call when the curtains START dropping
  function start(direction) {
    clearTimeout(timer);
    dir = direction;
    setCopy();
    layout();
    const rev = direction === 'toL';
    root.classList.add('tpa-noanim');
    root.classList.toggle('tpa-rev', rev);
    root.classList.toggle('tpa-on', rev);   // toL begins on the polished poster, toW on the flat layout
    void root.offsetWidth;
    root.classList.remove('tpa-noanim');
  }

  // call when the pillars have landed: runs the ~1s morph
  function morph() { root.classList.toggle('tpa-on', dir === 'toW'); }

  function play(direction, morphDelayMs = 1000) {
    start(direction);
    timer = setTimeout(morph, morphDelayMs);
  }

  addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); });
  addEventListener('orientationchange', () => setTimeout(layout, 250));

  return { mount, unmount, start, morph, play };
})();
