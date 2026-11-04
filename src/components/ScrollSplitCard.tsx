import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

/**
 * Scroll Split Card
 * Modelled on the componentry.dev "scroll-split-card" behaviour (framer-motion, scroll driven):
 *   1. one complete image is pinned in the viewport,
 *   2. as you scroll it splits into three vertical panels that drift apart,
 *   3. the three panels then flip in 3D (staggered) to reveal their content.
 *
 * Self-contained: it tracks page scroll through its own tall wrapper (works with the Lenis
 * smooth-scroll already used by the site) and never touches any other section's scroll logic.
 * The image is never resized or cropped: the panel box carries the image's exact aspect ratio
 * and each panel simply shows its own third of it.
 */

export interface ScrollSplitCardItem {
  title: string;
  /** Body copy. A "\n" starts a new paragraph. */
  description: string;
  /** Optional multiplier for the body copy size only (default 1 = original size). Titles are never scaled. */
  textScale?: number;
  bgColor: string;
  textColor: string;
  icon?: React.ReactNode;
}

interface ScrollSplitCardProps {
  imageSrc: string;
  imageAlt: string;
  /** Intrinsic pixel size of the image, used only for its aspect ratio. */
  imageWidth: number;
  imageHeight: number;
  cards: [ScrollSplitCardItem, ScrollSplitCardItem, ScrollSplitCardItem];
  /** Controls the scroll distance of the whole effect. */
  className?: string;
}

// Timeline (fractions of the wrapper's scroll progress)
const SPLIT_START = 0.1; // image is whole until here
const SPLIT_END = 0.45; // panels fully apart
const FLIP_START = 0.52; // first panel starts flipping
const FLIP_LENGTH = 0.2; // duration of one flip
const FLIP_STAGGER = 0.07; // delay between panels
const SPREAD_PERCENT = 16; // how far side panels drift, as % of one panel's width
const PERSPECTIVE = '1600px';

const backfaceHidden: React.CSSProperties = {
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
};

interface SplitPanelProps {
  index: number;
  card: ScrollSplitCardItem;
  imageSrc: string;
  progress: MotionValue<number>;
  panelsOpacity: MotionValue<number>;
}

const SplitPanel: React.FC<SplitPanelProps> = ({
  index,
  card,
  imageSrc,
  progress,
  panelsOpacity,
}) => {
  const spread = (index - 1) * SPREAD_PERCENT;
  const x = useTransform(progress, [SPLIT_START, SPLIT_END], ['0%', `${spread}%`], {
    clamp: true,
  });

  const flipFrom = FLIP_START + index * FLIP_STAGGER;
  const rotateY = useTransform(progress, [flipFrom, flipFrom + FLIP_LENGTH], [0, 180], {
    clamp: true,
  });

  return (
    <motion.div
      className="absolute top-0 h-full will-change-transform"
      style={{
        left: `${(index * 100) / 3}%`,
        width: `${100 / 3}%`,
        x,
        rotateY,
        opacity: panelsOpacity,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* FRONT: this panel's third of the complete image */}
      <div className="absolute inset-0 overflow-hidden" style={backfaceHidden}>
        <img
          src={imageSrc}
          alt=""
          width={1414}
          height={2000}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute top-0 h-full max-w-none select-none"
          style={{ width: '300%', left: `${-index * 100}%` }}
        />
      </div>

      {/* BACK: revealed after the flip */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          ...backfaceHidden,
          transform: 'rotateY(180deg)',
          backgroundColor: card.bgColor,
          color: card.textColor,
        }}
      >
        {/* thin offset outline, same device as the caption card in the reference */}
        <div
          className="absolute pointer-events-none border border-current opacity-40"
          style={{ inset: '2.2cqw' }}
          aria-hidden="true"
        />
        <div
          className="relative h-full flex flex-col"
          style={{ padding: '6cqw 4.6cqw', gap: '3.4cqw' }}
        >
          {card.icon ? <div aria-hidden="true">{card.icon}</div> : null}
          <h3
            className="font-editorial-serif uppercase font-normal"
            style={{ fontSize: '3.3cqw', lineHeight: 1.08, letterSpacing: '0.02em', overflowWrap: 'anywhere' }}
          >
            {card.title}
          </h3>
          <div
            className="font-editorial-serif italic flex flex-col"
            style={{
              fontSize: `${3.3 * (card.textScale ?? 1)}cqw`,
              lineHeight: 1.32,
              overflowWrap: 'break-word',
              gap: '0.5em',
            }}
          >
            {card.description.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ScrollSplitCard: React.FC<ScrollSplitCardProps> = ({
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  cards,
  className = 'h-[400vh]',
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1], { clamp: true });

  // Until the split begins the image is shown as ONE untouched layer (no seams between panels).
  // (Annotated as number so both motion values share the MotionValue<number> type the panels expect.)
  const wholeOpacity = useTransform(progress, (v): number => (v < SPLIT_START ? 1 : 0));
  const panelsOpacity = useTransform(progress, (v): number => (v < SPLIT_START ? 0 : 1));

  const aspect = imageWidth / imageHeight;

  return (
    <div ref={wrapperRef} className={`relative w-full overflow-x-clip ${className}`}>
      <div className="sticky top-14 md:top-16 h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)] w-full flex items-center justify-center">
        <div
          className="relative"
          style={{
            width: `min(88vw, calc((100dvh - 7rem) * ${aspect}))`,
            aspectRatio: `${imageWidth} / ${imageHeight}`,
            perspective: PERSPECTIVE,
            containerType: 'inline-size',
          }}
        >
          {/* Complete image (initial state) */}
          <motion.img
            src={imageSrc}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 w-full h-full select-none pointer-events-none"
            style={{ opacity: wholeOpacity }}
          />

          {/* Three split / flip panels */}
          {cards.map((card, i) => (
            <SplitPanel
              key={i}
              index={i}
              card={card}
              imageSrc={imageSrc}
              progress={progress}
              panelsOpacity={panelsOpacity}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
