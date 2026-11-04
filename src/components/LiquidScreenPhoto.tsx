import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import arabiHeroPhoto from '../assets/images/1789934975007~2.jpg';
import { ThemeMode } from '../types';

interface LiquidScreenPhotoProps {
  theme: ThemeMode;
  isArtisticMode?: boolean;
  onClick?: () => void;
  className?: string;
}

interface TouchRipple {
  id: number;
  x: number;
  y: number;
}

export const LiquidScreenPhoto: React.FC<LiquidScreenPhotoProps> = ({
  theme,
  isArtisticMode = false,
  onClick,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<TouchRipple[]>([]);
  const [isDisturbed, setIsDisturbed] = useState(false);
  const [pointerPos, setPointerPos] = useState({ x: 50, y: 50 });
  const [signalActive, setSignalActive] = useState(false);
  const isNoir = theme === 'noir';

  const triggerDisturbance = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setPointerPos({ x, y });
    setIsDisturbed(true);
    setSignalActive(true);

    const newRipple: TouchRipple = {
      id: Date.now() + Math.random(),
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    setRipples((prev) => [...prev.slice(-3), newRipple]);

    setTimeout(() => {
      setIsDisturbed(false);
    }, 700);

    setTimeout(() => {
      setSignalActive(false);
    }, 1800);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    triggerDisturbance(e.clientX, e.clientY);
    if (onClick) onClick();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      triggerDisturbance(touch.clientX, touch.clientY);
    }
    if (onClick) onClick();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0 && containerRef.current) {
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      setPointerPos({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointerPos({ x, y });
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Outer Ethereal / Phosphor Halo when in Section W Artistic Mode */}
      {isArtisticMode && (
        <div
          className="absolute -inset-4 sm:-inset-6 pointer-events-none rounded-xl transition-opacity duration-700 blur-xl opacity-60"
          style={{
            background: isNoir
              ? `radial-gradient(circle at ${pointerPos.x}% ${pointerPos.y}%, rgba(61, 92, 255, 0.35) 0%, rgba(61, 92, 255, 0.08) 50%, transparent 80%)`
              : `radial-gradient(circle at ${pointerPos.x}% ${pointerPos.y}%, rgba(41, 70, 211, 0.28) 0%, rgba(41, 70, 211, 0.05) 50%, transparent 80%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Main Interactive Screen Housing */}
      <motion.div
        ref={containerRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onMouseMove={handleMouseMove}
        role="button"
        tabIndex={0}
        aria-label="Liquid screen portrait transmitter. Touch or click to disturb the medium."
        whileHover={{
          scale: 1.018,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        }}
        whileTap={{
          scale: 0.982,
          transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
        }}
        className={`relative cursor-pointer select-none overflow-hidden transition-all duration-500 rounded-[2px] ${
          isArtisticMode
            ? isNoir
              ? 'bg-[#08090D] border-2 border-[#3D5CFF]/60 shadow-[0_0_24px_rgba(61,92,255,0.22),0_8px_30px_rgba(0,0,0,0.8)]'
              : 'bg-[#0E1017] border-2 border-[#2946D3]/60 shadow-[0_0_20px_rgba(41,70,211,0.2),0_8px_24px_rgba(0,0,0,0.25)]'
            : 'bg-white p-2.5 sm:p-3 border border-black/15 shadow-md'
        } w-full max-w-[240px] sm:max-w-[270px] md:max-w-[285px]`}
      >
        {/* Screen Bezel in Artistic Mode */}
        {isArtisticMode && (
          <div className="absolute top-0 left-0 right-0 z-30 px-2.5 py-1 flex items-center justify-between text-[9px] font-editorial-mono tracking-[0.2em] uppercase pointer-events-none bg-black/60 backdrop-blur-xs text-[#F1EBDD]/80 border-b border-white/10">
            <span className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  isDisturbed
                    ? 'bg-[#3D5CFF] shadow-[0_0_8px_#3D5CFF]'
                    : 'bg-[#E83B2E]'
                }`}
              />
              LIQUID SCREEN
            </span>
            <span className="opacity-60 text-[8px]">EMISSION // 01</span>
          </div>
        )}

        {/* The Core Image Aperture */}
        {/* The aperture box carries the portrait's own aspect ratio (784 x 1373). The photo already ended up
            at exactly this height, but only once the browser had its intrinsic size — until then the box was
            0px and everything below it jumped when the photo arrived (CLS 0.167). Declaring the ratio reserves
            the same box from the first layout, so the rendered result is unchanged but nothing moves. */}
        <div
          className={`relative overflow-hidden ${
            isArtisticMode
              ? 'aspect-[4/5] bg-[#050608] pt-6'
              : 'aspect-[784/1373] bg-[#1A1C24]'
          }`}
        >
          {/* Layer 0: The Untouched, Pure Hero Photo - Face and proportions unaltered */}
          <img
            src={arabiHeroPhoto}
            alt="Portrait of Sifat Siddique Arabi wearing a grey shirt and burgundy tie, lit by warm indoor light."
            width={784}
            height={1373}
            decoding="async"
            fetchPriority="high"
            className={`w-full h-full object-cover block relative z-10 transition-transform duration-500 ease-out ${
              isDisturbed ? 'scale-[1.015]' : 'scale-100'
            }`}
            style={{
              filter: isArtisticMode
                ? 'contrast(1.08) brightness(0.97)'
                : 'none',
            }}
            referrerPolicy="no-referrer"
          />

          {/* Section W Artistic Enhancements: Liquid Screen Physics */}
          {isArtisticMode && (
            <>
              {/* Layer 1: Blooming Highlights (organic soft glow for brighter areas without altering facial lines) */}
              <div
                className="absolute inset-0 z-12 pointer-events-none mix-blend-screen opacity-20 blur-[3px]"
                aria-hidden="true"
              >
                <img
                  src={arabiHeroPhoto}
                  alt=""
                  className="w-full h-full object-cover block"
                />
              </div>

              {/* Layer 2: Subtle Horizontal Scanlines */}
              <div
                className="absolute inset-0 z-14 pointer-events-none opacity-22"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0px, rgba(0, 0, 0, 0.6) 1px, transparent 1px, transparent 3px)',
                  backgroundSize: '100% 3px',
                }}
                aria-hidden="true"
              />

              {/* Layer 3: Subpixel Matrix / LED Aperture Texture */}
              <div
                className="absolute inset-0 z-16 pointer-events-none opacity-15"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.7) 0.5px, transparent 0.7px)',
                  backgroundSize: '3px 3px',
                }}
                aria-hidden="true"
              />

              {/* Layer 4: Deep Black Edge Bleed (edges bleeding seamlessly into darkness) */}
              <div
                className="absolute inset-0 z-18 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 48%, rgba(5,6,8,0.7) 82%, rgba(5,6,8,0.98) 100%)',
                }}
                aria-hidden="true"
              />

              {/* Layer 5: Subtle chromatic edge fringing on disturbance */}
              {isDisturbed && (
                <div
                  className="absolute inset-0 z-19 pointer-events-none mix-blend-screen opacity-35 transition-opacity duration-300"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(61,92,255,0.2) 0%, transparent 20%, transparent 80%, rgba(255,50,50,0.15) 100%)',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Layer 6: Dynamic Liquid Ripple Waves from Touch / Click */}
              <AnimatePresence>
                {ripples.map((ripple) => (
                  <motion.div
                    key={ripple.id}
                    initial={{
                      scale: 0,
                      opacity: 0.75,
                      x: ripple.x - 75,
                      y: ripple.y - 75,
                    }}
                    animate={{
                      scale: 2.8,
                      opacity: 0,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.85,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute z-20 w-[150px] h-[150px] rounded-full pointer-events-none border border-[#3D5CFF] shadow-[0_0_20px_rgba(61,92,255,0.6)]"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(61,92,255,0.25) 0%, rgba(61,92,255,0.05) 50%, transparent 70%)',
                    }}
                  />
                ))}
              </AnimatePresence>

              {/* Layer 7: Brief Light Pulse Emission when touched */}
              <div
                className={`absolute inset-0 z-22 pointer-events-none transition-opacity duration-500 ${
                  isDisturbed ? 'opacity-30' : 'opacity-0'
                }`}
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(61,92,255,0.45) 0%, transparent 70%)',
                }}
                aria-hidden="true"
              />
            </>
          )}

        </div>

        {/* Section W: Bottom Telemetry Strip */}
        {isArtisticMode && (
          <div className="px-2.5 py-1.5 bg-black/85 border-t border-white/10 flex items-center justify-between text-[9px] font-editorial-mono tracking-[0.16em] uppercase text-[#F1EBDD]/70 pointer-events-none">
            <span className="text-[#3D5CFF] font-semibold">
              {signalActive ? 'PULSE ACTIVE' : 'STEADY STREAM'}
            </span>
            <span>22.3569°N · 91.7832°E</span>
          </div>
        )}
      </motion.div>

      {/* Caption text below the screen */}
      <div className="relative z-10 mt-2 text-xs font-editorial-mono tracking-wider uppercase opacity-75 text-center md:text-right font-medium">
        {isArtisticMode ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3D5CFF] animate-pulse" />
            Liquid screen bridge · Touch to perturb
          </span>
        ) : (
          'Commercial headshot'
        )}
      </div>
    </div>
  );
};
