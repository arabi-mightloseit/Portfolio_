import React from 'react';
import instagramEmblem from '../assets/contact/instagram.jpg';
import vscoEmblem from '../assets/contact/vsco.jpg';
import whatsappEmblem from '../assets/contact/whatsapp.jpg';
import emailEmblem from '../assets/contact/email.jpg';

// Section W only. Four contact emblems on one strict grid: 2 x 2 on phones, 1 x 4 from md up.
// Every cell is identical: a square emblem with its visible text centred underneath.
// The whole cell is the link, so the emblem and the text both click through.
interface Emblem {
  name: string; // used for the accessible label only, never shown
  text: string; // the only text people see
  href: string;
  image: string;
  newTab: boolean;
}

const EMBLEMS: ReadonlyArray<Emblem> = [
  {
    name: 'Instagram',
    text: 'gawd_forbid',
    href: 'https://www.instagram.com/gawd_forbid?stkn=emQxeGx2ZGZqZGcz',
    image: instagramEmblem,
    newTab: true,
  },
  {
    name: 'VSCO',
    text: 'aaarooobi',
    href: 'https://vsco.co/aaarooobi',
    image: vscoEmblem,
    newTab: true,
  },
  {
    name: 'WhatsApp',
    text: '01976912749',
    href: 'https://wa.me/8801976912749', // Bangladesh +880, leading 0 dropped
    image: whatsappEmblem,
    newTab: true,
  },
  {
    name: 'Email',
    text: 'sifat.01938168@gmail.com',
    href: 'mailto:sifat.01938168@gmail.com',
    image: emailEmblem,
    newTab: false,
  },
];

interface ContactEmblemsProps {
  isDark: boolean;
}

export const ContactEmblems: React.FC<ContactEmblemsProps> = ({ isDark }) => (
  // The negative top margin pulls the grid up into the empty space under the colophon.
  <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 -mt-20 sm:-mt-28 pb-16">
    <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 justify-items-center list-none p-0 m-0">
      {EMBLEMS.map((e) => (
        <li key={e.name} className="w-full flex justify-center">
          <a
            href={e.href}
            target={e.newTab ? '_blank' : undefined}
            rel={e.newTab ? 'noopener noreferrer' : undefined}
            aria-label={`${e.name}: ${e.text}`}
            className="group flex w-full max-w-[11rem] flex-col items-center gap-4 focus-visible:outline-none"
          >
            <img
              src={e.image}
              alt=""
              width={80}
              height={80}
              draggable={false}
              loading="lazy"
              decoding="async"
              className={`h-16 w-16 md:h-20 md:w-20 rounded-2xl object-cover select-none ring-1 transition-shadow duration-300 group-hover:ring-[#3D5CFF] group-focus-visible:ring-[#3D5CFF] ${
                isDark ? 'ring-white/10' : 'ring-black/10'
              }`}
            />
            <span className="w-full text-center font-editorial-mono text-[11px] md:text-xs tracking-tight break-all opacity-75 transition-colors duration-300 group-hover:text-[#3D5CFF] group-hover:opacity-100 group-focus-visible:text-[#3D5CFF] group-focus-visible:opacity-100">
              {e.text}
            </span>
          </a>
        </li>
      ))}
    </ul>
  </div>
);
