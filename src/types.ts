export interface Participant {
  id: string;
  name: string;
  notes: string;
  budget: string;
}

export interface Match {
  giver: Participant;
  receiver: Participant;
}

export interface MatchById {
  g: string; // giverId
  r: string; // receiverId
}

export interface Exclusion {
  p1: string; // participant ID
  p2: string; // participant ID
}

export interface Assignment {
  giverId: string;
  receiverId: string;
}

export type FontSizeSetting = 'normal' | 'large' | 'extra-large';
export type OutlineSizeSetting = 'thin' | 'normal' | 'thick';
export type FontTheme = 'classic' | 'elegant' | 'modern' | 'whimsical';

export interface BackgroundOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
  defaultTextColor: string;
  cardText?: {
    greeting?: string;
    intro?: string;
    wishlistLabel?: string;
  };
}

// Data for URL sharing
export interface ExchangeData {
  // Fix: Changed from Omit<Participant, 'id'>[] to Participant[] to include IDs, which are necessary for matching.
  p: Participant[];
  m: MatchById[];
  details: string;
  style: CardStyle;
  th: string; // page theme
  revealAt?: number;
  rt?: string; // reveal time
}

export interface CardStyle {
    bgId: string;
    bgImg: string | null;
    txtColor: string;
    useOutline: boolean;
    outColor: string;
    outSize: OutlineSizeSetting;
    fontSize: FontSizeSetting;
    font: FontTheme;
    line: number;
    greet: string;
    intro: string;
    wish: string;
}
