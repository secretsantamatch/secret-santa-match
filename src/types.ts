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
  links: string;
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
  imageUrl: string;
  defaultTextColor?: string;
  cardText?: {
    greeting: string;
    intro: string;
    wishlistLabel: string;
  };
}

export interface ExchangeData {
  id?: string; // For Firebase document ID
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
  backgroundOptions: BackgroundOption[]; // Added client-side
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