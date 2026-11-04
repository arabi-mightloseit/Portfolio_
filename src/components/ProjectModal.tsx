import React, { useEffect } from 'react';
import { Project, ThemeMode } from '../types';
import { X, ExternalLink, ArrowRight } from 'lucide-react';

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  theme,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const isNoir = theme === 'noir';
  const blueText = isNoir ? 'text-[#5577FF]' : 'text-[#2946D3]';
  const blueBg = isNoir ? 'bg-[#3D5CFF]' : 'bg-[#2946D3]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-3xl rounded-sm border p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto ${
          isNoir
            ? 'bg-[#101116] border-[#2A2E3D] text-[#F1EBDD]'
            : 'bg-[#F1EBDD] border-[#D1C7B2] text-[#101116]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-4 border-b border-current/10">
          <div className="flex items-center gap-3">
            <span className={`font-editorial-mono text-xs sm:text-sm tracking-[0.2em] uppercase font-bold ${blueText}`}>
              Project Specification
            </span>
            <span className="text-xs opacity-40">/</span>
            <span className="font-editorial-mono text-xs sm:text-sm tracking-[0.16em] uppercase opacity-75 font-medium">
              {project.category}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                isNoir ? 'hover:bg-white/10 text-[#F1EBDD]' : 'hover:bg-black/10 text-[#101116]'
              }`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Title & Tagline */}
        <div className="mt-6">
          <h2 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
            {project.title}
          </h2>
          <p className="mt-2 text-base sm:text-lg font-editorial-sans opacity-85 max-w-xl">
            {project.tagline}
          </p>
        </div>

        {/* Project Image Frame (if exists) */}
        {project.image && (
          <div className="mt-6 overflow-hidden rounded-sm border border-current/10">
            <img
              src={project.image}
              alt={project.imageAlt ?? project.title}
              width={1376}
              height={768}
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-cover max-h-[420px]"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 my-6 border-y border-current/15 font-editorial-mono text-xs sm:text-sm">
          <div>
            <span className="block opacity-65 uppercase tracking-wider text-xs font-semibold">Timeline</span>
            <span className="font-editorial-sans font-medium mt-1 block text-sm sm:text-base">{project.year}</span>
          </div>
          <div>
            <span className="block opacity-65 uppercase tracking-wider text-xs font-semibold">Status</span>
            <span className="font-editorial-sans font-medium mt-1 flex items-center gap-1.5 text-sm sm:text-base">
              <span className={`w-2 h-2 rounded-full ${blueBg}`} />
              {project.status}
            </span>
          </div>
          <div>
            <span className="block opacity-65 uppercase tracking-wider text-xs font-semibold">Role</span>
            <span className="font-editorial-sans font-medium mt-1 block text-sm sm:text-base">Lead Design & Strategy</span>
          </div>
          <div>
            <span className="block opacity-65 uppercase tracking-wider text-xs font-semibold">Origin</span>
            <span className="font-editorial-sans font-medium mt-1 block text-sm sm:text-base">Chittagong, BD</span>
          </div>
        </div>

        {/* Project Overview */}
        <div className="space-y-5 font-editorial-sans text-sm sm:text-base leading-relaxed opacity-90">
          <div>
            <h4 className={`font-editorial-mono text-xs sm:text-sm tracking-[0.2em] uppercase mb-1.5 font-bold ${blueText}`}>
              Overview & Problem Architecture
            </h4>
            <p>{project.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
            <div>
              <h4 className="font-editorial-mono text-xs sm:text-sm tracking-[0.2em] uppercase mb-2 opacity-70 font-semibold">
                Core Focus Vectors
              </h4>
              <ul className="space-y-2 font-editorial-sans text-sm">
                {project.focus.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E83B2E]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-editorial-mono text-xs sm:text-sm tracking-[0.2em] uppercase mb-2 opacity-70 font-semibold">
                Primary Deliverables
              </h4>
              <ul className="space-y-2 font-editorial-sans text-sm">
                {project.deliverables.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${blueBg}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Link Footer */}
        {project.linkUrl && (
          <div className="mt-8 pt-4 border-t border-current/15 flex items-center justify-between">
            <span className="font-editorial-mono text-xs opacity-70 font-medium">
              Direct Reference Link
            </span>
            <a
              href={project.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 font-editorial-sans text-sm font-semibold ${blueText} hover:underline`}
            >
              {project.linkText || 'Open External Asset'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
