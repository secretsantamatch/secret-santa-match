import type React from 'react';

// FIX: Added global declaration for window.gtag to resolve TypeScript errors across the application.
declare global {
  interface Window {
    gtag: (command: 'event', eventName: string, eventParams?: Record<string, any>) => void;
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
  id?: string; // Only used client-side for hash, not a DB id
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
  backgroundOptions: BackgroundOption[]; // Loaded client-side, not stored in URL
  views?: Record<string, any>; // FIX: Added optional 'views' property for tracking link views.
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
}

export interface WEGame {
    gameId: string;
    organizerKey: string;
    participants: WEParticipant[];
    turnOrder: WEParticipant[];
    rules: WERules;
    theme: WETheme;
    currentPlayerIndex: number;
    isStarted: boolean;
    isFinished: boolean;
    history: string[]; // Keeping simple string array for backward compat/simple display
    createdAt: string;
}