/**
 * Halftone reveal engine (Exhibition Room 01 / NOIRÉ).
 *
 * Adapted from the behaviour of the React Bits "halftone reveal" idea: a halftone print sits on the
 * wall until a cursor / finger is near it, then the real document is uncovered through a field of
 * halftone dots (full-size dots in the core, shrinking to nothing at the edge), and fades back.
 *
 * Plain canvas 2D. No WebGL, no dependencies, no React. The canvas is transparent while idle, so the
 * halftone print underneath (a normal <img>) is what the visitor sees until they touch it.
 * The render loop only runs while something is revealed or changing.
 */

export interface HalftoneRevealOptions {
  /** The fully loaded image that gets uncovered. Must have the same aspect ratio as the canvas box. */
  image: HTMLImageElement;
  /** Dot pitch in CSS px. */
  cell?: number;
  /** Skip the intro sweep and the soft trail (prefers-reduced-motion). */
  reducedMotion?: boolean;
}

export interface HalftoneReveal {
  resize(): void;
  /** Reveal point in CSS px relative to the canvas. */
  move(x: number, y: number, pointerType: string): void;
  /** Pointer left / lifted: the reveal fades out on its own. */
  release(): void;
  /** Keyboard / reduced-motion path: uncover or re-cover everything. */
  toggleAll(): boolean;
  /** One slow pass across the sheet so people know it can be uncovered. Cancelled by any real input. */
  intro(): void;
  destroy(): void;
}

const TAU = Math.PI * 2;
const DECAY_PER_SECOND = 0.55; // how quickly uncovered dots fade back to the print
const MAX_DPR = 1.75; // keeps the canvas light on phones

const smooth = (v: number) => v * v * (3 - 2 * v);

export function createHalftoneReveal(
  canvas: HTMLCanvasElement,
  { image, cell = 5, reducedMotion = false }: HalftoneRevealOptions
): HalftoneReveal {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { resize() {}, move() {}, release() {}, toggleAll: () => false, intro() {}, destroy() {} };
  }

  let w = 0;
  let h = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let val = new Float32Array(0);
  let raf = 0;
  let last = 0;
  let destroyed = false;

  // pointer state
  let active = false;
  let px = 0;
  let py = 0;
  let hasLast = false;
  let radius = 120;
  let all = false;

  // intro sweep state
  let introStart = -1;
  let introDone = reducedMotion;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    cols = Math.ceil(w / cell);
    rows = Math.ceil(h / cell);
    val = new Float32Array(cols * rows);
    radius = Math.max(70, Math.min(150, w * 0.27));
    ensureLoop();
  }

  function stamp(x: number, y: number) {
    const outer = radius * 1.25;
    const core = radius * 0.5;
    const c0 = Math.max(0, Math.floor((x - outer) / cell));
    const c1 = Math.min(cols - 1, Math.ceil((x + outer) / cell));
    const r0 = Math.max(0, Math.floor((y - outer) / cell));
    const r1 = Math.min(rows - 1, Math.ceil((y + outer) / cell));
    for (let r = r0; r <= r1; r++) {
      const cy = (r + 0.5) * cell;
      for (let c = c0; c <= c1; c++) {
        const cx = (c + 0.5) * cell;
        const d = Math.hypot(cx - x, cy - y);
        if (d >= outer) continue;
        const v = d <= core ? 1 : smooth(1 - (d - core) / (outer - core));
        const i = r * cols + c;
        if (v > val[i]) val[i] = v;
      }
    }
  }

  // Stamp along the segment so a fast swipe leaves a continuous trail, not a string of beads.
  function stampTo(x: number, y: number) {
    if (!hasLast) {
      stamp(x, y);
    } else {
      const dx = x - px;
      const dy = y - py;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / (radius * 0.3)));
      for (let s = 1; s <= steps; s++) stamp(px + (dx * s) / steps, py + (dy * s) / steps);
    }
    px = x;
    py = y;
    hasLast = true;
  }

  function frame(now: number) {
    raf = 0;
    if (destroyed) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;

    // intro sweep: a slow S-curve down the sheet, until real input arrives
    if (!introDone && introStart >= 0) {
      const t = (now - introStart) / 2400;
      if (t >= 1) {
        introDone = true;
        active = false;
        hasLast = false;
      } else {
        const e = smooth(t);
        const x = w * (0.5 + 0.28 * Math.sin(e * Math.PI * 2.2));
        const y = h * (0.12 + 0.76 * e);
        active = true;
        stampTo(x, y);
      }
    }

    if (active && hasLast) stamp(px, py); // holding still keeps the disc open

    let any = false;
    if (all) {
      for (let i = 0; i < val.length; i++) {
        if (val[i] < 1) val[i] = Math.min(1, val[i] + dt * 1.6);
      }
      any = true;
    } else {
      const k = dt * DECAY_PER_SECOND * (reducedMotion ? 3 : 1);
      for (let i = 0; i < val.length; i++) {
        const v = val[i];
        if (v > 0) {
          const n = v - k;
          val[i] = n > 0 ? n : 0;
          any = true;
        }
      }
    }

    draw();

    if (any || active || (!introDone && introStart >= 0)) {
      raf = requestAnimationFrame(frame);
    } else {
      last = 0;
    }
  }

  function draw() {
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.globalCompositeOperation = 'source-over';
    ctx!.clearRect(0, 0, w, h);
    ctx!.fillStyle = '#000';
    ctx!.beginPath();
    let count = 0;
    for (let r = 0; r < rows; r++) {
      const cy = (r + 0.5) * cell;
      for (let c = 0; c < cols; c++) {
        const v = val[r * cols + c];
        if (v < 0.03) continue;
        const cx = (c + 0.5) * cell;
        const rad = cell * 0.78 * v; // 0.78 * cell > half the cell diagonal, so v = 1 is solid
        ctx!.moveTo(cx + rad, cy);
        ctx!.arc(cx, cy, rad, 0, TAU);
        count++;
      }
    }
    if (count === 0) return;
    ctx!.fill();
    // keep the image only where dots were drawn
    ctx!.globalCompositeOperation = 'source-in';
    ctx!.imageSmoothingQuality = 'high';
    ctx!.drawImage(image, 0, 0, w, h);
    ctx!.globalCompositeOperation = 'source-over';
  }

  function ensureLoop() {
    if (!raf && !destroyed) raf = requestAnimationFrame(frame);
  }

  function cancelIntro() {
    if (!introDone) {
      introDone = true;
      introStart = -1;
      hasLast = false;
    }
  }

  resize();

  return {
    resize,
    move(x, y, pointerType) {
      cancelIntro();
      // a finger covers what it is revealing, so lift the reveal point above it
      const lift = pointerType === 'touch' ? Math.min(60, radius * 0.5) : 0;
      active = true;
      stampTo(x, y - lift);
      ensureLoop();
    },
    release() {
      active = false;
      hasLast = false;
      ensureLoop();
    },
    toggleAll() {
      cancelIntro();
      all = !all;
      ensureLoop();
      return all;
    },
    intro() {
      if (reducedMotion || introDone) return;
      introStart = performance.now();
      ensureLoop();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
