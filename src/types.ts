export interface Participant {
  id: string;
  name: string;
  notes: string;
  budget: string;
  email?: string;
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

// Data structure for the URL-based sharing feature
export interface ExchangeData {
  p: Omit<Participant, 'id'>[]; // Participants
  m: { g: number; r: number }[]; // Matches (using indexes)
  e: string; // Event Details
  d: string; // Exchange Date (ISO string)
}
