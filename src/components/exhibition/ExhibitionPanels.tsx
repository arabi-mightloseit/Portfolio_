import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createHalftoneReveal, HalftoneReveal } from './halftoneEngine';
import { createFisheyeGrid } from './fisheyeEngine';
import { CAMERA_PHOTOS, ExhibitObject, noireArchive, noireHalftone } from './exhibitionData';

/** Where the opened object sits on the board, as % insets of the board (used to grow the panel out of it). */
export interface OriginInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const FULL = 'inset(0% 0% 0% 0% round 0px)';
const insetFrom = (o: OriginInset) =>
  `inset(${o.top.toFixed(2)}% ${o.right.toFixed(2)}% ${o.bottom.toFixed(2)}% ${o.left.toFixed(2)}% round 6px)`;

/**
 * Keeps the page still while a panel is open (no second scroll system, no body lock):
 * wheel / touch moves are swallowed on the panel, `data-lenis-prevent` on the root tells the existing
 * Lenis instance to leave the panel alone, Escape closes, focus goes in and comes back out.
 */
function useModal(rootRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    const swallow = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      const t = e.target;
      const interactive = t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement;
      if (['PageDown', 'PageUp', 'Home', 'End'].includes(e.key) || (e.key === ' ' && !interactive)) e.preventDefault();
    };
    el.addEventListener('wheel', swallow, { passive: false });
    el.addEventListener('touchmove', swallow, { passive: false });
    document.addEventListener('keydown', onKey);
    closeBtn.current?.focus({ preventScroll: true });
    return () => {
      el.removeEventListener('wheel', swallow);
      el.removeEventListener('touchmove', swallow);
      document.removeEventListener('keydown', onKey);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [rootRef]);

  return closeBtn;
}

const CloseButton = React.forwardRef<HTMLButtonElement, { onClose: () => void; light?: boolean; className?: string }>(
  ({ onClose, light, className = '' }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClose}
      aria-label="Close"
      className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#3D5CFF] touch-manipulation ${
        light ? 'text-black/70 hover:bg-black/5' : 'text-[#F1EBDD]/80 hover:bg-white/10'
      } ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <X className="w-5 h-5" />
    </button>
  )
);
CloseButton.displayName = 'CloseButton';

/* ------------------------------------------------------------------------------------------------
 * Full-board shell: grows out of the clicked object, covers the board, keeps the header/baseline.
 * ---------------------------------------------------------------------------------------------- */
const FullShell: React.FC<{
  label: string;
  origin: OriginInset;
  reduced: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ label, origin, reduced, onClose, children }) => {
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useModal(root, onClose);
  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-lenis-prevent
      className="absolute inset-0 z-30 overflow-hidden bg-[#07080D] text-[#F1EBDD]"
      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
      initial={reduced ? { opacity: 0 } : { clipPath: insetFrom(origin) }}
      animate={reduced ? { opacity: 1 } : { clipPath: FULL }}
      exit={reduced ? { opacity: 0 } : { clipPath: insetFrom(origin) }}
      transition={{ duration: reduced ? 0.2 : 0.65, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: reduced ? 0 : 0.32, duration: 0.35 } }}
        exit={{ opacity: 0, transition: { duration: 0.12 } }}
      >
        {children}
      </motion.div>
      {/* z-[400]: the fisheye tiles stack up to z-index ~265 (scale x 100), so the close button must sit above that */}
      <CloseButton ref={closeBtn} onClose={onClose} className="absolute top-2 right-2 z-[400]" />
    </motion.div>
  );
};

/* ------------------------------------------------------------------------------------------------
 * NOIRÉ: the halftone print stays until a cursor / finger uncovers the document beneath it.
 * ---------------------------------------------------------------------------------------------- */
const NoireStory: React.FC<{ reduced: boolean }> = ({ reduced }) => {
  const holder = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<HalftoneReveal | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // fit a 2:3 sheet inside the panel, below the top bar
  useLayoutEffect(() => {
    const el = holder.current;
    if (!el) return;
    const fit = () => {
      const availW = el.clientWidth - 24;
      const availH = el.clientHeight - 8;
      const w = Math.max(0, Math.min(availW, availH * (2 / 3)));
      setSize((s) => (Math.abs(s.w - w) < 1 ? s : { w, h: w * 1.5 }));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // build the engine once the archive image has loaded and the canvas has a size
  useEffect(() => {
    if (!size.w || !canvas.current) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.src = noireArchive;
    const start = () => {
      if (cancelled || !canvas.current) return;
      engine.current?.destroy();
      engine.current = createHalftoneReveal(canvas.current, { image: img, reducedMotion: reduced });
      engine.current.intro();
    };
    if (img.complete && img.naturalWidth) start();
    else img.onload = start;
    return () => {
      cancelled = true;
      engine.current?.destroy();
      engine.current = null;
    };
  }, [size.w > 0, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (size.w) engine.current?.resize();
  }, [size.w]);

  const local = (e: React.PointerEvent) => {
    const r = sheet.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="shrink-0 h-12 flex items-center pl-4 sm:pl-5">
        <span className="font-editorial-serif text-xl sm:text-2xl leading-none">NOIRÉ.</span>
      </div>
      <div ref={holder} className="relative flex-1 min-h-0 flex items-start justify-center pb-2">
        {size.w > 0 && (
          <div
            ref={sheet}
            tabIndex={0}
            role="img"
            aria-label="Atelier Noiré, a foreign market experiment. Confidential archive file 001. Move across the print to uncover it, or press Enter."
            className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#3D5CFF] select-none"
            style={{ width: size.w, height: size.h, touchAction: 'none', cursor: 'crosshair' }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              const p = local(e);
              engine.current?.move(p.x, p.y, e.pointerType);
            }}
            onPointerMove={(e) => {
              if (e.pointerType !== 'mouse' && e.buttons === 0) return;
              const p = local(e);
              engine.current?.move(p.x, p.y, e.pointerType);
            }}
            onPointerUp={() => engine.current?.release()}
            onPointerCancel={() => engine.current?.release()}
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse') engine.current?.release();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                engine.current?.toggleAll();
              }
            }}
          >
            <img
              src={noireHalftone}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full select-none pointer-events-none"
            />
            <canvas ref={canvas} className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------------------------------------
 * CAMERA: fisheye infinite grid of photographs.
 * ---------------------------------------------------------------------------------------------- */
const CameraGallery: React.FC<{ reduced: boolean }> = ({ reduced }) => {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const total = CAMERA_PHOTOS.length || 24;

  useEffect(() => {
    if (!root.current) return;
    const grid = createFisheyeGrid(root.current, {
      urls: CAMERA_PHOTOS,
      placeholderCount: 24,
      reducedMotion: reduced,
      onFocus: (i) => {
        if (counter.current) counter.current.textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      },
    });
    return () => grid.destroy();
  }, [reduced, total]);

  return (
    <div className="absolute inset-0">
      <div
        ref={root}
        tabIndex={0}
        role="group"
        aria-label="Photographs. Drag, scroll or use the arrow keys to move through them."
        className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3D5CFF]"
      />
      {/* lens vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(7,8,13,.85) 100%)' }}
      />
      <span
        ref={counter}
        aria-hidden
        className="absolute left-4 bottom-3 text-[10px] font-editorial-mono tracking-[0.22em] text-[#F1EBDD]/60 pointer-events-none"
      />
      {CAMERA_PHOTOS.length === 0 && (
        <span className="absolute right-4 bottom-3 text-[10px] font-editorial-mono tracking-[0.18em] text-[#F1EBDD]/40 pointer-events-none">
          src/assets/exhibition/camera/ is empty
        </span>
      )}
    </div>
  );
};

export const FullPanel: React.FC<{
  obj: ExhibitObject;
  origin: OriginInset;
  reduced: boolean;
  onClose: () => void;
}> = ({ obj, origin, reduced, onClose }) => (
  <FullShell label={obj.kind === 'noire' ? 'NOIRÉ archive' : 'Photographs'} origin={origin} reduced={reduced} onClose={onClose}>
    {obj.kind === 'noire' ? <NoireStory reduced={reduced} /> : <CameraGallery reduced={reduced} />}
  </FullShell>
);

/* ------------------------------------------------------------------------------------------------
 * Notes: a small paper drawer that slides in beside the object (bottom sheet on phones).
 * ---------------------------------------------------------------------------------------------- */
export const NotePanel: React.FC<{
  obj: ExhibitObject;
  side: 'left' | 'right';
  isMobile: boolean;
  reduced: boolean;
  onClose: () => void;
}> = ({ obj, side, isMobile, reduced, onClose }) => {
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useModal(root, onClose);
  const dir = side === 'right' ? 1 : -1;
  const hidden = reduced
    ? { opacity: 0 }
    : isMobile
      ? { opacity: 0, y: 56, rotate: 0.6 * dir }
      : { opacity: 0, x: 56 * dir, rotate: 3 * dir };
  const shown = reduced
    ? { opacity: 1 }
    : { opacity: 1, x: 0, y: 0, rotate: isMobile ? 0 : -0.8 * dir };

  const stop = useCallback(() => onClose(), [onClose]);

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={obj.name}
      data-lenis-prevent
      className={`absolute inset-0 z-30 flex p-3 sm:p-6 ${
        isMobile ? 'items-end justify-center' : `items-center ${side === 'right' ? 'justify-end' : 'justify-start'}`
      }`}
      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, delay: 0.08 } }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 bg-[#06070A]/60" onClick={stop} />
      <motion.div
        className="relative w-full sm:w-[min(26rem,46%)] bg-[#F1EBDD] text-[#06070A] rounded-[2px] px-6 pt-9 pb-7 sm:px-8 sm:pt-11 sm:pb-9 shadow-[0_28px_60px_-22px_rgba(0,0,0,.85)]"
        initial={hidden}
        animate={shown}
        exit={hidden}
        transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 190, damping: 20, mass: 0.9 }}
      >
        {/* pin */}
        <span
          aria-hidden
          className="absolute left-1/2 top-3 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #EEF1FF 0 12%, #8A9BFF 32%, #3D5CFF 62%, #1B2A8A 100%)',
            boxShadow: '0 2px 3px rgba(0,0,0,.45)',
          }}
        />
        <CloseButton ref={closeBtn} onClose={onClose} light className="absolute top-1 right-1" />
        <p className="font-editorial-serif text-[1.65rem] sm:text-[2rem] leading-[1.12]">
          {obj.copy?.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </p>
        {obj.link && (
          <a
            href={obj.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 text-[11px] font-editorial-mono tracking-[0.16em] opacity-55 hover:opacity-100 underline underline-offset-4 decoration-black/30 outline-none focus-visible:ring-2 focus-visible:ring-[#3D5CFF] transition-opacity"
          >
            {obj.link.label}
          </a>
        )}
      </motion.div>
    </motion.div>
  );
};
