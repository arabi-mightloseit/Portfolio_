/**
 * FULL-SCREEN PRELOADER (GSAP)
 *
 * The markup and critical CSS live in index.html (#preloader), so the logo is on screen from the very first
 * paint, before this file or React has loaded. This module takes over that element, then:
 *
 *   1. starts fetching every image (src/preloadManifest.ts) and every web-font face at once,
 *      while React renders the app underneath the curtain (the app is fully laid out, just covered);
 *   2. once React has mounted, waits for: the window `load` event, every <img> in the page to be decoded,
 *      `document.fonts.ready`, and the layout to hold still for a few frames;
 *   3. inks the signature in left-to-right as that real progress arrives (never faster than MIN_SHOW_MS,
 *      never backwards), then lifts the curtain with a GSAP timeline.
 *
 * Because everything is loaded, decoded and laid out BEFORE the curtain lifts, nothing can pop in, swap font or
 * shift while the visitor is looking.
 *
 * It can never trap anyone: a failing image/font counts as "done", and after MAX_WAIT_MS the curtain lifts
 * regardless (index.html also carries a last-resort timer in case this file never runs at all).
 *
 * `html.is-preloading` (set in index.html) holds the page still and pauses the page's own `.animate-reveal-*`
 * entrance animations; it is removed the moment the curtain starts to lift so those play in view.
 */
import gsap from 'gsap';
import { FIRST_VIEW_IMAGES, REST_IMAGES } from './preloadManifest';

// ---- tuning -------------------------------------------------------------------------------------------------
/** Curtain waits only for what the first screen needs (~230 KB); the rest loads quietly in the background.
 *  Previously this was true, which held the curtain — and therefore every piece of content and the LCP
 *  paint — behind ~10 MB of images that are all below the fold. The preloader looks and animates exactly
 *  as before; only what it gates on changed. (Deeper images still arrive before anyone scrolls to them on
 *  any normal connection; a below-the-fold image that is still in flight simply loads the normal way.) */
const WAIT_FOR_ALL_IMAGES = false;
/** The logo takes at least this long to ink in, even when everything is already cached. */
const MIN_SHOW_MS = 1600;
/** Hard ceiling: after this the curtain lifts no matter what is still loading. */
const MAX_WAIT_MS = 15000;
/** Simultaneous image downloads (first-view images are queued first, so they get the bandwidth first). */
const PARALLEL_DOWNLOADS = 6;
/** Layout counts as settled once the page's size is identical for this many consecutive frames... */
const SETTLE_FRAMES = 4;
/** ...or after this long, whichever comes first. */
const SETTLE_MAX_MS = 1500;

/** Every web-font face the Google Fonts <link> in index.html declares. */
const FONT_FACES = [
  '400 1em "Instrument Serif"',
  'italic 400 1em "Instrument Serif"',
  '400 1em "Plus Jakarta Sans"',
  '500 1em "Plus Jakarta Sans"',
  '600 1em "Plus Jakarta Sans"',
  '700 1em "Plus Jakarta Sans"',
  '400 1em "JetBrains Mono"',
  '500 1em "JetBrains Mono"',
  '600 1em "JetBrains Mono"',
  '700 1em "JetBrains Mono"',
];

/** Progress units that are not an image or a font: app is in the DOM (1) + its images decoded (2) + layout settled (2). */
const STAGE_UNITS = 5;

export interface Preloader {
  /** Call once React has committed the app to the DOM. Safe to call more than once. */
  appMounted: () => void;
}

// ---- asset helpers ------------------------------------------------------------------------------------------

/** Resolves when the image has loaded OR failed. A broken file must never hold the page hostage. */
function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    const finish = () => {
      img.onload = null;
      img.onerror = null;
      resolve();
    };
    img.onload = finish;
    img.onerror = () => {
      console.warn('[preloader] image failed to load, continuing without it:', url);
      finish();
    };
    img.src = url;
    if (img.complete) finish(); // already in the cache
  });
}

/** Runs `worker` over `items`, at most `limit` at a time, in list order. */
async function runPool<T>(items: T[], worker: (item: T) => Promise<void>, limit: number): Promise<void> {
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  });
  await Promise.all(lanes);
}

/** Loaded and decoded, so painting it later costs nothing. Never rejects. */
function whenDecoded(img: HTMLImageElement): Promise<void> {
  const decode = (): Promise<void> =>
    typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve();
  if (img.complete) return decode();
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(decode()), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

/** Every eager <img> currently in the app. (Lazy ones are skipped: they would not load until scrolled to,
 *  and are covered by the manifest anyway.) */
function waitForDomImages(): Promise<void> {
  const root = document.getElementById('root');
  const imgs = root ? Array.from(root.querySelectorAll('img')).filter((i) => i.loading !== 'lazy') : [];
  return Promise.all(imgs.map(whenDecoded)).then(() => undefined);
}

/** Resolves once the document's size has not changed for SETTLE_FRAMES frames in a row (or after SETTLE_MAX_MS). */
function waitForLayoutSettled(): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    let last = '';
    let stable = 0;
    const check = () => {
      const de = document.documentElement;
      const size = `${de.scrollWidth}x${de.scrollHeight}`;
      stable = size === last ? stable + 1 : 0;
      last = size;
      if (stable >= SETTLE_FRAMES || performance.now() - start > SETTLE_MAX_MS) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

// ---- the preloader ------------------------------------------------------------------------------------------

export function startPreloader(): Preloader {
  const html = document.documentElement;
  const idle: Preloader = { appMounted() {} };

  const el = document.getElementById('preloader');
  if (!el) {
    html.classList.remove('is-preloading');
    return idle;
  }
  const logo = el.querySelector<HTMLElement>('.pl-logo');
  const count = el.querySelector<HTMLElement>('.pl-count');
  const bar = el.querySelector<HTMLElement>('.pl-line i');
  const meta = el.querySelector<HTMLElement>('.pl-meta');
  const stage = el.querySelector<HTMLElement>('.pl-stage');
  if (!logo || !count || !bar || !meta || !stage) {
    // markup was edited into something this file does not understand: get out of the way
    el.remove();
    html.classList.remove('is-preloading');
    return idle;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const minShowMs = reduced ? 400 : MIN_SHOW_MS;
  el.classList.add('is-live'); // stops the CSS-only pulse from index.html; from here on this file drives the logo

  // -- progress accounting ----------------------------------------------------------------------------------
  const gated = WAIT_FOR_ALL_IMAGES ? [...FIRST_VIEW_IMAGES, ...REST_IMAGES] : FIRST_VIEW_IMAGES;
  const background = WAIT_FOR_ALL_IMAGES ? [] : REST_IMAGES;
  const total = gated.length + FONT_FACES.length + STAGE_UNITS;
  let done = 0;
  const bump = (n = 1) => {
    done = Math.min(total, done + n);
  };

  const startedAt = performance.now();
  let forced = false; // MAX_WAIT_MS passed: stop waiting
  let revealing = false;
  let finished = false;

  // -- painting ---------------------------------------------------------------------------------------------
  let lastPct = -1;
  const paint = (p: number) => {
    logo.style.setProperty('--p', p.toFixed(4));
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
    const pct = Math.round(p * 100);
    if (pct !== lastPct) {
      lastPct = pct;
      count.textContent = String(pct).padStart(3, '0');
      if (pct % 5 === 0) el.setAttribute('aria-valuenow', String(pct));
    }
  };
  paint(0);

  // -- exit -------------------------------------------------------------------------------------------------
  /** Lets the page move again and starts its own entrance animations (see html.is-preloading in index.html). */
  const unlock = () => {
    html.classList.remove('is-preloading');
    el.style.pointerEvents = 'none';
  };

  const failsafe = window.setTimeout(() => {
    forced = true;
    console.warn('[preloader] still loading after', MAX_WAIT_MS, 'ms; revealing the page anyway.', {
      loaded: done,
      of: total,
    });
  }, MAX_WAIT_MS);

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(failsafe);
    gsap.ticker.remove(tick);
    unlock();
    el.remove();
    html.classList.add('is-loaded');
    (window as unknown as { __preloaderDone?: boolean }).__preloaderDone = true;
    window.dispatchEvent(new Event('preloader:done'));
  };

  const reveal = () => {
    if (revealing) return;
    revealing = true;
    gsap.ticker.remove(tick);

    if (reduced) {
      // no travelling motion: a plain, quick cross-fade
      gsap.to(el, { opacity: 0, duration: 0.35, ease: 'none', onStart: unlock, onComplete: finish });
      return;
    }

    gsap
      .timeline({ onComplete: finish })
      // the finished signature holds for a beat while the counter steps aside...
      .to(meta, { opacity: 0, duration: 0.3, ease: 'power2.out' })
      // ...then the page is released (its own staged reveal starts) as the curtain lifts off it. The curtain's
      // bottom edge is the now-full hairline, so the lift reads as a clean wipe.
      .add(unlock, 0.4)
      .to(el, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, 0.4)
      .to(stage, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.5);
  };

  // -- the one loop: ease the shown progress towards what is really loaded ----------------------------------
  let shown = 0;
  function tick(_time: number, deltaMs: number) {
    const timeCap = Math.min(1, (performance.now() - startedAt) / minShowMs);
    const real = forced ? 1 : done / total;
    const want = Math.min(real, timeCap); // never faster than MIN_SHOW_MS, never ahead of what has really loaded
    shown += (want - shown) * (1 - Math.pow(0.0005, deltaMs / 1000)); // frame-rate independent ease-out
    if (want - shown < 0.0015) shown = want;
    paint(shown);
    if (shown >= 1) reveal();
  }
  gsap.ticker.add(tick);

  // -- 1. images ----------------------------------------------------------------------------------------------
  void runPool(
    gated,
    async (url) => {
      await loadImage(url);
      bump();
    },
    PARALLEL_DOWNLOADS,
  );

  // -- 2. fonts -----------------------------------------------------------------------------------------------
  if ('fonts' in document) {
    void Promise.all(
      FONT_FACES.map((face) =>
        document.fonts
          .load(face)
          .catch(() => undefined)
          .then(() => bump()),
      ),
    );
  } else {
    bump(FONT_FACES.length);
  }

  // -- 3. the app itself: mounted, its images decoded, fonts applied, layout still ---------------------------
  let markMounted: () => void = () => {};
  const mounted = new Promise<void>((resolve) => {
    markMounted = resolve;
  });

  void (async () => {
    await mounted;
    bump(1);
    if (document.readyState !== 'complete') {
      await new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
    }
    await waitForDomImages();
    bump(2);
    if ('fonts' in document) await document.fonts.ready;
    await waitForLayoutSettled();
    bump(2);
    // gate was first-screen only: now fetch the rest quietly
    if (background.length) void runPool(background, loadImage, 3);
  })().catch((err) => {
    console.warn('[preloader] unexpected error, revealing the page:', err);
    forced = true;
  });

  return { appMounted: () => markMounted() };
}
