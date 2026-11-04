import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { Sparkles } from 'lucide-react';
import {
  ALL_PINNED_AT,
  ExhibitObject,
  OBJECTS,
  PinLayout,
  STAGE_DESK,
  STAGE_MOB,
  arrivalWindow,
} from './exhibitionData';
import { FullPanel, NotePanel, OriginInset } from './ExhibitionPanels';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
// small overshoot: used for the rotation and the scale only, never for the position
const easeOutBack = (t: number) => {
  const c1 = 0.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* ------------------------------------------------------------------------------------------------
 * One pinned sticker. The arrival is driven by scroll progress (motion values only, no re-render);
 * hover is a separate layer so the two never fight over the same transform.
 * ---------------------------------------------------------------------------------------------- */
interface PinnedObjectProps {
  obj: ExhibitObject;
  layout: PinLayout;
  index: number;
  progress: MotionValue<number>;
  reduced: boolean;
  onOpen: (obj: ExhibitObject, trigger: HTMLButtonElement) => void;
}

const PinnedObject: React.FC<PinnedObjectProps> = ({ obj, layout, index, progress, reduced, onOpen }) => {
  const [s, e] = arrivalWindow(index);
  const [hovered, setHovered] = useState(false);
  const [arrived, setArrived] = useState(false);

  const t = useTransform(progress, (v) => clamp01((v - s) / (e - s)));
  useMotionValueEvent(t, 'change', (v) => setArrived(v >= 0.97));
  useEffect(() => setArrived(t.get() >= 0.97), [t]);

  const { from, rot } = layout;
  const x = useTransform(t, (v) => `${(from.x * (1 - easeOutCubic(v))).toFixed(2)}%`);
  const y = useTransform(t, (v) => `${(from.y * (1 - easeOutCubic(v))).toFixed(2)}%`);
  const rotate = useTransform(t, (v) => rot + from.rot * (1 - easeOutBack(v)));
  const scale = useTransform(
    t,
    (v) => 1 + 0.14 * (1 - easeOutBack(v)) - 0.012 * Math.sin(Math.PI * clamp01((v - 0.8) / 0.2))
  );
  const opacity = useTransform(t, [0, 0.12], [0, 1]);

  // shadow depth: far and soft while the sticker is held above the board, tight once it is pinned
  const shY = useTransform(t, (v) => 4 + 26 * (1 - easeOutCubic(v)));
  const shScale = useTransform(t, (v) => 1 + 0.08 * (1 - easeOutCubic(v)));
  const shOpacity = useTransform(t, (v) => 0.4 + 0.25 * easeOutCubic(v));

  // pin: appears and presses in at the end of the arrival
  const pinOpacity = useTransform(t, [0.74, 0.82], [0, 1]);
  const pinScale = useTransform(t, [0.74, 1], [2.3, 1]);
  const pinY = useTransform(t, [0.74, 1], [-12, 0]);

  const [hx0, hy0, hx1, hy1] = obj.hit;
  const inset = 0.06; // click target sits slightly inside the silhouette so neighbours never steal taps
  const hitL = hx0 + (hx1 - hx0) * inset;
  const hitT = hy0 + (hy1 - hy0) * inset;
  const hitR = hx1 - (hx1 - hx0) * inset;
  const hitB = hy1 - (hy1 - hy0) * inset;

  const liftVariants = reduced
    ? { rest: { y: 0, scale: 1, rotate: 0 }, hover: { y: 0, scale: 1, rotate: 0 } }
    : {
        rest: { y: 0, scale: 1, rotate: 0 },
        hover: { y: -6, scale: 1.035, rotate: -rot * 0.4 },
      };
  const shadowVariants = reduced
    ? { rest: { y: 0, scale: 1, opacity: 0.85 }, hover: { y: 0, scale: 1, opacity: 0.85 } }
    : { rest: { y: 0, scale: 1, opacity: 0.85 }, hover: { y: 10, scale: 1.04, opacity: 1 } };

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${layout.left}%`,
        top: `${layout.top}%`,
        width: `${layout.width}%`,
        aspectRatio: `${obj.w} / ${obj.h}`,
        zIndex: index + 1,
        x,
        y,
        rotate,
        scale,
        opacity,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    >
      {/* shadow (transform + opacity only) */}
      <motion.div className="absolute inset-0" style={{ y: shY, scale: shScale, opacity: shOpacity }}>
        <motion.img
          src={obj.src}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full select-none"
          style={{ filter: 'brightness(0) blur(5px)' }}
          variants={shadowVariants}
          animate={hovered ? 'hover' : 'rest'}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        />
      </motion.div>

      {/* sticker + pin */}
      <motion.div
        className="absolute inset-0"
        variants={liftVariants}
        animate={hovered ? 'hover' : 'rest'}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <img src={obj.src} alt="" draggable={false} className="absolute inset-0 w-full h-full select-none" />
        <motion.span
          aria-hidden
          className="absolute w-[2.4%] min-w-[9px] aspect-square rounded-full"
          style={{
            left: `${obj.pin[0] * 100}%`,
            top: `${obj.pin[1] * 100}%`,
            marginLeft: '-1.2%',
            marginTop: '-1.2%',
            opacity: pinOpacity,
            scale: pinScale,
            y: pinY,
            background: 'radial-gradient(circle at 35% 30%, #EEF1FF 0 12%, #8A9BFF 32%, #3D5CFF 62%, #1B2A8A 100%)',
            boxShadow: '0 2px 3px rgba(0,0,0,.55), 0 0 0 1px rgba(0,0,0,.35)',
          }}
        />
      </motion.div>

      {/* click / tap target: the visible silhouette only */}
      <button
        type="button"
        aria-label={`Open ${obj.name}`}
        disabled={!arrived}
        onClick={(ev) => onOpen(obj, ev.currentTarget)}
        onPointerEnter={(ev) => ev.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={(ev) => ev.currentTarget.matches(':focus-visible') && setHovered(true)}
        onBlur={() => setHovered(false)}
        className="absolute rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#3D5CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F16] enabled:cursor-pointer touch-manipulation"
        style={{
          left: `${hitL * 100}%`,
          top: `${hitT * 100}%`,
          width: `${(hitR - hitL) * 100}%`,
          height: `${(hitB - hitT) * 100}%`,
          pointerEvents: 'auto',
          WebkitTapHighlightColor: 'transparent',
        }}
      />
    </motion.div>
  );
};

/* ------------------------------------------------------------------------------------------------
 * EXHIBITION ROOM 01 // SELECTED WORKS
 * A tall scroll area with a sticky board. Scroll progress pins the six objects one by one; when the
 * last one is pinned the board simply scrolls away with the page. Nothing here captures scroll.
 * ---------------------------------------------------------------------------------------------- */
export const ExhibitionRoom01: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const reduced = !!useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // same pattern as the hero: framer-motion's useScroll reads the existing (Lenis-driven) page scroll
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ['start start', 'end end'] });
  const done = useMotionValue(1);
  const progress = reduced ? done : scrollYProgress;

  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((b) => (Math.abs(b.w - width) < 1 && Math.abs(b.h - height) < 1 ? b : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stageSpec = isMobile ? STAGE_MOB : STAGE_DESK;
  const aspect = stageSpec.w / stageSpec.h;
  const pad = isMobile ? 10 : 18;
  const availW = Math.max(0, box.w - pad * 2);
  const availH = Math.max(0, box.h - pad * 2);
  const stageW = Math.min(availW, availH * aspect);
  const stageH = stageW / aspect;

  const [allPinned, setAllPinned] = useState(reduced);
  useMotionValueEvent(progress, 'change', (v) => setAllPinned(v >= ALL_PINNED_AT));

  const count = useTransform(progress, (v) => {
    let n = 0;
    for (let i = 0; i < OBJECTS.length; i++) if (v >= arrivalWindow(i)[1] - 0.004) n++;
    return String(n).padStart(2, '0');
  });

  // restrained parallax: the board texture drifts a few px against the page
  const textureY = useTransform(progress, [0, 1], [-10, 10]);

  const [open, setOpen] = useState<{ id: string; origin: OriginInset } | null>(null);
  const handleOpen = useCallback((obj: ExhibitObject, trigger: HTMLButtonElement) => {
    const board = boardRef.current;
    if (!board) return;
    const b = board.getBoundingClientRect();
    const r = trigger.getBoundingClientRect();
    setOpen({
      id: obj.id,
      origin: {
        top: Math.max(0, ((r.top - b.top) / b.height) * 100),
        left: Math.max(0, ((r.left - b.left) / b.width) * 100),
        right: Math.max(0, ((b.right - r.right) / b.width) * 100),
        bottom: Math.max(0, ((b.bottom - r.bottom) / b.height) * 100),
      },
    });
  }, []);
  const handleClose = useCallback(() => setOpen(null), []);

  const openObj = open ? OBJECTS.find((o) => o.id === open.id) ?? null : null;
  const noteSide: 'left' | 'right' = (() => {
    if (!openObj) return 'right';
    const l = openObj.desk;
    const cx = l.left + l.width * ((openObj.hit[0] + openObj.hit[2]) / 2);
    return cx < 50 ? 'right' : 'left';
  })();

  const blueText = 'text-[#3D5CFF]';

  return (
    <div ref={wrapperRef} className={reduced ? '' : isMobile ? 'h-[330vh]' : 'h-[360vh]'}>
      <div
        className={`flex flex-col ${
          reduced ? 'h-[calc(100svh-3.5rem)]' : 'sticky top-14 md:top-16 h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)]'
        }`}
      >
        {/* header: same divider treatment as before, with a live pin count */}
        <div
          className={`shrink-0 border-b pb-3 md:pb-4 flex items-center justify-between gap-3 text-[9px] tracking-[0.14em] sm:text-xs sm:tracking-[0.22em] font-editorial-mono uppercase opacity-80 ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${blueText}`} />
            <span className="font-bold truncate">EXHIBITION ROOM 01 // SELECTED WORKS</span>
          </div>
          <span className={`shrink-0 tabular-nums ${blueText}`}>
            <motion.span>{count}</motion.span> / {String(OBJECTS.length).padStart(2, '0')}
          </span>
        </div>

        {/* the board */}
        <div
          ref={boardRef}
          className={`relative flex-1 min-h-0 mt-3 md:mt-4 overflow-hidden rounded-sm border ${
            isDark ? 'bg-[#0D0F16] border-white/10' : 'bg-[#11131A] border-black/25 shadow-[0_22px_44px_-28px_rgba(0,0,0,.65)]'
          }`}
        >
          {/* board surface: fine noise, a faint working grid, soft light from above */}
          <motion.div
            aria-hidden
            className="absolute -inset-4 pointer-events-none"
            style={{
              y: textureY,
              backgroundImage: `linear-gradient(rgba(61,92,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(61,92,255,.07) 1px, transparent 1px), ${NOISE}`,
              backgroundSize: '36px 36px, 36px 36px, 180px 180px',
              opacity: 0.7,
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(241,235,221,.06), transparent 70%), radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.45) 100%)',
            }}
          />

          {box.w > 0 && (
            <div
              className="absolute"
              style={{ width: stageW, height: stageH, left: (box.w - stageW) / 2, top: (box.h - stageH) / 2 }}
            >
              {OBJECTS.map((obj, i) => (
                <PinnedObject
                  key={obj.id}
                  obj={obj}
                  layout={isMobile ? obj.mob : obj.desk}
                  index={i}
                  progress={progress}
                  reduced={reduced}
                  onOpen={handleOpen}
                />
              ))}
            </div>
          )}

          <AnimatePresence>
            {open && openObj && (openObj.kind === 'note' ? (
              <NotePanel
                key={openObj.id}
                obj={openObj}
                side={noteSide}
                isMobile={isMobile}
                reduced={reduced}
                onClose={handleClose}
              />
            ) : (
              <FullPanel key={openObj.id} obj={openObj} origin={open.origin} reduced={reduced} onClose={handleClose} />
            ))}
          </AnimatePresence>
        </div>

        <div
          className={`shrink-0 pt-3 pb-2 flex items-center justify-between text-[10px] font-editorial-mono tracking-[0.22em] uppercase opacity-60 ${
            isDark ? 'text-[#F1EBDD]' : 'text-[#06070A]'
          }`}
        >
          <span>{allPinned ? 'Open any object' : 'Scroll'}</span>
        </div>
      </div>
    </div>
  );
};
