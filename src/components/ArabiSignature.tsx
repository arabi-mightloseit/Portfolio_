import React from 'react';
import signaturePng from '../assets/images/20260117_020006-removebg-preview.png';

interface ArabiSignatureProps {
  className?: string;
  theme?: 'noir' | 'ivory';
  variant?: 'light' | 'dark' | 'auto';
}

/**
 * Authentic signature image added directly by Arabi without modifying shape or lines.
 * Only the contrast color is managed so it remains crisply visible:
 * - On Noir canvas / dark backgrounds: inverted so black ink becomes crisp ivory/white (#F1EBDD).
 * - On Ivory canvas / light backgrounds: retained in authentic dark black ink.
 */
export const ArabiSignature: React.FC<ArabiSignatureProps> = ({
  className = 'w-6 h-6',
  theme = 'noir',
  variant = 'auto',
}) => {
  // Determine if it should be inverted (light on dark)
  const isLight =
    variant === 'light' || (variant === 'auto' && theme === 'noir');

  return (
    <img
      src={signaturePng}
      alt="Arabi signature"
      className={`${className} object-contain select-none pointer-events-none transition-[filter] duration-200 ${
        isLight
          ? 'brightness-0 invert opacity-100 contrast-125'
          : 'brightness-0 opacity-100 contrast-125'
      }`}
      draggable={false}
    />
  );
};
