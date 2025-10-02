// FIX: Replaced placeholder content with type definitions.
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

export interface CardStyleData {
  backgroundId: string;
  customBackground: string | null;
  textColor: string;
  useTextOutline: boolean;
  outlineColor: string;
  outlineSize: OutlineSizeSetting;
  fontSizeSetting: FontSizeSetting;
  fontTheme: FontTheme;
  lineSpacing: number;
  greetingText: string;
  introText: string;
  wishlistLabelText: string;
}

export interface ExchangeData {
    // FIX: Corrected type for participants array.
    p: Omit<Participant, 'id'>[]; // Participants
    m: { g: number; r: number }[]; // Matches (by index)
    style: CardStyleData;
    e?: string; // eventDetails
    rd?: string; // revealDate
}
