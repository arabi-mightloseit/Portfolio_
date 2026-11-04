import React from 'react';
import { ScrollSplitCard, ScrollSplitCardItem } from './ScrollSplitCard';
import posterImage from '../assets/images/why-makes-me-different-poster.jpeg';

// Palette sampled from the reference image: deep navy field + near-white card.
const NAVY = '#07004D';
const PAPER = '#FAFEFF';

// Card copy. "\n" starts a new paragraph. textScale only trims the body size of the longer cards so the
// full text fits inside its panel on every screen (all sizes are container-relative, so one value covers
// phone, tablet and desktop alike).
const CARDS: [ScrollSplitCardItem, ScrollSplitCardItem, ScrollSplitCardItem] = [
  {
    title: 'NOTHING SPECIAL',
    description: [
      "I'm not different.",
      'I have 206 bones, one brain, two eyes and the regular anatomy of a straight male.',
      'No extra limb or secret organ.',
      "Biologically speaking, I'm disappointingly standard.",
    ].join('\n'),
    bgColor: NAVY,
    textColor: PAPER,
  },
  {
    title: 'A MINOR DESIGN FLAW',
    description: [
      'I have a complex imagination issue:',
      'I overthink everything.',
      "It doesn't necessarily make me wiser or better at decisions. Mostly, it makes life harder than it needs to be.",
      'If a normal person sees a chair,',
      'I see its proportions, material, lighting, negative space and endless design choices.',
      'Then I question my entire existence.',
      'Very useful feature 👍',
      'Would not recommend.',
    ].join('\n'),
    textScale: 0.94,
    bgColor: PAPER,
    textColor: NAVY,
  },
  {
    title: 'APPARENTLY, THIS IS THE DIFFERENCE',
    description: [
      "I keep trying to make things that don't feel like everyone else's.",
      'Sometimes that means learning something outside my skill set.',
      'Sometimes it means fixing something nobody would even notice.',
      'Sometimes it means throwing away something perfectly fine just because it feels ordinary.',
      'And sometimes it means building an unnecessarily complicated solution to a nonexistent problem.',
      "So no, I'm not biologically different.",
      "I'm just committed to being MYSELF no matter how complex the process is.",
    ].join('\n'),
    textScale: 0.84,
    bgColor: NAVY,
    textColor: PAPER,
  },
];

export const WhyAmIBetterSection: React.FC = () => {
  return (
    <section aria-labelledby="why-am-i-better-heading" className="relative z-10 w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-32 pb-12 sm:pb-16 text-center">
        <h2
          id="why-am-i-better-heading"
          className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.02] font-normal"
        >
          Why am I better? Or am I?
        </h2>
      </div>

      <ScrollSplitCard
        imageSrc={posterImage}
        imageAlt="What makes me different? Facts about me, a personal article by Arabi: a portrait in a blue jacket above the note “There's a lot of relevant information about me, ahem.. can't fit in a small paragraph”."
        imageWidth={1414}
        imageHeight={2000}
        cards={CARDS}
        className="h-[400vh]"
      />
    </section>
  );
};
