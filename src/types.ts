import React from 'react';

export interface Participant {
    id: string;
    name: string;
    interests: string;
    likes: string;
    dislikes: string;
    links: string;
    budget: string;
    wishlistId?: string; // Added for the Living Wishlist feature
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

export interface MatchId {
    g: string; // giverId
    r: string; // receiverId
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
    matches: MatchId[];
    exclusions: Exclusion[];
    assignments: Assignment[];
    eventDetails: string;
    exchangeDate: string;
    exchangeTime: string;
    // Styling options
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
    type: 'Free Download' | 'Guide & Tips' | 'Article' | 'Guide & Printable';
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

export interface MoneySavingTip {
    label: string;
    amount: number;
    description: string;
    icon: React.FC<any>;
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
    moneySavingTips: MoneySavingTip[];
}

export interface GiftPersona {
    name: string;
    description: string;
    categories: Record<string, string[]>;
}

export interface GiftItem {
    id: number;
    recipient: string;
    budget: number;
    actual: number;
}

export interface ExpenseItem {
    id: number;
    category: string;
    budget: number;
    actual: number;
}

// For Living Wishlist
export interface Wishlist {
    interests: string;
    likes: string;
    dislikes: string;
    links: string;
    budget: string;
}