/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import arabiHeroPhoto from './assets/images/1789934975007~2.jpg';
import signaturePng from './assets/images/20260117_020006-removebg-preview.png';
import noireProjectImage from './assets/images/project_noire_1790455623648.jpg';
import remainderProjectImage from './assets/images/project_remainder_1790455636386.jpg';
import { Navigation } from './components/Navigation';
import { ProjectModal } from './components/ProjectModal';
import { ArabiSignature } from './components/ArabiSignature';
import { ArtisticSectionW } from './components/ArtisticSectionW';
import { LiquidScreenPhoto } from './components/LiquidScreenPhoto';
import { Project, ThemeMode } from './types';
import { playPaperCrunch, playDarkAmbient } from './utils/audio';
import {
  ArrowUpRight,
  Copy,
  Check,
  Send,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';

// Contact form delivery: FormSubmit forwards each submission to this Gmail inbox.
const CONTACT_EMAIL = 'sifat.01938168@gmail.com';
const CONTACT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'noire',
    title: 'NOIRÉ',
    category: 'Brand & Digital Architecture',
    year: '2025–2026',
    tagline: 'A restrained luxury and design experiment exploring minimal commerce and high-margin product curation.',
    description:
      'NOIRÉ investigates how severe aesthetic reduction influences consumer perceived value in direct-to-consumer commerce. Developed from Chittagong, it pairs austere typography with deliberate physical packaging and digital restraint to test pricing power without conventional advertising noise.',
    focus: [
      'Monochrome typography systems',
      'High-margin physical product staging',
      'Frictionless checkout ergonomics',
      'Direct-to-consumer unit economics',
    ],
    deliverables: [
      'Brand Identity & Guidelines',
      'Editorial Web Store Architecture',
      'Physical Packaging Standards',
      'Direct Distribution Framework',
    ],
    status: 'Complete',
    image: noireProjectImage,
    imageAlt:
      'NOIRÉ typography specimen book open on a concrete surface, showing the NOIRÉ wordmark and the NOIRÉ Regular and NOIRÉ Sans Serif character sets.',
    linkText: 'Archived Case Brief',
    linkUrl: '#',
  },
  {
    id: 'remainder',
    title: 'Remainder',
    category: 'Critical Research & Editorial Monograph',
    year: '2025–Present',
    tagline: 'An independent analytical publication examining market incentives, friction, and consumer behavior.',
    description:
      'Remainder is an ongoing research initiative and critical commentary examining the unexamined assumptions behind modern venture creation in South Asia. Issues explore supply chain friction, structural bottlenecks, and how simplicity outlasts hyper-growth software paradigms.',
    focus: [
      'First-principles market diagnostics',
      'Structural critiques of tech ecosystems',
      'Minimal editorial distribution',
      'Long-form analytical essays',
    ],
    deliverables: [
      'Quarterly Research Monograph',
      'Distribution Newsletter Architecture',
      'Analytical Mental Model Frameworks',
      'Open Reading Repository',
    ],
    status: 'Active',
    image: remainderProjectImage,
    imageAlt:
      'The Remainder monograph resting on a concrete ledge — a hand-bound issue with the title REMAINDER pressed into its cover.',
    linkText: 'Read Selected Chapters',
    linkUrl: 'https://agency-xyz-main-2.vercel.app/',
  },
];

export default function App() {
  // Theme state: defaults to noir (pure black background #101116) as requested, with instant toggle to ivory #F1EBDD
  const [theme, setTheme] = useState<ThemeMode>('noir');
  
  // Signature Switch state for "OTHERWISE" (structure for future creative reveal)
  const [isOtherwiseArmed, setIsOtherwiseArmed] = useState<boolean>(false);

  const handleToggleArmed = (armed: boolean) => {
    setIsOtherwiseArmed(armed);
    window.scrollTo(0, 0);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  };

  // Selected work is fixed content: the portfolio only shows real, documented projects.
  const projects = INITIAL_PROJECTS;

  // Selected project for detail modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Email copy state
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // Lenis ultra smooth scrolling instance
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Current Chittagong local time calculation
  const [bdTime, setBdTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setBdTime(new Intl.DateTimeFormat('en-GB', options).format(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('sifat.01938168@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2400);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'noir' ? 'ivory' : 'noir';
    setTheme(nextTheme);
    if (nextTheme === 'ivory') {
      playPaperCrunch();
    } else {
      playDarkAmbient();
    }
  };

  const handleGlideTo = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(element, { offset: -70 });
      } else {
        const headerOffset = 70;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    setSendError('');
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        // FormSubmit rejects requests that arrive without a Referer, so always send the origin.
        referrerPolicy: 'origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message,
          _subject: `Portfolio: ${contactForm.subject}`,
          _template: 'table',
          _captcha: 'false',
          _url: window.location.href,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || (result.success !== true && result.success !== 'true')) {
        throw new Error(String(result?.message || 'Request failed'));
      }
      setFormSubmitted(true);
    } catch (err) {
      const reason = err instanceof Error ? err.message : '';
      console.error('Contact form delivery failed:', reason);
      setSendError(
        /activat/i.test(reason)
          ? `This inbox still needs a one-time activation. Open the FormSubmit email sent to ${CONTACT_EMAIL} (check spam), confirm it, then send again.`
          : `Couldn't send that just now. Please try again, or write directly to ${CONTACT_EMAIL}.`
      );
    } finally {
      setIsSending(false);
    }
  };

  // Section W always keeps the Noir palette; the Ivory canvas choice only applies to Section L.
  const activeTheme: ThemeMode = isOtherwiseArmed ? 'noir' : theme;
  const isNoir = activeTheme === 'noir';
  // High-legibility royal blue on noir canvas, calibrated deep royal blue on ivory
  const blueText = isNoir ? 'text-[#5577FF]' : 'text-[#2946D3]';
  const blueBg = isNoir ? 'bg-[#3D5CFF]' : 'bg-[#2946D3]';
  const blueHover = isNoir ? 'hover:bg-[#4E6EFF]' : 'hover:bg-[#2039B0]';
  const blueBorder = isNoir ? 'border-[#3D5CFF]' : 'border-[#2946D3]';

  return (
    <div
      className={`min-h-screen transition-colors duration-200 theme-${activeTheme} selection:bg-[#3D5CFF] selection:text-[#F1EBDD] ${
        isOtherwiseArmed
          ? 'bg-[#06070A] text-[#F1EBDD]'
          : isNoir
          ? 'bg-[#101116] text-[#F1EBDD]'
          : 'bg-[#F1EBDD] text-[#101116]'
      }`}
    >
      {/* Top Bar with Top-Left Hardware Switch & 3-Zone Contract */}
      <Navigation
        isArmed={isOtherwiseArmed}
        onToggleArmed={handleToggleArmed}
        theme={activeTheme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area - Switches between Section W (Digital Exhibition) and Section L (Editorial Monograph) */}
      {isOtherwiseArmed ? (
        <ArtisticSectionW
          theme={activeTheme}
          bdTime={bdTime}
        />
      ) : (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-10 pb-16 md:pb-24 space-y-20 md:space-y-28">
        
        {/* HERO SECTION */}
        <section id="hero" className="pt-1 md:pt-4">
          {/* Top geographic baseline - Phase 1 */}
          <div className="animate-reveal-1 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-editorial-mono tracking-wider uppercase opacity-85 font-medium mb-5 sm:mb-7">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E83B2E]" />
              CHITTAGONG, BANGLADESH
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${blueText}`} />
              {bdTime ? `${bdTime} BST (GMT+6)` : 'GMT+6'}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>20 YEARS OLD</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 md:gap-10 items-start">
            {/* Left Typography Block */}
            <div className="md:col-span-7 space-y-5">
              {/* Phase 1: Name reveals first */}
              <div className="animate-reveal-1 space-y-1.5">
                <span className="block font-editorial-mono text-xs sm:text-sm md:text-base tracking-[0.24em] uppercase opacity-75 font-semibold">
                  SIFAT SIDDIQUE
                </span>
                <h1 className="font-editorial-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight leading-[0.98]">
                  {/* The wordmark stays visually identical; the hidden prefix completes the name for
                      screen readers, search engines and anything else that reads the heading as text. */}
                  <span className="sr-only">Sifat Siddique </span>ARABI
                </h1>
              </div>

              {/* Phase 2: What I do reveals with photo */}
              <div className="animate-reveal-2 space-y-3">
                <p className={`font-editorial-mono text-xs sm:text-sm md:text-base tracking-[0.16em] uppercase ${blueText} font-semibold`}>
                  Entrepreneur / creative director / whatever...
                </p>
                <div className="pt-1 font-editorial-serif text-base sm:text-lg md:text-xl leading-relaxed opacity-95">
                  <p>
                    Moving between business, design, clothing, photography and whatever else seems worth figuring out.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Photo Block:
                Polaroid framed portrait with subtle architectural fading background grid,
                'Commercial headshot' caption, and action buttons directly below */}
            <div className="md:col-span-5 flex flex-col items-center md:items-end">
              {/* Phase 2: Picture reveals smoothly with what I do */}
              <div className="animate-reveal-2 relative group w-full flex flex-col items-center md:items-end">
                {/* Subtle architectural fading grid around the Polaroid */}
                <div
                  className={`absolute -inset-6 sm:-inset-8 pointer-events-none transition-opacity duration-300 z-0 ${
                    isNoir ? 'polaroid-grid-noir' : 'polaroid-grid-ivory'
                  }`}
                  aria-hidden="true"
                />

                <LiquidScreenPhoto
                  theme={theme}
                  isArtisticMode={false}
                  onClick={() => {
                    if (isNoir) playDarkAmbient();
                    else playPaperCrunch();
                  }}
                />
              </div>

              {/* Phase 3: Action Buttons placed directly below the photo */}
              <div className="animate-reveal-3 mt-4 sm:mt-5 flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs sm:text-sm font-editorial-mono tracking-wider uppercase font-semibold w-full">
                <a
                  href="#projects"
                  onClick={(e) => handleGlideTo(e, 'projects')}
                  className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-sm ${blueBg} text-[#F1EBDD] font-bold ${blueHover} transition-colors shadow-sm cursor-pointer`}
                >
                  <span>Selected Work</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <a
                  href="#about"
                  onClick={(e) => handleGlideTo(e, 'about')}
                  className={`inline-flex items-center gap-1 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-sm border-2 transition-colors font-medium cursor-pointer ${
                    isNoir
                      ? 'border-[#33384D] hover:border-[#535D80] text-[#F1EBDD]'
                      : 'border-[#BEB19A] hover:border-[#83765E] text-[#101116]'
                  }`}
                >
                  <span>Read Profile</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION DIVIDER */}
        <div className={`h-[1px] w-full ${isNoir ? 'bg-[#202330]' : 'bg-[#D8CEBA]'}`} />

        {/* ABOUT SECTION */}
        <section id="about" className="space-y-6">
          <div className="flex items-center justify-between">
            <span className={`font-editorial-mono text-xs sm:text-sm tracking-[0.2em] uppercase font-bold ${blueText}`}>
              01 / ABOUT
            </span>
            <span className="font-editorial-mono text-xs sm:text-sm tracking-wider uppercase opacity-70 font-medium">
              Biography & Background
            </span>
          </div>

          <h2 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
            I Get Bored Easily, So I Make Things.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-2">
            <div className="md:col-span-8 space-y-5 font-editorial-sans text-base sm:text-lg leading-relaxed opacity-90">
              <p className="text-xl sm:text-2xl font-editorial-serif leading-snug text-current">
                Some become businesses. Some become designs. Some probably shouldn't have been made at all.
              </p>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                Independent by choice. Questioning conventional roadmaps, trying ideas, breaking them, rebuilding them, and retaining only the pieces that genuinely hold value.
              </p>
            </div>

            {/* Quick Metadata Column */}
            <div className="md:col-span-4 space-y-4 font-editorial-mono text-xs sm:text-sm border-l-2 pl-5 border-current/15">
              <div>
                <span className="block text-xs uppercase tracking-wider font-semibold opacity-65">Identity</span>
                <span className="mt-0.5 block font-editorial-sans font-medium text-sm sm:text-base">
                  Sifat Siddique <span className={`font-bold ${blueText}`}>"Arabi"</span>
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider font-semibold opacity-65">Location</span>
                <span className="mt-0.5 block font-editorial-sans font-medium text-sm sm:text-base">Chittagong, Bangladesh</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider font-semibold opacity-65">Age</span>
                <span className="mt-0.5 block font-editorial-sans font-medium text-sm sm:text-base">20 Years</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider font-semibold opacity-65">Discipline</span>
                <span className={`mt-0.5 block font-editorial-sans font-medium text-sm sm:text-base ${blueText}`}>
                  Entrepreneur / creative director / whatever...
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider font-semibold opacity-65">Current Status</span>
                <span className="mt-0.5 flex items-center gap-2 font-editorial-sans font-medium text-sm sm:text-base">
                  <span className="w-2 h-2 rounded-full bg-[#E83B2E]" />
                  Active on independent initiatives
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION DIVIDER */}
        <div className={`h-[1px] w-full ${isNoir ? 'bg-[#202330]' : 'bg-[#D8CEBA]'}`} />

        {/* CURRENTLY / INTERESTS SECTION */}
        <section id="interests" className="space-y-8">
          <div className="flex items-center justify-between">
            <span className={`font-editorial-mono text-xs sm:text-sm tracking-[0.2em] uppercase font-bold ${blueText}`}>
              02 / CURRENTLY & PURSUITS
            </span>
            <span className="font-editorial-mono text-xs sm:text-sm tracking-wider uppercase opacity-70 font-medium">
              Active Focus Vector
            </span>
          </div>

          <h2 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
            Current pursuits, active crafts, and exploratory work.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Card 1: THE MISSING LINK */}
            <div
              className={`p-6 sm:p-7 rounded-sm border transition-colors ${
                isNoir
                  ? 'bg-[#14161F] border-[#252A3C]'
                  : 'bg-[#ECE4D0] border-[#D4CABB]'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`w-2 h-2 rounded-full ${blueBg}`} />
                <h3 className="font-editorial-mono text-sm sm:text-base uppercase tracking-wider font-bold">
                  THE MISSING LINK
                </h3>
              </div>
              <p className="font-editorial-sans text-sm sm:text-base leading-relaxed opacity-95">
                Building an adaptive learning platform for IELTS and SSC/HSC—teaching the shortcuts, patterns and overlooked techniques that conventional courses tend to miss.
              </p>
            </div>

            {/* Card 2: FASHION DESIGNING */}
            <div
              className={`p-6 sm:p-7 rounded-sm border transition-colors ${
                isNoir
                  ? 'bg-[#14161F] border-[#252A3C]'
                  : 'bg-[#ECE4D0] border-[#D4CABB]'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#E83B2E]" />
                <h3 className="font-editorial-mono text-sm sm:text-base uppercase tracking-wider font-bold">
                  FASHION DESIGNING
                </h3>
              </div>
              <p className="font-editorial-sans text-sm sm:text-base leading-relaxed opacity-95">
                Learning the craft from the ground up, from pattern-making and construction to developing my own pieces and eventually turning them into something of my own.
              </p>
            </div>

            {/* Card 3: EXPERIMENTING */}
            <div
              className={`p-6 sm:p-7 rounded-sm border transition-colors ${
                isNoir
                  ? 'bg-[#14161F] border-[#252A3C]'
                  : 'bg-[#ECE4D0] border-[#D4CABB]'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`w-2 h-2 rounded-full ${blueBg}`} />
                <h3 className="font-editorial-mono text-sm sm:text-base uppercase tracking-wider font-bold">
                  EXPERIMENTING
                </h3>
              </div>
              <p className="font-editorial-sans text-sm sm:text-base leading-relaxed opacity-95">
                Moving between business, design, clothing, photography and whatever else seems worth figuring out.
              </p>
            </div>

            {/* Card 4: LEARNING BY DOING */}
            <div
              className={`p-6 sm:p-7 rounded-sm border transition-colors ${
                isNoir
                  ? 'bg-[#14161F] border-[#252A3C]'
                  : 'bg-[#ECE4D0] border-[#D4CABB]'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#E83B2E]" />
                <h3 className="font-editorial-mono text-sm sm:text-base uppercase tracking-wider font-bold">
                  LEARNING BY DOING
                </h3>
              </div>
              <p className="font-editorial-sans text-sm sm:text-base leading-relaxed opacity-95">
                Trying things, breaking them, rebuilding them—and keeping the useful parts.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION DIVIDER */}
        <div className={`h-[1px] w-full ${isNoir ? 'bg-[#202330]' : 'bg-[#D8CEBA]'}`} />

        {/* SELECTED PROJECTS SECTION */}
        <section id="projects" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className={`font-editorial-mono text-xs sm:text-sm tracking-[0.2em] uppercase font-bold ${blueText}`}>
                03 / SELECTED WORK
              </span>
              <h2 className="mt-1 font-editorial-serif text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
                Case studies & monographs
              </h2>
            </div>
            <span className="font-editorial-mono text-xs sm:text-sm tracking-wider uppercase opacity-70 font-medium">
              {projects.length} Selected Archives
            </span>
          </div>

          <div className="space-y-6">
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.42,
                  delay: idx * 0.07,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                whileHover={{
                  y: -5,
                  scale: 1.008,
                  transition: { duration: 0.22, ease: 'easeOut' },
                }}
                whileTap={{
                  scale: 0.985,
                  y: -1,
                  transition: { duration: 0.1, ease: 'easeOut' },
                }}
                onClick={() => setSelectedProject(project)}
                className={`group p-6 sm:p-8 rounded-sm border transition-all duration-200 cursor-pointer ${
                  isNoir
                    ? 'bg-[#13151D] border-[#222636] hover:border-[#4B5578] hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.85),0_0_12px_rgba(85,119,255,0.22)]'
                    : 'bg-[#EFE7D5] border-[#D6CDBC] hover:border-[#9C8F73] hover:shadow-[0_16px_36px_-12px_rgba(40,30,20,0.16),0_0_12px_rgba(41,70,211,0.22)]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Index & Meta */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-editorial-mono font-medium">
                      <span className={`${blueText} font-bold`}>
                        0{idx + 1}
                      </span>
                      <span className="opacity-40">/</span>
                      <span className="uppercase tracking-wider opacity-75 font-semibold">
                        {project.category}
                      </span>
                      <span className="opacity-40">·</span>
                      <span className="opacity-65">{project.year}</span>
                    </div>

                    <h3 className={`font-editorial-serif text-2xl sm:text-3xl md:text-4xl tracking-tight group-hover:${blueText} transition-colors duration-200`}>
                      {project.title}
                    </h3>

                    <p className="font-editorial-sans text-sm sm:text-base opacity-90 leading-relaxed max-w-2xl">
                      {project.tagline || project.description}
                    </p>

                    {/* Tag list */}
                    <div className="pt-2 flex flex-wrap gap-2.5 text-xs font-editorial-mono opacity-80 font-medium">
                      {project.focus.slice(0, 3).map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E83B2E]" />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-2 md:pt-0 shrink-0">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs sm:text-sm font-editorial-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                        isNoir
                          ? `bg-[#1E212D] text-[#F1EBDD] hover:${blueBg}`
                          : `bg-[#DFD7C3] text-[#101116] hover:${blueBg} hover:text-[#F1EBDD]`
                      }`}
                    >
                      <span>Examine Case</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </motion.button>
                  </div>
                </div>

                {/* Inline project thumbnail preview if image exists */}
                {project.image && (
                  <motion.div
                    whileHover={{ scale: 1.012 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                    }}
                    className="mt-5 overflow-hidden rounded-sm border border-current/10 cursor-pointer max-h-56 relative group/img"
                  >
                    {/* Intrinsic size is declared so the card reserves the right box before the bytes
                        arrive; the class list still controls the rendered size exactly as before. */}
                    <img
                      src={project.image}
                      alt={project.imageAlt ?? project.title}
                      width={1376}
                      height={768}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center filter grayscale group-hover/img:grayscale-0 transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="font-editorial-mono text-xs tracking-wider uppercase bg-black/85 text-white px-3 py-1.5 rounded-sm font-semibold">
                        View Specification
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION DIVIDER */}
        <div className={`h-[1px] w-full ${isNoir ? 'bg-[#202330]' : 'bg-[#D8CEBA]'}`} />

        {/* APPROACH SECTION */}
        <section id="approach" className="space-y-8">
          <div className="flex items-center justify-between">
            <span className={`font-editorial-mono text-xs sm:text-sm tracking-[0.2em] uppercase font-bold ${blueText}`}>
              04 / WORKING APPROACH
            </span>
            <span className="font-editorial-mono text-xs sm:text-sm tracking-wider uppercase opacity-70 font-medium">
              Core Axioms
            </span>
          </div>

          <h2 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
            Four guiding constraints behind all creative & commercial output.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            <div className="space-y-2.5">
              <span className={`font-editorial-mono text-xs sm:text-sm ${blueText} font-bold tracking-wider`}>
                01. FIRST-PRINCIPLES DIAGNOSTICS
              </span>
              <h3 className="font-editorial-serif text-2xl sm:text-3xl">Deconstruct inherited consensus</h3>
              <p className="font-editorial-sans text-sm sm:text-base opacity-90 leading-relaxed">
                Most industry practices are habits rather than necessities. We isolate the physical, technical, and psychological truths of a problem before committing capital or design labor.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="font-editorial-mono text-xs sm:text-sm text-[#E83B2E] font-bold tracking-wider">
                02. SEVERE VISUAL RESTRAINT
              </span>
              <h3 className="font-editorial-serif text-2xl sm:text-3xl">Zero ornamental noise</h3>
              <p className="font-editorial-sans text-sm sm:text-base opacity-90 leading-relaxed">
                Visual fireworks mask structural weaknesses. By rejecting gratuitous animations, gradients, and bloated cards, the typography and value proposition must stand entirely on their own merit.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className={`font-editorial-mono text-xs sm:text-sm ${blueText} font-bold tracking-wider`}>
                03. REGIONAL LEVERAGE
              </span>
              <h3 className="font-editorial-serif text-2xl sm:text-3xl">Operating from Chittagong</h3>
              <p className="font-editorial-sans text-sm sm:text-base opacity-90 leading-relaxed">
                Building from Bangladesh provides an immediate grounding in physical logistics, cost efficiency, and informal commercial realities that Silicon Valley abstractions fail to perceive.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="font-editorial-mono text-xs sm:text-sm text-[#E83B2E] font-bold tracking-wider">
                04. PATIENT AUTONOMY
              </span>
              <h3 className="font-editorial-serif text-2xl sm:text-3xl">Enduring unit economics</h3>
              <p className="font-editorial-sans text-sm sm:text-base opacity-90 leading-relaxed">
                A venture that cannot survive on customer revenue is fundamentally incomplete. We prioritize self-sustaining operational models, conservative leverage, and independent ownership.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION DIVIDER */}
        <div className={`h-[1px] w-full ${isNoir ? 'bg-[#202330]' : 'bg-[#D8CEBA]'}`} />

        {/* CONTACT SECTION */}
        <section id="contact" className="space-y-8">
          <div className="flex items-center justify-between">
            <span className={`font-editorial-mono text-xs sm:text-sm tracking-[0.2em] uppercase font-bold ${blueText}`}>
              05 / DIRECT CORRESPONDENCE
            </span>
            <span className="font-editorial-mono text-xs sm:text-sm tracking-wider uppercase opacity-70 font-medium">
              Open Channel
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* Left Contact Information */}
            <div className="md:col-span-5 space-y-6">
              <div>
                <h2 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
                  Initiate conversation.
                </h2>
                <p className="mt-2 text-sm sm:text-base font-editorial-sans opacity-90 leading-relaxed">
                  Available for select venture initiatives, advisory inquiries, and strategic collaborations aligned with our principles.
                </p>
              </div>

              {/* Direct Email with copy button */}
              <div
                className={`p-5 rounded-sm border ${
                  isNoir
                    ? 'bg-[#14161F] border-[#252A3C]'
                    : 'bg-[#ECE4D0] border-[#D4CABB]'
                }`}
              >
                <span className="block font-editorial-mono text-xs uppercase tracking-wider font-semibold opacity-65 mb-1.5">
                  Direct Email Channel
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-editorial-mono text-sm sm:text-base md:text-lg font-bold">
                    sifat.01938168@gmail.com
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-2 rounded-sm hover:opacity-75 transition-opacity cursor-pointer"
                    title="Copy email to clipboard"
                    aria-label="Copy email address"
                  >
                    {copiedEmail ? (
                      <Check className={`w-4 h-4 ${blueText}`} />
                    ) : (
                      <Copy className="w-4 h-4 opacity-75" />
                    )}
                  </button>
                </div>
                {copiedEmail && (
                  <span className={`mt-1.5 block text-xs font-editorial-mono font-medium ${blueText}`}>
                    Copied to clipboard.
                  </span>
                )}
              </div>

              {/* Location details */}
              <div className="space-y-2 text-xs sm:text-sm font-editorial-mono opacity-85 font-medium">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#E83B2E]" />
                  <span>Chittagong 4000, Bangladesh</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className={`w-4 h-4 ${blueText}`} />
                  <span>Time Zone: GMT+6 (BST)</span>
                </div>
              </div>

              {/* Signature Colophon Mark */}
              <div className="pt-4 border-t border-current/15">
                <span className="block font-editorial-mono text-xs uppercase tracking-wider opacity-60 mb-2 font-medium">
                  Sign-off Colophon
                </span>
                <div className="flex items-center gap-4">
                  <ArabiSignature
                    className="w-16 h-12"
                    theme={theme}
                  />
                  <div className="font-editorial-mono text-xs tracking-wider uppercase opacity-80 font-medium">
                    <span className="font-bold">SIFAT SIDDIQUE (ARABI)</span>
                    <span className="block text-[10px] opacity-75">Chittagong · 2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="md:col-span-7">
              {formSubmitted ? (
                <div
                  className={`p-7 rounded-sm border text-center space-y-4 ${
                    isNoir
                      ? 'bg-[#14161F] border-[#252A3C]'
                      : 'bg-[#ECE4D0] border-[#D4CABB]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${isNoir ? 'bg-[#3D5CFF]/20 text-[#5577FF]' : 'bg-[#2946D3]/15 text-[#2946D3]'} flex items-center justify-center mx-auto`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <h3 className="font-editorial-serif text-2xl">Dispatch Received</h3>
                  <p className="font-editorial-sans text-sm opacity-90 max-w-sm mx-auto leading-relaxed">
                    Thank you, {contactForm.name || 'Visitor'}. Your correspondence has been logged. Responses are typically returned within 48 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormSubmitted(false);
                      setContactForm({ name: '', email: '', subject: '', message: '' });
                    }}
                    className={`mt-2 text-xs sm:text-sm font-editorial-mono uppercase tracking-wider font-bold ${blueText} hover:underline cursor-pointer`}
                  >
                    Send another note
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleContactSubmit}
                  className={`p-6 sm:p-7 rounded-sm border space-y-4.5 text-sm font-editorial-sans ${
                    isNoir
                      ? 'bg-[#13151D] border-[#252A3C]'
                      : 'bg-[#EFE7D5] border-[#D6CDBC]'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5 font-editorial-mono text-xs tracking-wider uppercase font-semibold opacity-85">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, name: e.target.value })
                        }
                        placeholder="e.g. Tariq Rahman"
                        className={`w-full px-3.5 py-2.5 rounded-sm border text-sm sm:text-base focus:outline-none ${isNoir ? 'focus:border-[#4D6CFA]' : 'focus:border-[#2946D3]'} ${
                          isNoir
                            ? 'bg-[#181A24] border-[#2E3345] text-[#F1EBDD]'
                            : 'bg-[#FAF6EC] border-[#D1C7B2] text-[#101116]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 font-editorial-mono text-xs tracking-wider uppercase font-semibold opacity-85">
                        Return Email
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, email: e.target.value })
                        }
                        placeholder="tariq@organization.org"
                        className={`w-full px-3.5 py-2.5 rounded-sm border text-sm sm:text-base focus:outline-none ${isNoir ? 'focus:border-[#4D6CFA]' : 'focus:border-[#2946D3]'} ${
                          isNoir
                            ? 'bg-[#181A24] border-[#2E3345] text-[#F1EBDD]'
                            : 'bg-[#FAF6EC] border-[#D1C7B2] text-[#101116]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-editorial-mono text-xs tracking-wider uppercase font-semibold opacity-85">
                      Subject / Intent
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, subject: e.target.value })
                      }
                      placeholder="e.g. Venture Partnership Inquiry"
                      className={`w-full px-3.5 py-2.5 rounded-sm border text-sm sm:text-base focus:outline-none ${isNoir ? 'focus:border-[#4D6CFA]' : 'focus:border-[#2946D3]'} ${
                        isNoir
                          ? 'bg-[#181A24] border-[#2E3345] text-[#F1EBDD]'
                          : 'bg-[#FAF6EC] border-[#D1C7B2] text-[#101116]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-editorial-mono text-xs tracking-wider uppercase font-semibold opacity-85">
                      Message Note
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, message: e.target.value })
                      }
                      placeholder="Concise outline of what you'd like to discuss or build together."
                      className={`w-full px-3.5 py-2.5 rounded-sm border text-sm sm:text-base focus:outline-none ${isNoir ? 'focus:border-[#4D6CFA]' : 'focus:border-[#2946D3]'} ${
                        isNoir
                          ? 'bg-[#181A24] border-[#2E3345] text-[#F1EBDD]'
                          : 'bg-[#FAF6EC] border-[#D1C7B2] text-[#101116]'
                      }`}
                    />
                  </div>

                  {sendError && (
                    <p role="alert" className="font-editorial-mono text-xs sm:text-sm font-medium text-[#E83B2E]">
                      {sendError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSending}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-sm ${blueBg} text-[#F1EBDD] font-bold font-editorial-mono uppercase tracking-wider text-xs sm:text-sm ${blueHover} transition-colors cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSending ? 'Transmitting…' : 'Transmit Correspondence'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      )}

      {/* FOOTER */}
      <footer
        className={`mt-24 border-t py-12 transition-colors duration-200 ${
          isOtherwiseArmed
            ? 'bg-[#06070A] border-[#1C1F2B] text-[#F1EBDD]/70'
            : isNoir
            ? 'bg-[#0E0F14] border-[#1C1F2B] text-[#F1EBDD]/70'
            : 'bg-[#E7DFCE] border-[#D4C9B4] text-[#101116]/70'
        }`}
      >
        <div className="max-w-4xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs sm:text-sm font-editorial-mono font-medium">
          <div className="flex items-center gap-3">
            <ArabiSignature
              className="w-11 h-9 opacity-85"
              theme={activeTheme}
            />
            <span className="font-bold text-current opacity-95">SIFAT SIDDIQUE (ARABI)</span>
            <span>·</span>
            <span>Chittagong, Bangladesh</span>
            <span>·</span>
            <span>2026</span>
          </div>

          <div className="flex items-center gap-4 text-xs uppercase tracking-wider font-semibold">
            <span>{isOtherwiseArmed ? 'Layer 02: Digital Exhibition' : 'Layer 01: Editorial Monograph'}</span>
            <span>·</span>
            <span className={isOtherwiseArmed ? `${blueText} font-bold` : 'opacity-60'}>
              {isOtherwiseArmed ? 'Section W: Artistic' : 'Section L: Unimaginative'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProjectModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        theme={theme}
      />
    </div>
  );
}
