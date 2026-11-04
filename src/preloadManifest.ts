/**
 * Every image the site can show, in the order the preloader should fetch them (see src/preloader.ts).
 *
 * This is a curated list on purpose, not a blanket glob of src/assets: two files in there are not used
 * anywhere (2026-10-01_21_17_05_881_0600.jpg, 1790705221151~2.jpg), and a glob would bundle and download them
 * for nothing. The exhibition images come straight from exhibitionData, so they can never drift.
 *
 * ADDING A NEW IMAGE TO THE SITE? Import it here too (and push it into the right list below), otherwise it
 * simply isn't preloaded and will load the normal way, when it first appears.
 */
import portrait from './assets/images/1789934975007~2.jpg'; // Section L hero (LiquidScreenPhoto)
import signature from './assets/images/20260117_020006-removebg-preview.png'; // header, footer, Section W
import projectNoire from './assets/images/project_noire_1790455623648.jpg';
import projectRemainder from './assets/images/project_remainder_1790455636386.jpg';
import sectionWHero from './assets/images/1790870264368__1_.jpg'; // Section W hero photograph
import whyPoster from './assets/images/why-makes-me-different-poster.jpeg'; // scroll split card
import instagramEmblem from './assets/contact/instagram.jpg';
import vscoEmblem from './assets/contact/vsco.jpg';
import whatsappEmblem from './assets/contact/whatsapp.jpg';
import emailEmblem from './assets/contact/email.jpg';
import { CAMERA_PHOTOS, OBJECTS, noireArchive, noireHalftone } from './components/exhibition/exhibitionData';

/**
 * What a visitor sees the moment the page opens (Section L hero): the portrait and the signature. ~230 KB.
 * These, and only these, gate the preloader curtain (see WAIT_FOR_ALL_IMAGES in src/preloader.ts), so the
 * first screen is never held behind megabytes of images that sit far below the fold.
 */
export const FIRST_VIEW_IMAGES: string[] = [portrait, signature];

/**
 * Everything else, nearest-to-the-top first: the two project photographs, Section W's hero, then the pinboard
 * stickers, the poster, the contact emblems, the camera gallery and finally the two big NOIRÉ sheets (~4.4 MB).
 */
export const REST_IMAGES: string[] = [
  projectNoire,
  projectRemainder,
  sectionWHero,
  ...OBJECTS.map((o) => o.src),
  whyPoster,
  instagramEmblem,
  vscoEmblem,
  whatsappEmblem,
  emailEmblem,
  ...CAMERA_PHOTOS,
  noireHalftone,
  noireArchive,
];
