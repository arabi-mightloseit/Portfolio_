import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, MotionValue } from 'framer-motion';
import artisticHeroPhoto from '../assets/images/1790870264368__1_.jpg';
import signaturePng from '../assets/images/20260117_020006-removebg-preview.png';
import { ThemeMode } from '../types';
import { Clock, ArrowUpRight, Sliders, ExternalLink } from 'lucide-react';
import { playDarkAmbient } from '../utils/audio';
import { WhyAmIBetterSection } from './WhyAmIBetterSection';
import { ExhibitionRoom01 } from './exhibition/ExhibitionRoom01';
import { ContactEmblems } from './ContactEmblems';

interface ArtisticSectionWProps {
  theme: ThemeMode;
  bdTime: string;
}

// Pen path of the hero signature, in the same 386 x 309 space as the PNG.
// The PNG is a flat image and carries no stroke order, so the real pen sequence is not recoverable.
// These centre-lines were traced from the ink itself, then ordered the way a hand would plausibly
// sign it: start top-left, move left-to-right and top-to-bottom, continuous where the lines connect,
// small details last. Each stroke owns a slice of hero `progress` proportional to its length, one
// after another, all finished before the existing completion snap (0.965 -> 0.98).
const SIGNATURE_PEN_WIDTH = 14; // ink is ~8.5 wide; the extra covers the soft edge
const SIGNATURE_STROKES: ReadonlyArray<{ from: number; to: number; d: string }> = [
  { from: 0.05, to: 0.185, d: 'M 23.9 73.1 L 37.4 71.1 L 93.6 71.1 L 131.1 73.6 L 134.1 70.1 L 131.1 73.6 L 129.4 72.9 L 130.9 73.9 L 129.1 84.1 L 121.6 98.6 L 120.1 107.1 L 115.6 109.4 L 111.1 123.4 L 105.4 135.9 L 102.4 138.9 L 105.1 144.4 L 102.4 139.6 L 104.6 136.6 L 102.4 138.9 L 95.6 136.6 L 83.4 126.4 L 67.6 117.4 L 64.4 109.9' }, // 1. top line, corner knob, left flag
  { from: 0.187, to: 0.473, d: 'M 50.4 108.1 L 64.1 110.1 L 67.4 107.9 L 114.9 108.1 L 115.9 109.1 L 120.6 107.4 L 169.9 109.4 L 172.9 110.9 L 178.4 109.6 L 187.9 111.1 L 266.1 111.4 L 275.6 75.4 L 279.9 49.6 L 274.9 46.9 L 262.4 45.6 L 211.1 46.6 L 206.6 48.6 L 198.1 60.9 L 188.4 79.1 L 179.6 101.1 L 178.4 109.4 L 173.1 111.1 L 171.9 118.4 L 161.1 145.1 L 158.1 160.4 L 154.1 161.1 L 151.9 159.6 L 154.1 161.1 L 151.6 173.9 L 147.6 178.6 L 146.1 178.1 L 147.4 178.9 L 149.1 186.9 L 147.4 178.9 L 139.1 174.4 L 135.4 168.9 L 133.4 162.6' }, // 2. long horizontal, frame, long diagonal
  { from: 0.474, to: 0.516, d: 'M 126.6 158.1 L 132.4 160.1 L 133.9 159.1 L 151.9 159.6 L 154.1 161.1 L 178.6 162.9 L 183.6 169.1 L 191.6 184.4 L 194.6 186.6' }, // 3. mid-left bar and tick
  { from: 0.523, to: 0.556, d: 'M 207.1 138.6 L 259.4 137.1 L 262.1 138.9 L 271.9 137.1' }, // 4. mid-right upper bar
  { from: 0.558, to: 0.614, d: 'M 258.9 137.1 L 261.4 139.4 L 258.1 146.4 L 251.9 153.1 L 249.9 160.4 L 242.9 163.6 L 240.6 162.6 L 242.9 163.9 L 239.1 173.9 L 233.4 181.4 L 227.6 183.9 L 226.1 183.1 L 229.4 189.6 L 227.6 184.1 L 223.1 181.6 L 217.1 173.4 L 214.6 165.1 L 213.1 164.4' }, // 5. mid-right diagonal and small loop
  { from: 0.615, to: 0.806, d: 'M 205.4 163.4 L 214.1 164.9 L 223.4 162.6 L 241.4 162.6 L 242.9 163.6 L 249.9 160.1 L 251.6 162.1 L 259.6 162.6 L 282.9 160.9 L 294.1 162.4 L 299.9 159.9 L 293.1 162.6 L 290.6 170.4 L 255.6 209.6 L 252.9 217.9 L 242.1 220.9 L 239.6 219.6 L 241.6 221.4 L 239.1 229.4 L 202.9 275.1 L 196.4 279.1 L 193.9 278.4 L 196.1 279.4 L 195.9 281.9 L 195.9 279.1 L 190.9 277.4 L 170.9 264.1 L 149.1 242.9 L 130.1 229.1 L 126.4 221.6 L 127.6 220.1' }, // 6. mid-right bar, long diagonal, lower flag
  { from: 0.808, to: 0.927, d: 'M 109.1 218.6 L 126.1 221.4 L 128.9 219.4 L 239.6 219.6 L 242.1 220.9 L 252.9 217.9 L 253.4 216.4 L 254.6 219.1 L 262.1 219.1 L 297.9 214.6 L 329.4 213.6 L 330.6 217.6' }, // 7. lower horizontal
  { from: 0.929, to: 0.96, d: 'M 331.6 199.4 L 348.1 201.6 L 351.9 204.1 L 353.1 207.9 L 355.6 208.1 L 352.9 208.1 L 351.6 211.9 L 341.1 223.4 L 337.9 230.1 L 335.9 230.9' }, // 8. hook
];

// One pen movement. It draws itself along its own path as `progress` travels from `from` to `to`
// and un-draws on the way back. Driven only by motion values, so scrolling causes no React re-render.
const SignatureStroke: React.FC<{
  d: string;
  progress: MotionValue<number>;
  from: number;
  to: number;
}> = ({ d, progress, from, to }) => {
  const drawn = useTransform(progress, [from, to], [0, 1], { clamp: true });
  // A zero-length dash with a round cap still paints a dot, so a stroke stays hidden until the pen reaches it.
  const penDown = useTransform(drawn, (v) => (v > 0 ? 1 : 0));
  return (
    <motion.path
      d={d}
      style={{ pathLength: drawn, opacity: penDown }}
      stroke="white"
      strokeWidth={SIGNATURE_PEN_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
};

// Hero wordmark ("ARABI®" with "sifat siddique" above it). It is laid out in the hero photograph's own
// pixel space (922 x 1152), so it stays locked to the 3 x 3 grid baked into the photograph at every
// hero width. It is anchored to the BOTTOM-LEFT corner of the MIDDLE grid cell: that cell's left line
// is at x = 293 and its bottom line at y = 769.
const WORDMARK_FONT = "'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', sans-serif";
const WORDMARK_X = 298; // just inside the middle cell's left line
const WORDMARK_BASELINE = 765; // just above the middle cell's bottom line
const WORDMARK_SIZE = 66;
const CAPTION_BASELINE = 709; // just above the cap height of ARABI, so the two almost touch
const CAPTION_SIZE = 24;

// HERO SCROLL TIMELINE. The scroll gate drives one hero `progress` (0 -> 1) in two consecutive phases:
//   1. 0 -> HERO_SHRINK_END : the photograph starts enlarged to fill the hero, then shrinks back to its
//      original size while it blurs and the wordmark fades out. No signature ink is drawn yet.
//   2. HERO_SHRINK_END -> 1 : the signature draws itself, exactly as it always has.
// The signature keeps its own 0 -> 1 clock (`signatureProgress`, which starts at SIGNATURE_ORIGIN), so its
// strokes, timings and size are untouched. Its first stroke begins at signature progress 0.05, and that
// lands exactly on HERO_SHRINK_END: ink starts the instant the photo is back to its original size.
// The scroll gate was lengthened (240vh/260vh -> 303vh/332vh) to match, which keeps the signature's
// scroll distance identical to before (140vh / 160vh). If you change one of these, change them together.
const HERO_SHRINK_END = 10 / 29;
const SIGNATURE_ORIGIN = 9 / 29; // = (HERO_SHRINK_END - 0.05) / (1 - 0.05)

export const ArtisticSectionW: React.FC<ArtisticSectionWProps> = ({
  theme,
  bdTime,
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const isDark = theme === 'noir';

  // 60% black / 30% off-white / 10% electric blue (#3D5CFF)
  const electricBlueText = 'text-[#3D5CFF]';

  // Outer scroll-gate container ref (tall scroll distance creating the animation timeline)
  const scrollGateRef = useRef<HTMLDivElement>(null);

  // Framer Motion useScroll connected directly to the scroll gate
  // Preserves Lenis smooth scrolling without creating a competing listener
  const { scrollYProgress } = useScroll({
    target: scrollGateRef,
    offset: ['start start', 'end end'],
  });

  // Dedicated progress clamped cleanly between 0 and 1
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1], {
    clamp: true,
  });

  // Hero photograph blur: starts at 0px blur (completely sharp),
  // progressively increases to 12px blur while the photo shrinks back to its original size
  // (HERO_SHRINK_END), then holds, and reverses continuously on scroll up
  const photoBlur = useTransform(progress, [0, HERO_SHRINK_END], [0, 12], {
    clamp: true,
  });
  const filterBlur = useMotionTemplate`blur(${photoBlur}px)`;

  // The signature's own 0 -> 1 clock. It stays at 0 while the hero photo shrinks, then runs exactly as
  // the whole hero `progress` used to. The strokes and the completion snap read this, not `progress`.
  const signatureProgress = useTransform(progress, [SIGNATURE_ORIGIN, 1], [0, 1], {
    clamp: true,
  });

  // Decisive completion snap at signature progress >= 0.98:
  // Snaps cleanly to 100% complete state with zero partially drawn stroke artifacts
  const snapCompletion = useTransform(signatureProgress, [0.965, 0.98], [0, 1], {
    clamp: true,
  });

  // Micro telemetry readout for current progress
  const progressPercent = useTransform(progress, (v) => Math.round(v * 100));

  // Hero wordmark yields to the signature: fully visible while the hero is still, fades away smoothly
  // over the first 60% of the shrink, and is long gone before the pen starts. Fully reversible on scroll up.
  const wordmarkOpacity = useTransform(progress, [0, HERO_SHRINK_END * 0.6], [1, 0], { clamp: true });

  // HERO FIT. The photograph opens enlarged to fill the hero area (the space between the two baseline
  // bars) and shrinks to its original size as the page scrolls. It is a pure transform on the photo
  // wrapper: layout is untouched, the wordmark (which lives in the photo's own pixel space) scales with
  // it and stays locked to the middle grid cell, and from HERO_SHRINK_END on the transform is exactly
  // identity, so the signature draws at its original size. The enlarged scale/offset are measured, so
  // they follow the viewport (and the photo once it has loaded).
  const heroAreaRef = useRef<HTMLDivElement>(null);
  const heroFrameRef = useRef<HTMLDivElement>(null);
  const heroFitScale = useMotionValue(1);
  const heroFitX = useMotionValue(0);
  const heroFitY = useMotionValue(0);

  useLayoutEffect(() => {
    const area = heroAreaRef.current;
    const frame = heroFrameRef.current;
    const root = (area ? area.offsetParent : null) as HTMLElement | null;
    if (!area || !frame || !root) return;

    // Centre of an element in `root` coordinates, from layout offsets only (transforms are ignored).
    const centreIn = (el: HTMLElement) => {
      let x = el.offsetWidth / 2;
      let y = el.offsetHeight / 2;
      for (let n: HTMLElement | null = el; n && n !== root; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      return { x, y };
    };

    const measure = () => {
      const frameW = frame.offsetWidth;
      const frameH = frame.offsetHeight;
      if (!frameW || !frameH) return; // photo not laid out yet; the observer fires again once it is
      const style = getComputedStyle(area);
      const availW = area.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const availH = area.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const scale = Math.min(availW / frameW, availH / frameH);
      if (!(scale > 1)) {
        // The photo already fills the hero area (very small screens): keep its original size.
        heroFitScale.set(1);
        heroFitX.set(0);
        heroFitY.set(0);
        return;
      }
      const target = centreIn(area);
      const resting = centreIn(frame);
      heroFitScale.set(scale);
      heroFitX.set(target.x - resting.x);
      heroFitY.set(target.y - resting.y);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [heroFitScale, heroFitX, heroFitY]);

  // 1 while the photo is enlarged, easing linearly to 0 as it reaches its original size.
  const heroEnlarged = useTransform(progress, [0, HERO_SHRINK_END], [1, 0], { clamp: true });
  const heroScale = useTransform([heroEnlarged, heroFitScale], ([k, s]: number[]) => 1 + (s - 1) * k);
  const heroX = useTransform([heroEnlarged, heroFitX], ([k, x]: number[]) => x * k);
  const heroY = useTransform([heroEnlarged, heroFitY], ([k, y]: number[]) => y * k);

  const handleTouch = () => {
    setIsTouched(true);
    playDarkAmbient();
    setTimeout(() => setIsTouched(false), 900);
  };

  return (
    <div
      className={`min-h-screen relative flex flex-col justify-start transition-colors duration-700 ${
        isDark ? 'bg-[#06070A] text-[#F1EBDD]' : 'bg-[#F1EBDD] text-[#06070A]'
      }`}
    >
      {/* Background ambient phosphor aura - 10% electric blue tone */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 65% 40%, rgba(61, 92, 255, 0.25) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* DEDICATED SCROLL-GATE CONTAINER:
          Substantially taller than viewport (303vh / 332vh) so it creates the hidden animation timeline
          (photo shrink first, then the signature; see HERO_SHRINK_END).
          The sticky hero inside remains visually pinned at top while user scrolls through progress 0 -> 1.
          No overflow:hidden hijacking, fully compatible with Lenis and native touch scrolling. */}
      <div
        ref={scrollGateRef}
        className="relative w-full h-[303vh] sm:h-[332vh]"
      >
        {/* Sticky Hero Visual: Pinned inside viewport for the duration of the transition */}
        <div className="sticky top-14 md:top-16 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)] w-full overflow-hidden flex flex-col justify-between max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-2 pb-6 z-10">
          {/* Top Swiss Telemetry Baseline */}
          <div
            className={`border-b pb-3 flex flex-wrap items-center justify-between gap-3 text-xs font-editorial-mono tracking-[0.2em] uppercase opacity-85 ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#E83B2E] animate-pulse" />
              <span className="font-bold">SECTION W // ARTISTIC</span>
              <span className="opacity-40">·</span>
              <span>CHITTAGONG 22.3569° N, 91.7832° E</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Clock className={`w-3.5 h-3.5 ${electricBlueText}`} />
                {bdTime ? `${bdTime} BST` : 'GMT+6'}
              </span>
              <span className="opacity-40">·</span>
              <span className={electricBlueText}>
                TRANSITION // <motion.span>{progressPercent}</motion.span>%
              </span>
            </div>
          </div>

          {/* HERO GRID: Hero Photograph + Hand-drawn Signature Reveal.
              The photograph sits dead centre at every width. (It used to share a 12-column grid with an
              empty spacer column and was right-aligned with md:items-end, which pushed it to the far right
              on desktop.) The hero-fit measurement below reads layout offsets, so with the photo centred its
              resting position and the hero-area centre coincide and the shrink is a pure in-place scale. */}
          <div ref={heroAreaRef} className="flex-1 grid grid-cols-1 gap-6 md:gap-12 items-center my-auto py-2">
            {/* Hero Image with Scroll-driven Blur & Exact SVG Mask Signature Reveal */}
            <div className="flex flex-col items-center justify-center">
              <motion.div
                ref={heroFrameRef}
                onClick={handleTouch}
                style={{ scale: heroScale, x: heroX, y: heroY }}
                className="relative cursor-pointer select-none w-full max-w-[260px] sm:max-w-[320px] md:max-w-[360px] flex items-center justify-center"
              >
                {/* Ethereal background ambient glow */}
                <div
                  className={`absolute -inset-10 pointer-events-none rounded-full blur-3xl transition-opacity duration-700 ${
                    isTouched ? 'opacity-70 scale-105' : 'opacity-40 scale-100'
                  }`}
                  style={{
                    background:
                      'radial-gradient(circle, rgba(61, 92, 255, 0.35) 0%, rgba(139, 92, 246, 0.2) 48%, transparent 75%)',
                  }}
                  aria-hidden="true"
                />

                {/* Hero Image Container: Borderless Pixel-by-Pixel Dissolve */}
                <div className="relative w-full overflow-hidden rounded-sm">
                  {/* Hero Photograph: Blur mapped continuously to scroll progress (0px -> 12px) */}
                  <motion.img
                    src={artisticHeroPhoto}
                    alt="Portrait of Sifat Siddique Arabi in the Section W digital exhibition — head and shoulders against a dark studio backdrop."
                    width={922}
                    height={1152}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto object-cover block select-none"
                    style={{
                      filter: filterBlur,
                      maskImage:
                        'radial-gradient(ellipse 84% 88% at 50% 50%, black 52%, rgba(0, 0, 0, 0.94) 68%, rgba(0, 0, 0, 0.6) 82%, rgba(0, 0, 0, 0.18) 94%, transparent 100%)',
                      WebkitMaskImage:
                        'radial-gradient(ellipse 84% 88% at 50% 50%, black 52%, rgba(0, 0, 0, 0.94) 68%, rgba(0, 0, 0, 0.6) 82%, rgba(0, 0, 0, 0.18) 94%, transparent 100%)',
                    }}
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />

                  {/* Micro subpixel matrix blend overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, rgba(61, 92, 255, 0.4) 0.5px, transparent 0.8px)',
                      backgroundSize: '3px 3px',
                      maskImage:
                        'radial-gradient(ellipse at center, transparent 55%, black 92%)',
                      WebkitMaskImage:
                        'radial-gradient(ellipse at center, transparent 55%, black 92%)',
                    }}
                    aria-hidden="true"
                  />

                  {/* HERO WORDMARK: "ARABI®" rises out of the middle grid cell's bottom line first, then
                      "sifat siddique" settles in just above it. Plays when Section W opens. Sits below
                      the signature (z-10 vs z-20) and never captures pointer events. */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
                    viewBox="0 0 922 1152"
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label="ARABI® — sifat siddique"
                  >
                    <defs>
                      {/* Clip to the middle cell, ending at its bottom line: ARABI emerges from that line */}
                      <clipPath id="arabi-hero-wordmark-clip">
                        <rect x="294" y="690" width="341" height="78" />
                      </clipPath>
                    </defs>
                    <motion.g style={{ opacity: wordmarkOpacity }}>
                      <g clipPath="url(#arabi-hero-wordmark-clip)">
                        <motion.g
                          initial={{ y: 52, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 1.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <text
                            x={WORDMARK_X}
                            y={WORDMARK_BASELINE}
                            fill="#F1EBDD"
                            fontFamily={WORDMARK_FONT}
                            fontWeight={700}
                            fontSize={WORDMARK_SIZE}
                            letterSpacing="-0.035em"
                            textRendering="geometricPrecision"
                          >
                            ARABI
                            <tspan fontSize={24} dy={-30} letterSpacing={0}>
                              ®
                            </tspan>
                          </text>
                        </motion.g>
                      </g>
                      <motion.g
                        initial={{ y: 6, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1.4, delay: 1.4, ease: 'easeOut' }}
                      >
                        <text
                          x={WORDMARK_X}
                          y={CAPTION_BASELINE}
                          fill="#F1EBDD"
                          fillOpacity={0.9}
                          fontFamily={WORDMARK_FONT}
                          fontWeight={500}
                          fontSize={CAPTION_SIZE}
                          letterSpacing="0.01em"
                          textRendering="geometricPrecision"
                        >
                          sifat siddique
                        </text>
                      </motion.g>
                    </motion.g>
                  </svg>

                  {/* SCROLL-GATED HANDWRITTEN SIGNATURE REVEAL:
                      Uses the authentic signature image asset without altering its geometry or proportions.
                      Progressively drawn in natural handwriting sequence via an SVG stroke mask.
                      Fully continuous, reversible, and snaps cleanly to 100% at progress >= 0.98. */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none z-20"
                  >
                    <div className="w-[88%] max-w-[310px]">
                      <svg
                        viewBox="0 0 386 309"
                        className="w-full h-auto overflow-visible select-none"
                        aria-label="Real handwritten signature of Sifat Siddique Arabi"
                      >
                        <defs>
                          <mask
                            id="arabi-hero-signature-mask"
                            maskUnits="userSpaceOnUse"
                            x="0"
                            y="0"
                            width="386"
                            height="309"
                          >
                            {/* Initially black: hides entire signature until strokes draw */}
                            <rect width="386" height="309" fill="black" />

                            {/* Traced pen strokes, drawn one after another from hero progress */}
                            {SIGNATURE_STROKES.map((stroke, i) => (
                              <SignatureStroke
                                key={i}
                                d={stroke.d}
                                progress={signatureProgress}
                                from={stroke.from}
                                to={stroke.to}
                              />
                            ))}

                            {/* Decisive completion snap: guarantees 100% full unmasking at progress >= 0.98 */}
                            <motion.rect
                              width="386"
                              height="309"
                              fill="white"
                              style={{ opacity: snapCompletion }}
                            />
                          </mask>
                        </defs>

                        {/* Authentic signature asset preserved with exact geometry & imperfections.
                            The colour/glow filter sits on the outer group so it is computed from the ink
                            drawn so far (the glow follows the pen); at 100% the result is identical. */}
                        <g
                          style={{
                            filter: isDark
                              ? 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(61,92,255,0.9)) drop-shadow(0 0 18px rgba(61,92,255,0.45))'
                              : 'brightness(0) drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
                          }}
                        >
                          <g mask="url(#arabi-hero-signature-mask)">
                            <image
                              href={signaturePng}
                              width="386"
                              height="309"
                              preserveAspectRatio="xMidYMid meet"
                            />
                          </g>
                        </g>
                      </svg>
                    </div>
                  </motion.div>

                  {/* Brief light pulse on touch */}
                  {isTouched && (
                    <motion.div
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle at center, rgba(61, 92, 255, 0.35) 0%, transparent 70%)',
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom baseline ticker */}
          <div
            className={`border-t pt-2 flex items-center justify-between text-[11px] font-editorial-mono tracking-[0.2em] uppercase opacity-70 ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3D5CFF]" />
              <span>Scroll down to complete signature</span>
            </span>
            <span className="hidden sm:inline opacity-60">
              LAYER 02 // ARTISTIC SYSTEM
            </span>
          </div>
        </div>
      </div>

      {/* WHY AM I BETTER? heading + scroll split card (three-panel split & flip) */}
      <WhyAmIBetterSection />

      {/* FOLLOWING WEBSITE CONTENT:
          Naturally begins and scrolls into view only AFTER the hero transition gate has been traversed.
          When scrolling upward from below, re-entering the hero pins the hero again and reverses the transition. */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 space-y-24">
        {/* EXHIBITION ROOM 01 // SELECTED WORKS: scroll-pinned pinboard (see ./exhibition/ExhibitionRoom01) */}
        <ExhibitionRoom01 isDark={isDark} />

        {/* Exhibition Room 02: closing quote. Card and text gradients only use Section W's own colours
            (#080A10 / #F6EFE0 / #3D5CFF / #F1EBDD / #06070A); the text gradient runs the opposite way to the background. */}
        <figure
          className={`px-6 py-16 sm:px-12 sm:py-24 rounded-sm border text-center ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(135deg, #080A10 0%, #3D5CFF 100%)'
              : 'linear-gradient(135deg, #F6EFE0 0%, #3D5CFF 100%)',
          }}
        >
          <div
            className="font-editorial-serif font-normal"
            style={{
              backgroundImage: isDark
                ? 'linear-gradient(135deg, #3D5CFF 0%, #F1EBDD 100%)'
                : 'linear-gradient(135deg, #3D5CFF 0%, #06070A 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            <blockquote
              className="mx-auto max-w-4xl leading-[1.04] text-balance"
              style={{ fontSize: 'clamp(2.25rem, 7.4vw, 4.5rem)' }}
            >
              <span className="italic">&ldquo;</span>
              <span className="uppercase tracking-[0.04em] text-[0.56em]">Familiarity can make</span>{' '}
              <em className="italic whitespace-nowrap">perfection</em>{' '}
              <span className="uppercase tracking-[0.04em] text-[0.56em]">feel</span>{' '}
              <em className="italic whitespace-nowrap">ordinary,</em>{' '}
              <span className="uppercase tracking-[0.04em] text-[0.56em]">being</span>{' '}
              <em className="italic whitespace-nowrap">unpredictable</em>{' '}
              <span className="uppercase tracking-[0.04em] text-[0.56em]">is the new</span>{' '}
              <em className="italic whitespace-nowrap">creativity</em>
              <span className="italic">&rdquo;</span>
            </blockquote>
            <figcaption
              className="mt-8 sm:mt-10 italic"
              style={{ fontSize: 'clamp(1.25rem, 2.8vw, 1.6rem)' }}
            >
              -Sifat siddique ARABI®
            </figcaption>
          </div>
        </figure>

        {/* Colophon & Authentic Signature Mark */}
        <div
          className={`pt-12 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-20 text-xs font-editorial-mono tracking-[0.18em] uppercase opacity-75 ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}
        >
          <div className="space-y-1">
            <div className="font-bold">SECTION W // DIGITAL EXHIBITION</div>
            <div className="opacity-60">
              EDITORIAL GROTESK + BOLD RESTRAINED SERIF
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="opacity-60">AUTHENTICATED BY</span>
            <img
              src={signaturePng}
              alt="Arabi signature"
              className={`h-7 w-auto select-none pointer-events-none ${
                isDark ? 'brightness-0 invert' : 'brightness-0'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Contact emblems: Instagram / VSCO / WhatsApp / Email, in the blank space under the colophon */}
      <ContactEmblems isDark={isDark} />
    </div>
  );
};
