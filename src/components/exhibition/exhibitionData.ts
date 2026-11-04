import noireButton from '../../assets/exhibition/buttons/noire.png';
import cameraButton from '../../assets/exhibition/buttons/camera.png';
import sewingButton from '../../assets/exhibition/buttons/sewing-machine.png';
import chessButton from '../../assets/exhibition/buttons/chess-piece.png';
import exclaimButton from '../../assets/exhibition/buttons/exclamation-marks.png';
import boxingButton from '../../assets/exhibition/buttons/boxing-gloves.png';

import noireHalftone from '../../assets/exhibition/noire/halftone-print.png';
import noireArchive from '../../assets/exhibition/noire/archive-sheet.png';

export { noireHalftone, noireArchive };

/**
 * CAMERA gallery photographs.
 * Drop the photos into  src/assets/exhibition/camera/  (jpg, jpeg, png, webp, avif).
 * They are picked up automatically, in filename order (01.jpg, 02.jpg, ... sorts naturally).
 * While the folder is empty the gallery shows numbered placeholder frames.
 */
const cameraModules = import.meta.glob('../../assets/exhibition/camera/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const CAMERA_PHOTOS: string[] = Object.keys(cameraModules)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  .map((key) => cameraModules[key]);

export type ExhibitId = 'noire' | 'camera' | 'sewing' | 'chess' | 'exclaim' | 'boxing';

/** Position of the sticker image box inside the stage, in % of the stage. `from` is where it starts, in % of its own size. */
export interface PinLayout {
  left: number;
  top: number;
  width: number;
  rot: number;
  from: { x: number; y: number; rot: number };
}

export interface ExhibitObject {
  id: ExhibitId;
  name: string;
  src: string;
  /** natural size of the PNG (used for the aspect ratio only) */
  w: number;
  h: number;
  /** visible silhouette inside the PNG: [x0, y0, x1, y1] as 0..1 fractions (the click target) */
  hit: [number, number, number, number];
  /** a point inside the solid sticker where the pin goes, 0..1 fractions */
  pin: [number, number];
  desk: PinLayout;
  mob: PinLayout;
  kind: 'noire' | 'gallery' | 'note';
  /** lines of the note, one per line */
  copy?: string[];
  link?: { href: string; label: string };
}

/**
 * Stage proportions. The layouts below were solved against the real alpha masks of the six PNGs so the
 * visible stickers keep a clear gap on both stages (desktop >= 46 / 1000 units, mobile >= 51 / 600 units).
 * Change a position and the gap is no longer guaranteed.
 */
export const STAGE_DESK = { w: 1000, h: 750 };
export const STAGE_MOB = { w: 600, h: 1040 };

// Arrival order = order of this array (NOIRÉ, camera, sewing machine, chess, exclamation marks, boxing gloves).
export const OBJECTS: ExhibitObject[] = [
  {
    id: 'noire',
    name: 'NOIRÉ',
    src: noireButton,
    w: 504,
    h: 495,
    hit: [0.0516, 0.0869, 0.9008, 0.899],
    pin: [0.3234, 0.3232],
    desk: { left: 2.11, top: 8.65, width: 32.97, rot: -3.5, from: { x: -10, y: -90, rot: -9 } },
    mob: { left: 2.19, top: 3.37, width: 51.42, rot: -3.0, from: { x: -20, y: -90, rot: -9 } },
    kind: 'noire',
  },
  {
    id: 'camera',
    name: 'Camera',
    src: cameraButton,
    w: 500,
    h: 500,
    hit: [0.07, 0.062, 0.93, 0.938],
    pin: [0.5, 0.108],
    desk: { left: 32.43, top: 1.91, width: 33.14, rot: 2.5, from: { x: 0, y: -100, rot: 8 } },
    mob: { left: 49.77, top: 4.96, width: 48.45, rot: 3.0, from: { x: 10, y: -95, rot: 8 } },
    kind: 'gallery',
  },
  {
    id: 'sewing',
    name: 'Sewing machine',
    src: sewingButton,
    w: 535,
    h: 466,
    hit: [0.0056, 0.03, 0.9944, 0.9549],
    pin: [0.5776, 0.1202],
    desk: { left: 64.73, top: 15.29, width: 31.55, rot: -2.0, from: { x: 12, y: -90, rot: -8 } },
    mob: { left: 5.07, top: 44.81, width: 49.22, rot: -2.5, from: { x: -75, y: 5, rot: -9 } },
    kind: 'note',
    copy: ['I’ve wasted a stupid amount of fabric.', 'Then, somehow, it started looking like clothes.'],
  },
  {
    id: 'chess',
    name: 'Chess piece',
    src: chessButton,
    w: 500,
    h: 500,
    hit: [0.3, 0.072, 0.7, 0.926],
    pin: [0.506, 0.11],
    desk: { left: -4.75, top: 49.72, width: 37.5, rot: 3.0, from: { x: -70, y: 10, rot: -10 } },
    mob: { left: 49.17, top: 38.37, width: 58.33, rot: 3.5, from: { x: 70, y: 0, rot: 9 } },
    kind: 'note',
    copy: ['Barely scraped 1000 ELO.', 'Still one of my favourite ways to lose an evening.'],
    link: { href: 'https://www.chess.com/member/arobi999', label: 'chess.com/member/arobi999' },
  },
  {
    id: 'exclaim',
    name: 'Two exclamation marks',
    src: exclaimButton,
    w: 500,
    h: 500,
    hit: [0.318, 0.216, 0.73, 0.762],
    pin: [0.506, 0.238],
    desk: { left: 20.37, top: 48.96, width: 46.12, rot: -4.0, from: { x: 0, y: 100, rot: 9 } },
    mob: { left: -10.98, top: 74.54, width: 68.77, rot: -4.0, from: { x: -60, y: 40, rot: 9 } },
    kind: 'note',
    copy: ['People remember the odd way I explained it.', 'That’s usually the point.'],
  },
  {
    id: 'boxing',
    name: 'Boxing gloves',
    src: boxingButton,
    w: 500,
    h: 500,
    hit: [0.106, 0.22, 0.892, 0.828],
    pin: [0.394, 0.246],
    desk: { left: 57.53, top: 49.57, width: 40.71, rot: 2.2, from: { x: 50, y: 40, rot: -9 } },
    mob: { left: 43.81, top: 77.78, width: 57.25, rot: 2.0, from: { x: 45, y: 70, rot: -9 } },
    kind: 'note',
    copy: ['2 years in.', 'Boxing + Muay Thai.', '17–2.', 'Still learning. Still getting hit.'],
  },
];

/** Scroll timeline (0..1 of the pinboard scroll area). Objects arrive one after another, then the board releases. */
export const ARRIVAL_START = 0.04;
export const ARRIVAL_STEP = 0.145;
export const ARRIVAL_LENGTH = 0.15;
export const arrivalWindow = (index: number): [number, number] => {
  const s = ARRIVAL_START + index * ARRIVAL_STEP;
  return [s, s + ARRIVAL_LENGTH];
};
export const ALL_PINNED_AT = arrivalWindow(OBJECTS.length - 1)[1] - 0.004;
