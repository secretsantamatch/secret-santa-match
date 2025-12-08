import type React from 'react';

declare global {
  interface Window {
    gtag: (command: 'event', eventName: string, eventParams?: Record<string, any>) => void;
    dataLayer: unknown[];
  }
}

export interface Participant {
  id: string;
  name: string;
  interests: string;
  likes: string;
  dislikes: string;
  links: string[];
  budget: string;
}

export interface Exclusion {
  p1: string;
  p2: string;
}

export interface Assignment {
  giverId: string;
  receiverId: string;
}

export interface Match {
  giver: Participant;
  receiver: Participant;
}

export type OutlineSizeSetting = 'thin' | 'normal' | 'thick';
export type FontSizeSetting = 'normal' | 'large' | 'extra-large';
export type FontTheme = 'classic' | 'elegant' | 'modern' | 'whimsical';

export interface BackgroundOption {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  imageUrl: string;
  defaultTextColor?: string;
  cardText?: {
    greeting: string;
    intro: string;
    wishlistLabel: string;
  };
}

export interface ExchangeData {
  id?: string;
  p: Participant[];
  matches: { g: string; r: string }[];
  exclusions: Exclusion[];
  assignments: Assignment[];
  eventDetails: string;
  bgId: string;
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
  backgroundOptions: BackgroundOption[];
  views?: Record<string, any>;
}

export interface Resource {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    linkUrl: string;
    type: string;
    lastUpdated?: string;
    keywords?: string[];
}

export interface Debt {
    id: number;
    name: string;
    balance: number;
    apr: number;
    minPaymentPercent: number;
    minPaymentFlat: number;
}

export interface PayoffResult {
    months: number;
    totalInterest: number;
    totalPaid: number;
}

export interface CalculatorResult {
    totalMinPayment: number;
    scenarios: (PayoffResult & { debtFreeYear: number | string })[];
    customPaymentTotal: number;
    customResults: PayoffResult;
    customYear: number | string;
    customInterestSaved: number;
    weightedAPR: number;
    interestVsPrincipal: { name: string; value: number; fill: string; }[];
    moneySavingTips: { label: string; amount: number; description: string; icon: React.FC<any>; }[];
}


// --- WHITE ELEPHANT TYPES ---

export interface WEParticipant {
    id: string;
    name: string;
}

export type WETheme = 'classic' | 'funny' | 'useful' | 'regift';

export interface WERules {
    stealLimit: number;
    noStealBack: boolean;
}

export interface WEEvent {
    type: 'info' | 'steal' | 'open' | 'start' | 'end';
    message: string;
    timestamp: number;
    payload?: {
        actor?: string;
        target?: string;
        gift?: string;
    }; 
}

export interface WEReaction {
    id: string;
    emoji: string;
    timestamp: number;
}

export interface WEGame {
    gameId: string;
    organizerKey: string;
    groupName?: string;
    eventDetails?: string;
    participants: WEParticipant[];
    turnOrder: WEParticipant[];
    rules: WERules;
    theme: WETheme;
    currentPlayerIndex: number;
    isStarted: boolean;
    isFinished: boolean;
    finalRound: boolean; 
    history: string[];
    reactions: WEReaction[]; // New field for emojis
    giftState: Record<string, string>; // Maps Participant ID -> Gift Description
    createdAt: string;
    displacedPlayerId?: string | null;
    lastVictimId?: string | null;
    lastThiefId?: string | null;
    giftStealCounts: Record<string, number>;
}

// --- POTLUCK TYPES ---

export interface PotluckCategory {
    id: string;
    name: string;
    limit?: number;
}

export interface PotluckDish {
    id: string;
    categoryId: string;
    guestName: string;
    dishName: string;
    dietary: string[]; // 'gf', 'v', 'vg', 'df', 'nf'
    timestamp: number;
}

export interface PotluckEvent {
    id: string; // adminKey
    publicId: string; // read key
    title: string;
    date: string;
    description: string;
    hostName: string;
    categories: PotluckCategory[];
    dishes: PotluckDish[];
    createdAt: string;
}