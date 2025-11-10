import type { ElementType } from 'react';

// FIX: Add gtag to the window interface to fix TypeScript errors in other files.
declare global {
  interface Window {
    gtag: (command: 'event', action: string, params?: Record<string, any>) => void;
  }
}

export interface Participant {
    id: string;
    name: string;
    interests: string;
    likes: string;
    dislikes: string;
    links: string;
    budget: string;
}

export interface Exclusion {
    p1: string; // participant id
    p2: string; // participant id
}

export interface Assignment {
    giverId: string;
    receiverId: string;
}

export interface Match {
    giver: Participant;
    receiver: Participant;
}

export interface BackgroundOption {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    icon?: string;
    defaultTextColor?: string;
    cardText?: {
        greeting: string;
        intro: string;
        wishlistLabel: string;
    };
}

export type OutlineSizeSetting = 'thin' | 'normal' | 'thick';
export type FontSizeSetting = 'normal' | 'large' | 'extra-large';
export type FontTheme = 'classic' | 'elegant' | 'modern' | 'whimsical';

export interface ExchangeData {
  p: Participant[];
  matches: { g: string; r: string }[];
  eventDetails: string;
  backgroundOptions: BackgroundOption[];
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
    interestVsPrincipal: { name: string; value: number; fill: string }[];
    moneySavingTips: { label: string; amount: number; description: string; icon: ElementType }[];
}
