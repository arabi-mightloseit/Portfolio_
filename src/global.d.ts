declare global {
  interface Window {
    /** Set by src/sectionSwitch.ts so the runtime can never be installed twice. */
    __sxLoaded?: boolean;
    /** Only present if a page ever loads GSAP's ScrollToPlugin; the runtime uses it when it can. */
    gsap?: {
      plugins?: { scrollTo?: unknown };
      to?: (target: Window, vars: Record<string, unknown>) => unknown;
    };
    ScrollTrigger?: { refresh?: () => void };
    ScrollToPlugin?: unknown;
  }
}

export {};
