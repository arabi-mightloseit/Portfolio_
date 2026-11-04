/**
 * Fisheye infinite grid engine (Exhibition Room 01 / CAMERA).
 *
 * The pattern: an endless grid of photographs that wraps in every direction, seen through a lens
 * fixed at the centre of the view. Tiles at the centre are magnified, tiles toward the edge shrink
 * and bend away (r' = R(k+1)(r/R) / (k(r/R)+1)). Drag, wheel / trackpad, touch and arrow keys move
 * the grid under the lens; it settles with the nearest photograph in the lens. A tap on a photo
 * brings it to the centre.
 *
 * Plain DOM + CSS transforms on a small fixed pool of tiles (about 48), so it stays light on phones.
 * The loop only runs while the grid is moving. No WebGL, no dependencies, no React.
 */

export interface FisheyeOptions {
  /** Photo URLs. When empty, numbered placeholder frames are shown instead. */
  urls: string[];
  /** How many placeholder frames to cycle through when `urls` is empty. */
  placeholderCount?: number;
  reducedMotion?: boolean;
  /** Called with the index (0-based) of the photograph currently in the lens. */
  onFocus?: (index: number) => void;
}

export interface FisheyeGrid {
  destroy(): void;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// deterministic 0..1 hash of a grid coordinate (used for tile proportions only)
function hash2(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

interface Slot {
  el: HTMLDivElement;
  img: HTMLImageElement | null;
  label: HTMLSpanElement | null;
  a: number;
  b: number;
  ix: number;
  iy: number;
  photo: number;
  shape: number;
  vx: number; // last virtual offset from the lens centre (for tap-to-centre)
  vy: number;
}

export function createFisheyeGrid(root: HTMLElement, opts: FisheyeOptions): FisheyeGrid {
  const urls = opts.urls;
  const count = urls.length > 0 ? urls.length : Math.max(1, opts.placeholderCount ?? 24);
  const reduced = !!opts.reducedMotion;

  // ---- geometry ---------------------------------------------------------------------------
  let W = 0;
  let H = 0;
  let R = 1; // lens radius = half the diagonal
  let S = 180; // virtual spacing between tile centres
  let K = 1.6; // lens strength
  let C = 0; // pool columns
  let Rw = 0; // pool rows
  let span = { x: 1, y: 1 };

  // ---- motion state -----------------------------------------------------------------------
  let ox = 0; // current pan (virtual px)
  let oy = 0;
  let tx = 0; // target pan
  let ty = 0;
  let raf = 0;
  let last = 0;
  let lastInput = 0;
  let dragging = false;
  let destroyed = false;
  let lastFocus = -1;

  const stage = document.createElement('div');
  stage.style.cssText = 'position:absolute;inset:0;user-select:none;-webkit-user-select:none;';
  root.appendChild(stage);
  let slots: Slot[] = [];

  const photoAt = (ix: number, iy: number) => {
    if (count <= 1) return 0;
    const a = 7 % count || 1;
    const b = 11 % count || 2 % count || 1;
    return mod(ix * a + iy * b, count);
  };

  function buildPool() {
    stage.textContent = '';
    slots = [];
    C = Math.ceil(W / S) + 3;
    Rw = Math.ceil(H / S) + 3;
    span = { x: C * S, y: Rw * S };
    for (let b = 0; b < Rw; b++) {
      for (let a = 0; a < C; a++) {
        const el = document.createElement('div');
        el.className = 'fx-tile';
        el.style.cssText =
          'position:absolute;left:0;top:0;overflow:hidden;will-change:transform;visibility:hidden;' +
          'background:#12141c;box-shadow:0 0 0 1px rgba(241,235,221,.08);backface-visibility:hidden;';
        const slot: Slot = { el, img: null, label: null, a, b, ix: 1e9, iy: 1e9, photo: -1, shape: -1, vx: 0, vy: 0 };
        if (urls.length > 0) {
          const img = document.createElement('img');
          img.decoding = 'async';
          img.draggable = false;
          img.alt = '';
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;user-select:none;';
          el.appendChild(img);
          slot.img = img;
        } else {
          el.style.background =
            'repeating-linear-gradient(135deg, rgba(241,235,221,.05) 0 2px, transparent 2px 7px), #12141c';
          const label = document.createElement('span');
          label.style.cssText =
            "position:absolute;left:8px;bottom:6px;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.14em;color:rgba(241,235,221,.55);";
          el.appendChild(label);
          slot.label = label;
        }
        stage.appendChild(el);
        slots.push(slot);
      }
    }
  }

  function measure() {
    W = root.clientWidth;
    H = root.clientHeight;
    if (!W || !H) return;
    R = Math.hypot(W, H) / 2;
    const small = Math.min(W, H) < 520;
    S = small ? 124 : 186;
    K = small ? 1.45 : 1.65;
    buildPool();
    kick();
  }

  // ---- render -----------------------------------------------------------------------------
  function render() {
    const cx = W / 2;
    const cy = H / 2;
    for (const s of slots) {
      const vx = mod(s.a * S - ox + span.x / 2, span.x) - span.x / 2;
      const vy = mod(s.b * S - oy + span.y / 2, span.y) - span.y / 2;
      s.vx = vx;
      s.vy = vy;
      const r = Math.hypot(vx, vy);
      if (r >= R * 0.995) {
        if (s.el.style.visibility !== 'hidden') s.el.style.visibility = 'hidden';
        continue;
      }
      // absolute tile coordinate (columns / rows travelled past the wrap)
      const kx = Math.round((s.a * S - ox - vx) / span.x);
      const ky = Math.round((s.b * S - oy - vy) / span.y);
      const ix = s.a - kx * C;
      const iy = s.b - ky * Rw;
      if (ix !== s.ix || iy !== s.iy) {
        s.ix = ix;
        s.iy = iy;
        const photo = photoAt(ix, iy);
        const shape = Math.floor(hash2(ix, iy) * 3); // 0 portrait, 1 landscape, 2 square
        if (shape !== s.shape) {
          s.shape = shape;
          const tw = shape === 0 ? 0.78 : shape === 1 ? 0.96 : 0.86;
          const th = shape === 0 ? 0.96 : shape === 1 ? 0.74 : 0.86;
          s.el.style.width = `${Math.round(S * tw)}px`;
          s.el.style.height = `${Math.round(S * th)}px`;
        }
        if (photo !== s.photo) {
          s.photo = photo;
          if (s.img) s.img.src = urls[photo];
          if (s.label) s.label.textContent = String(photo + 1).padStart(2, '0');
        }
      }
      const d = r / R;
      const rp = (R * (K + 1) * d) / (K * d + 1);
      const f = r > 0.001 ? rp / r : K + 1;
      // radial stretch is the derivative of the lens curve, tangential stretch is rp / r; their geometric mean keeps the wall dense
      const radial = (K + 1) / ((K * d + 1) * (K * d + 1));
      const scale = Math.sqrt(f * radial);
      const w = s.el.offsetWidth || S * 0.8;
      const h = s.el.offsetHeight || S * 0.8;
      const x = cx + vx * f - w / 2;
      const y = cy + vy * f - h / 2;
      s.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${scale.toFixed(3)})`;
      s.el.style.zIndex = String(Math.round(scale * 100));
      s.el.style.opacity = String(clamp((1 - d) * 3.4, 0, 1).toFixed(2));
      if (s.el.style.visibility !== 'visible') s.el.style.visibility = 'visible';
    }
    // which photograph is in the lens
    if (opts.onFocus) {
      const ix = Math.round(ox / S);
      const iy = Math.round(oy / S);
      const p = photoAt(ix, iy);
      if (p !== lastFocus) {
        lastFocus = p;
        opts.onFocus(p);
      }
    }
  }

  function frame(now: number) {
    raf = 0;
    if (destroyed) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;

    // settle on the nearest tile once input has been quiet for a moment
    if (!dragging && now - lastInput > 140) {
      const sx = Math.round(tx / S) * S;
      const sy = Math.round(ty / S) * S;
      if (sx !== tx || sy !== ty) {
        tx = sx;
        ty = sy;
      }
    }

    const ease = reduced ? 1 : 1 - Math.exp(-dt * (dragging ? 22 : 9));
    ox += (tx - ox) * ease;
    oy += (ty - oy) * ease;

    render();

    const moving = Math.abs(tx - ox) > 0.08 || Math.abs(ty - oy) > 0.08;
    if (moving || dragging || now - lastInput <= 160) {
      raf = requestAnimationFrame(frame);
    } else {
      ox = tx;
      oy = ty;
      render();
      last = 0;
    }
  }

  function kick() {
    if (!raf && !destroyed) raf = requestAnimationFrame(frame);
  }

  // ---- input ------------------------------------------------------------------------------
  const PAN = 0.5; // virtual px moved per screen px dragged (the lens magnifies the centre)
  let pid = -1;
  let sx0 = 0;
  let sy0 = 0;
  let lx = 0;
  let ly = 0;
  let lt = 0;
  let vxs = 0;
  let vys = 0;
  let moved = 0;
  let downT = 0;
  let downTarget: EventTarget | null = null;

  function onDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pid = e.pointerId;
    dragging = true;
    moved = 0;
    sx0 = lx = e.clientX;
    sy0 = ly = e.clientY;
    lt = performance.now();
    downT = lt;
    vxs = vys = 0;
    downTarget = e.target;
    lastInput = lt;
    try {
      root.setPointerCapture(pid);
    } catch {
      /* element may already be gone */
    }
    root.style.cursor = 'grabbing';
    kick();
  }

  function onMove(e: PointerEvent) {
    if (!dragging || e.pointerId !== pid) return;
    const now = performance.now();
    const dx = e.clientX - lx;
    const dy = e.clientY - ly;
    moved = Math.max(moved, Math.hypot(e.clientX - sx0, e.clientY - sy0));
    tx -= dx * PAN;
    ty -= dy * PAN;
    const dtm = Math.max(1, now - lt);
    vxs = 0.8 * vxs + 0.2 * ((-dx * PAN) / dtm);
    vys = 0.8 * vys + 0.2 * ((-dy * PAN) / dtm);
    lx = e.clientX;
    ly = e.clientY;
    lt = now;
    lastInput = now;
    kick();
  }

  function onUp(e: PointerEvent) {
    if (!dragging || e.pointerId !== pid) return;
    dragging = false;
    root.style.cursor = 'grab';
    try {
      root.releasePointerCapture(pid);
    } catch {
      /* already released */
    }
    const now = performance.now();
    // tap: bring that photograph to the lens
    if (moved < 6 && now - downT < 400 && downTarget instanceof Node) {
      const tile = (downTarget as HTMLElement).closest?.('.fx-tile');
      const slot = slots.find((s) => s.el === tile);
      if (slot) {
        tx = ox + slot.vx;
        ty = oy + slot.vy;
      }
    } else if (!reduced && now - lt < 90) {
      // fling
      tx += vxs * 260;
      ty += vys * 260;
    }
    lastInput = now;
    kick();
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : 1;
    tx += e.deltaX * unit * 0.6;
    ty += e.deltaY * unit * 0.6;
    lastInput = performance.now();
    kick();
  }

  function onKey(e: KeyboardEvent) {
    const step = S;
    if (e.key === 'ArrowLeft') tx -= step;
    else if (e.key === 'ArrowRight') tx += step;
    else if (e.key === 'ArrowUp') ty -= step;
    else if (e.key === 'ArrowDown') ty += step;
    else return;
    e.preventDefault();
    lastInput = performance.now();
    kick();
  }

  root.style.touchAction = 'none';
  root.style.cursor = 'grab';
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  root.addEventListener('wheel', onWheel, { passive: false });
  root.addEventListener('keydown', onKey);

  const ro = new ResizeObserver(() => measure());
  ro.observe(root);
  measure();

  return {
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('keydown', onKey);
      stage.remove();
    },
  };
}
