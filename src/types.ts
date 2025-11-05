import type React from 'react';

export interface Participant {
  id: string;
  name: string;
  interests: string; // New field for comma-separated keywords
  likesDislikes: string; // New field for detailed notes
  links: string; // New field for specific product URLs
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

export interface CardStyleData {
  bgId: string;
  bgImg: string | null;
  txtColor: string;
  outline: boolean;
  outColor: string;
  outSize: OutlineSizeSetting;
  fontSize: FontSizeSetting;
  font: FontTheme;
  line: number;
  greet: string;
  intro: string;
  wish: string;
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

export interface ExchangeData {
    matches: { g: string; r: string; }[];
    p: Participant[]; // Renamed from participants
    eventDetails: string;
    exclusions: Exclusion[];
    assignments: Assignment[];
    bgId: string; // Renamed from backgroundId
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
    exchangeDate?: string;
    exchangeTime?: string;
    pageTheme?: string;
}

export interface PdfCardOptions extends CardStyleData {
  eventDetails: string;
  backgroundOptions: BackgroundOption[];
}

export interface Resource {
  id: string;
  type: 'Free Download' | 'Guide & Tips' | 'Article' | 'Guide & Printable';
  title: string;
  description: string;
  thumbnailUrl: string;
  linkUrl: string;
  lastUpdated?: string;
  keywords?: string[];
}

// Types for Minimum Payment Calculator
export interface Debt {
  id: number;
  name: string;
  balance: number;
  apr: number;
  minPaymentPercent: number;
  minPaymentFlat: number;
}

export interface MoneySavingTip {
  label: string;
  amount: number;
  description: string;
  icon: React.ElementType;
}

export interface PayoffResult {
  months: number;
  totalInterest: number;
  totalPaid: number;
}

export interface ScenarioResult extends PayoffResult {
  debtFreeYear: number | string;
}

export interface CalculatorResult {
  totalMinPayment: number;
  scenarios: ScenarioResult[];
  customPaymentTotal: number;
  customResults: PayoffResult;
  customYear: number | string;
  customInterestSaved: number;
  weightedAPR: number;
  interestVsPrincipal: { name: string; value: number; fill: string; }[];
  moneySavingTips: MoneySavingTip[];
}
