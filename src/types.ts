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

export interface StyleData {
  bgId: string;
  bgImg: string | null;
  txtColor: string;
  outline: boolean;
  outColor: string;
  outSize: OutlineSizeSetting;
  font: FontTheme;
  fontSize: FontSizeSetting;
  line: number;
  greet: string;
  intro: string;
  wish: string;
}

export interface ExchangeData {
  p: Participant[]; // participants
  m: Match[];       // matches
  e: Exclusion[];   // exclusions
  a: Assignment[];  // assignments
  d: string;        // event details
  t: string;        // exchange date
  style: StyleData; // styling information
}

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
