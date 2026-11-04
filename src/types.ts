export type ThemeMode = 'noir' | 'ivory';

export interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  tagline: string;
  description: string;
  focus: string[];
  deliverables: string[];
  status: 'Complete' | 'Active' | 'Archived' | 'In Progress';
  image?: string;
  /** Describes what the image actually shows; falls back to the project title when absent. */
  imageAlt?: string;
  linkText?: string;
  linkUrl?: string;
}
