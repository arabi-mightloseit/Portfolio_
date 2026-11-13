/**
 * SECTION SWITCH RUNTIME — the L / W control and the curtain wipe between the two layers.
 *
 * Both layers are always mounted: Section L (`[data-section="default"]`, the editorial monograph) and
 * Section W (`[data-section="w"]`, the artistic exhibition, which renders itself hidden). This module
 * is the only thing that shows or hides either of them, by toggling the `hidden` attribute, and it
 * installs its own toggle in place of the `<span data-section-switch>` inside the header.
 *
 * React keeps a mirror of the state for the chrome it owns (nav links, palette button, footer labels):
 * every settle dispatches `sx:change` with `{ showingB }`, which App.tsx listens for.
 *
 * It can never trap the page: a watchdog forces the final state after ten seconds, and every animation
 * is cancelled in `settle()`, so WAAPI never leaves an element frozen mid-transform.
 */

import type Lenis from 'lenis';
import { TransitionArt } from './curtain-art.js';

/** Lenis' own package type declares a different `window.lenis`; read ours through one cast. */
const getLenis = (): Lenis | null | undefined =>
  (window as unknown as { lenis?: Lenis | null }).lenis;

type SwitchConfig = {
  header: string;
  replace: string | null;
  sectionA: string;
  sectionB: string;
  labels: readonly [string, string];
  accent: string;
  ink: string;
  speed: number;
  maxEls: number;
  targets: string;
};

const CFG: SwitchConfig = {
  header: 'header.portfolio-header',
  replace: '[data-section-switch]',
  sectionA: '[data-section="default"]',
  sectionB: '[data-section="w"]',
  labels: ['L', 'W'],
  accent: '61,92,255', // the site's electric blue, #3D5CFF
  ink: '#06070A', // Section W's canvas black
  speed: 1,
  maxEls: 40,
  targets: 'h1,h2,h3,h4,h5,h6,p,li,img,picture,video,figure,a,button,.btn,[data-sx]',
};

const EASE = {
  io: 'cubic-bezier(.87,0,.13,1)',
  in: 'cubic-bezier(.64,0,.78,0)',
  out: 'cubic-bezier(.16,1,.3,1)',
};

type PlayOptions = {
  d?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
  fill?: FillMode;
};

export function initSectionSwitch(): void {
  if (window.__sxLoaded) return;

  const headerEl = document.querySelector<HTMLElement>(CFG.header);
  const aEl = document.querySelector<HTMLElement>(CFG.sectionA);
  const bEl = document.querySelector<HTMLElement>(CFG.sectionB);
  if (!headerEl || !aEl || !bEl) {
    console.warn('[sx] header or section selectors not found; the switch was not installed.', {
      header: headerEl,
      A: aEl,
      B: bEl,
    });
    return;
  }
  // Non-null aliases: the functions below are hoisted, so TypeScript cannot carry the guard's
  // narrowing into them.
  const header: HTMLElement = headerEl;
  const A: HTMLElement = aEl;
  const B: HTMLElement = bEl;
  window.__sxLoaded = true;

  /* ---------- CSS ---------- */
  const css = document.createElement('style');
  css.textContent = `
  @property --sx-a { syntax:'<angle>'; inherits:false; initial-value:0deg; }
  [data-sx-sec][hidden]{ display:none !important; }

  .sx-toggle{
    --acc: rgb(${CFG.accent}); --ink:${CFG.ink};
    position:relative; isolation:isolate; display:inline-flex; align-items:center;
    width:136px; height:44px; padding:4px; border:0; border-radius:999px; flex:none;
    background:var(--ink); color:var(--acc); cursor:pointer;
    font-family:inherit; font-size:11px; font-weight:700; line-height:1;
    letter-spacing:.14em; text-transform:uppercase;
    -webkit-tap-highlight-color:transparent;
    transition:transform .35s cubic-bezier(.34,1.56,.64,1);
    animation:sx-pulse 2.4s ease-out infinite;
  }
  .sx-toggle::before{
    content:''; position:absolute; inset:-2px; border-radius:inherit; z-index:-2;
    background:conic-gradient(from var(--sx-a), var(--acc), transparent 28%, var(--acc) 55%, transparent 80%, var(--acc));
    animation:sx-spin 3s linear infinite;
  }
  .sx-toggle[aria-checked="true"]::before{ animation-direction:reverse; }
  .sx-toggle::after{ content:''; position:absolute; inset:0; border-radius:inherit; background:var(--ink); z-index:-1; }
  .sx-toggle:hover{ transform:scale(1.07); }
  .sx-toggle:active{ transform:scale(.95); }
  .sx-toggle:focus-visible{ outline:2px solid #fff; outline-offset:4px; }

  .sx-knob{
    position:absolute; z-index:0; left:4px; top:4px;
    width:calc(50% - 4px); height:calc(100% - 8px); border-radius:999px;
    background:var(--acc); box-shadow:0 0 18px rgba(${CFG.accent},.65);
    transition:transform .7s cubic-bezier(.34,1.56,.64,1);
  }
  .sx-toggle[aria-checked="true"] .sx-knob{ transform:translateX(100%); }
  .sx-toggle[data-touched="false"][aria-checked="false"] .sx-knob{ animation:sx-nudge 2.6s ease-in-out infinite; }

  .sx-label{ position:relative; z-index:1; flex:1; text-align:center; transition:color .4s, transform .5s cubic-bezier(.34,1.56,.64,1); }
  .sx-toggle[aria-checked="false"] .sx-label[data-i="0"]{ color:var(--ink); }
  .sx-toggle[aria-checked="false"] .sx-label[data-i="1"]{ color:var(--acc); }
  .sx-toggle[aria-checked="true"]  .sx-label[data-i="0"]{ color:var(--acc); }
  .sx-toggle[aria-checked="true"]  .sx-label[data-i="1"]{ color:var(--ink); }
  .sx-toggle[data-busy="true"]{ pointer-events:none; }
  .sx-toggle[data-busy="true"] .sx-label{ transform:scale(.92); }

  /* The curtain sits above the page but below the sticky header (49) and the project modal (z-50). */
  .sx-curtain{
    position:fixed; left:0; right:0; bottom:0; top:var(--sx-hh,72px); z-index:45;
    display:none; overflow:hidden;
  }
  .sx-ink{ position:absolute; inset:0; background:${CFG.ink}; }
  .sx-cols{ position:absolute; inset:0; display:flex; }
  .sx-cols i{ flex:1; background:rgb(${CFG.accent}); margin-right:-1px; }
  @keyframes sx-spin{ to{ --sx-a:360deg; } }
  @keyframes sx-pulse{
    0%{ box-shadow:0 0 0 0 rgba(${CFG.accent},.55); }
    70%,100%{ box-shadow:0 0 0 16px rgba(${CFG.accent},0); }
  }
  @keyframes sx-nudge{
    0%,60%,100%{ transform:translateX(0); }
    72%{ transform:translateX(26%); } 84%{ transform:translateX(0); } 92%{ transform:translateX(10%); }
  }
  @media (max-width:640px){ .sx-toggle{ width:112px; height:40px; font-size:10px; } }
  @media (prefers-reduced-motion:reduce){ .sx-toggle,.sx-toggle::before,.sx-knob{ animation:none !important; } }
  `;
  document.head.appendChild(css);

  /* ---------- DOM ---------- */
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sx-toggle';
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-checked', 'false');
  toggle.setAttribute('aria-label', 'Switch between Section L and Section W');
  toggle.title = 'Switch between Section L and Section W';
  toggle.dataset.touched = 'false';
  toggle.dataset.busy = 'false';
  toggle.innerHTML = `<span class="sx-knob"></span>
    <span class="sx-label" data-i="0">${CFG.labels[0]}</span>
    <span class="sx-label" data-i="1">${CFG.labels[1]}</span>`;

  const old = CFG.replace ? document.querySelector<HTMLElement>(CFG.replace) : null;
  if (old) old.replaceWith(toggle);
  else header.appendChild(toggle);

  const NCOLS = 6;
  // Curtain geometry, taken from the sweep in step 2 of go(). The art's morph must begin exactly when
  // the last pillar has landed, so CURTAIN_TOTAL_MS is derived from these, not guessed.
  const PILLAR_DURATION = 620;
  const PILLAR_DELAY = 140;
  const PILLAR_STAGGER = 260;
  const CURTAIN_TOTAL_MS =
    (PILLAR_DELAY + (NCOLS - 1) * PILLAR_STAGGER + PILLAR_DURATION) / (CFG.speed || 1);
  const curtain = document.createElement('div');
  curtain.className = 'sx-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  curtain.innerHTML = `<div class="sx-ink"></div><div class="sx-cols">${'<i></i>'.repeat(
    NCOLS,
  )}</div>`;
  document.body.appendChild(curtain);
  const ink = curtain.querySelector<HTMLElement>('.sx-ink')!;
  const cols = Array.from(curtain.querySelectorAll<HTMLElement>('.sx-cols i'));

  // Pillar faces. The pillars are built once and reused on every press, so the art is mounted here and
  // re-laid out by its own start() each time the curtain drops.
  TransitionArt.mount(cols);

  // Keep the header (and the button inside it) above the curtain.
  if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
  // 49, not 100: ProjectModal is z-50 and must stay above the header.
  header.style.zIndex = String(Math.max(Number(getComputedStyle(header).zIndex) || 0, 49));

  A.setAttribute('data-sx-sec', '');
  B.setAttribute('data-sx-sec', '');
  A.hidden = false;
  B.hidden = true;

  /* ---------- Helpers ---------- */
  const inView = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.bottom > 0 && r.top < window.innerHeight * 1.1;
  };

  const targets = (sec: HTMLElement): Element[] => {
    const sel = CFG.targets;
    return Array.from(sec.querySelectorAll(sel)).filter((el) => {
      if (el.closest('header') || el.closest('[data-sx-skip]')) return false;
      const parent = el.parentElement && el.parentElement.closest(sel);
      return !(parent && sec.contains(parent));
    });
  };

  /* WAAPI engine: never touches inline styles, so cancel() restores the exact previous state. */
  const live = new Set<Animation>();
  const FROM = (o: Keyframe): Keyframe[] => [{ ...o, offset: 0 }];
  const TO = (o: Keyframe): Keyframe[] => [o];

  function play(
    els: Element | Element[] | null,
    frames: Keyframe[],
    o: PlayOptions = {},
  ): Promise<void> {
    const list: Element[] = els ? (Array.isArray(els) ? els : [els]) : [];
    const n = list.length;
    if (!n) return Promise.resolve();
    const k = CFG.speed || 1;
    const jobs = list.map((el, i) => {
      let a: Animation;
      try {
        a = el.animate(frames, {
          duration: (o.d ?? 500) / k,
          delay: ((o.delay ?? 0) + (n > 1 ? (i / (n - 1)) * (o.stagger ?? 0) : 0)) / k,
          easing: o.ease ?? EASE.out,
          fill: o.fill ?? 'both',
        });
      } catch {
        return Promise.resolve();
      }
      live.add(a);
      return a.finished.catch(() => undefined);
    });
    return Promise.all(jobs).then(() => undefined);
  }

  const toTop = () =>
    new Promise<void>((resolve) => {
      if (window.scrollY < 4) return resolve();
      let timer: number;
      const done = () => {
        clearTimeout(timer);
        resolve();
      };
      timer = window.setTimeout(resolve, 1600); // never hang
      try {
        const lenis = getLenis();
        if (lenis) {
          lenis.scrollTo(0, { duration: 0.8, force: true, lock: true, onComplete: done });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          const t0 = performance.now();
          const wait = () => {
            if (window.scrollY < 2 || performance.now() - t0 > 1200) done();
            else requestAnimationFrame(wait);
          };
          requestAnimationFrame(wait);
        }
      } catch {
        done();
      }
    });

  const block = (e: Event) => e.preventDefault();
  const lockScroll = () => {
    getLenis()?.stop();
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
  };
  const unlockScroll = () => {
    getLenis()?.start();
    window.removeEventListener('wheel', block);
    window.removeEventListener('touchmove', block);
  };
  const refreshScroll = () => {
    try {
      getLenis()?.resize();
    } catch {
      /* Lenis owns its own frame loop; nothing to refresh if it is not up yet */
    }
    try {
      window.ScrollTrigger?.refresh?.();
    } catch {
      /* no ScrollTrigger on this page */
    }
  };
  const jumpTop = () => {
    try {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
    } catch {
      window.scrollTo(0, 0);
    }
  };

  /* Guaranteed clean end state: used after success, errors and the watchdog. */
  function settle(toB: boolean) {
    live.forEach((a) => {
      try {
        a.cancel();
      } catch {
        /* animation already gone */
      }
    });
    live.clear();
    A.hidden = toB;
    B.hidden = !toB;
    curtain.style.display = 'none';
    unlockScroll();
    refreshScroll();
    toggle.setAttribute('aria-checked', String(toB));
    // The button names the next press, matching the copy the returning curtain carries.
    const nextLabel = toB ? 'Back to mediocrity' : 'Switch between Section L and Section W';
    toggle.setAttribute('aria-label', nextLabel);
    toggle.title = nextLabel;
    // Both layers measure differently once the other one is laid out; re-measure scroll timelines.
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new CustomEvent('sx:change', { detail: { showingB: toB } }));
  }

  /* ---------- Transition ---------- */
  let busy = false;
  let showingB = false;
  let gen = 0;

  function finish(toB: boolean) {
    showingB = toB;
    settle(toB);
    busy = false;
    toggle.dataset.busy = 'false';
  }

  async function go(toB: boolean) {
    if (busy || toB === showingB) return;
    busy = true;
    const my = ++gen;
    const chk = () => {
      if (my !== gen) throw new Error('sx-aborted');
    };

    toggle.dataset.busy = 'true';
    toggle.dataset.touched = 'true';
    toggle.setAttribute('aria-checked', String(toB));

    // Watchdog: if anything hangs, force the final state.
    const dog = window.setTimeout(() => {
      console.warn('[sx] watchdog: forcing final state');
      gen += 1;
      finish(toB);
    }, 10000);

    try {
      const from = toB ? A : B;
      const to = toB ? B : A;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        from.hidden = true;
        to.hidden = false;
        jumpTop();
        return;
      }

      const s = toB ? 1 : -1; // +1 = forward, -1 = rewind
      const org = toB ? '50% 0%' : '50% 100%'; // collapse/expand edge
      const ord = (arr: Element[]) => (toB ? arr : arr.slice().reverse());
      const sweep = ord(cols);

      // 1. Swipe to the very top.
      await toTop();
      chk();
      lockScroll();

      // 2. Collapse current content + curtain sweeps in.
      const outEls = ord(targets(from).filter(inView).slice(0, CFG.maxEls));
      curtain.style.setProperty('--sx-hh', `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
      curtain.style.display = 'block';
      // The pillars start dropping now; their faces morph the moment the last one lands.
      TransitionArt.play(toB ? 'toW' : 'toL', CURTAIN_TOTAL_MS);

      const collapse = play(
        outEls,
        TO({
          transform: `translateY(${-36 * s}px) scaleY(0) skewX(${-8 * s}deg)`,
          opacity: 0,
          filter: 'blur(10px)',
          transformOrigin: org,
        }),
        { d: 520, stagger: 300, ease: EASE.in, fill: 'forwards' },
      );

      const offIn = `translateY(${100 * s}%)`;
      const cover = Promise.all([
        play(ink, FROM({ transform: offIn }), { d: 620, ease: EASE.io }),
        play(sweep, FROM({ transform: offIn }), {
          d: PILLAR_DURATION,
          delay: PILLAR_DELAY,
          stagger: PILLAR_STAGGER,
          ease: EASE.io,
        }),
      ]);

      await Promise.all([collapse, cover]);
      chk();

      // 3. Swap layers while fully covered.
      from.hidden = true;
      to.hidden = false;
      jumpTop();
      refreshScroll();
      // The layer that was hidden was laid out at zero height: tell measurement-based timelines
      // (framer-motion useScroll, Lenis) to re-read the geometry now that it is visible.
      window.dispatchEvent(new Event('resize'));
      const inEls = ord(targets(to).filter(inView).slice(0, CFG.maxEls));

      // 4. Curtain leaves, new content expands from the mirrored edge.
      const offOut = `translateY(${-100 * s}%)`;
      const uncover = Promise.all([
        play(sweep, TO({ transform: offOut }), {
          d: 700,
          stagger: 260,
          ease: EASE.io,
          fill: 'forwards',
        }),
        play(ink, TO({ transform: offOut }), {
          d: 700,
          delay: 300,
          ease: EASE.io,
          fill: 'forwards',
        }),
      ]);
      const expand = play(
        inEls,
        FROM({
          transform: `translateY(${48 * s}px) scaleY(0) skewX(${8 * s}deg)`,
          opacity: 0,
          filter: 'blur(12px)',
          transformOrigin: org,
        }),
        { d: 900, delay: 420, stagger: 450, ease: EASE.out },
      );

      await Promise.all([uncover, expand]);
      chk();
    } catch (e) {
      if (my === gen) console.error('[sx] transition error, recovering:', e);
    } finally {
      clearTimeout(dog);
      if (my === gen) finish(toB); // stale runs (after the watchdog) must not touch the page
    }
  }

  toggle.addEventListener('click', () => {
    void go(!showingB);
  });

  // Bfcache restore / tab return: guarantee a clean state.
  window.addEventListener('pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted && !busy) settle(showingB);
  });
}
