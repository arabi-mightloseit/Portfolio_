import React, { useState } from 'react';
import { SignatureSwitch } from './SignatureSwitch';
import { ArabiSignature } from './ArabiSignature';
import { ThemeMode } from '../types';
import { Menu, X } from 'lucide-react';
import './PortfolioHeader.css';

interface NavigationProps {
  isArmed: boolean;
  onToggleArmed: (armed: boolean) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  isArmed,
  onToggleArmed,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isNoir = theme === 'noir';

  const navLinks = isArmed
    ? []
    : [
        { label: 'About', href: '#about' },
        { label: 'Focus', href: '#interests' },
        { label: 'Work', href: '#projects' },
        { label: 'Approach', href: '#approach' },
        { label: 'Contact', href: '#contact' },
      ];

  // Smooth editorial glide navigation with sticky header offset compensation
  const handleGlide = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="portfolio-header sticky top-0 z-40 w-full text-[#F1EBDD]">
      {/* NOTE: h-14 md:h-16 is a layout contract (see PortfolioHeader.css) — keep in sync. */}
      <div className="header-container h-14 md:h-16">
        {/* Left Zone: Signature logo */}
        <a href="/" className="brand-logo" aria-label="Home">
          <ArabiSignature className="signature-img" variant="light" />
        </a>

        {/* Center Zone: Clean Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-editorial-sans font-semibold tracking-wide">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleGlide(e, link.href)}
              className="transition-colors duration-150 relative py-1 cursor-pointer text-[#F1EBDD]/80 hover:text-[#5577FF]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Zone: Palette Mode Toggle, Section Switch & Mobile Menu Trigger */}
        <div className="header-actions">
          {/* Palette Mode Selector [Noir / Ivory] - Hidden on Section W artistic */}
          {!isArmed && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`font-editorial-mono text-xs tracking-[0.16em] uppercase px-3 py-1.5 rounded-sm border-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isNoir
                  ? 'border-[#383E54] hover:border-[#525B7C] bg-[#181A22] text-[#F1EBDD] hover:bg-[#202330]'
                  : 'border-[#BAAE96] hover:border-[#8E826B] bg-[#E8DFC9] text-[#101116] hover:bg-[#DDD3BC]'
              }`}
              title="Toggle between Pure Black (#101116) and Warm Ivory (#F1EBDD)"
            >
              <span className="opacity-60">CANVAS:</span>{' '}
              <span className={`font-bold ${isNoir ? 'text-[#5577FF]' : 'text-[#2946D3]'}`}>
                {isNoir ? 'NOIR' : 'IVORY'}
              </span>
            </button>
          )}

          {/* Section L / Section W switch */}
          <SignatureSwitch
            isArmed={isArmed}
            onToggle={onToggleArmed}
            theme={theme}
          />

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-sm hover:opacity-75 transition-opacity cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-b px-4 py-4 space-y-3 font-editorial-sans text-sm ${
            isNoir
              ? 'bg-[#12141C] border-[#222533] text-[#F1EBDD]'
              : 'bg-[#ECE4D0] border-[#D6CDBC] text-[#101116]'
          }`}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleGlide(e, link.href)}
              className={`block py-1 opacity-80 hover:opacity-100 ${
                isNoir ? 'hover:text-[#5577FF]' : 'hover:text-[#2946D3]'
              }`}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-current/10 flex items-center justify-between text-xs font-editorial-mono opacity-60">
            <span>CHITTAGONG, BANGLADESH</span>
            <span>GMT+6</span>
          </div>
        </div>
      )}
    </header>
  );
};
