export type SessionStep =
  | 'idle'
  | 'preparing'
  | 'countdown'
  | 'capturing'
  | 'reviewing'
  | 'editing'
  | 'exporting'
  | 'completed'
  | 'error';

export interface PhotoCapture {
  id: string;
  index: number; // 0..3
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: number;
}

export type ThemeId =
  | 'classic'
  | 'black-and-white'
  | 'vintage'
  | 'korean-life4cuts'
  | 'polaroid'
  | 'film-90s'
  | 'elegant-black'
  | 'romantic'
  | 'party'
  | 'minimal'
  | 'color-studio'
  | 'fun-ar';

export type FormatId =
  | 'strip-vertical' // 1 x 4
  | 'grid-2x2' // 2 x 2
  | 'double-strip' // 2 x (1 x 4)
  | 'polaroid-collage' // 4 polaroid tiles
  | 'postcard' // 4 x 6 horizontal
  | 'social-square'; // 1:1

export type FilterPresetId =
  | 'natural'
  | 'black-and-white'
  | 'sepia'
  | 'vintage'
  | 'film-grain'
  | 'warm'
  | 'cool'
  | 'soft'
  | 'high-contrast'
  | 'faded'
  | 'cinematic';

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  temperature: number; // -100 to 100
  sepia: number; // 0 to 100
  grayscale: boolean;
  vignette: number; // 0 to 100
  grain: number; // 0 to 100
  filterPreset: FilterPresetId;
}

export type AccessoryId =
  | 'aviator-sunglasses'
  | 'wayfarer-sunglasses'
  | 'round-retro-sunglasses'
  | 'futuristic-visor'
  | 'heart-sunglasses'
  | 'cowboy-hat'
  | 'party-hat'
  | 'crown'
  | 'mustache'
  | 'cat-ears'
  | 'wig';

export interface FacePose {
  roll: number;
  pitch: number;
  yaw: number;
  center: { x: number; y: number };
  eyeDistance: number;
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  noseTip: { x: number; y: number };
  mouthCenter: { x: number; y: number };
  scale: number;
}

export interface PlacedAccessory {
  id: string;
  accessoryId: AccessoryId;
  x: number; // normalized 0..1 or canvas px
  y: number; // normalized 0..1 or canvas px
  scale: number;
  rotation: number; // radians
  photoIndex?: number;
}

export interface ColorStudioBackground {
  type: 'solid' | 'linear-gradient' | 'radial-gradient';
  primaryColor: string;
  secondaryColor?: string;
  angle?: number;
  perPhotoColors?: string[];
}

export interface PrintFormatConfig {
  id: FormatId;
  name: string;
  aspectRatio: number;
  canvasWidth: number;
  canvasHeight: number;
  margin: number;
  spacing: number;
  headerHeight: number;
  footerHeight: number;
  photoSlots: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  }>;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  backgroundColor: string;
  textColor: string;
  frameBorderColor: string;
  fontFamily: string;
  defaultFilter: FilterPresetId;
  showDate: boolean;
  defaultFormat: FormatId;
  decorations?: {
    stickers?: string[];
    confetti?: boolean;
    polaroidBottom?: boolean;
    subtleBorder?: boolean;
    stripDividers?: boolean;
  };
}

export interface StoredPrint {
  id: string;
  createdAt: number;
  themeId: ThemeId;
  formatId: FormatId;
  jpegBlob: Blob;
  thumbnailUrl: string;
  originalPhotos: Blob[];
  adjustments: ImageAdjustments;
  placedAccessories: PlacedAccessory[];
  customText?: string;
  eventName?: string;
  colorStudioBg?: ColorStudioBackground;
}

export interface EventKioskSettings {
  enabled: boolean;
  eventName: string;
  eventDate: string;
  logoUrl?: string;
  accentColor: string;
  idleTimeoutSeconds: number; // e.g. 60
  allowedThemes: ThemeId[];
}
