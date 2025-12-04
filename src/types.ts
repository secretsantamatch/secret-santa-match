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

// ============================================================================
// BABY POOL TYPES - Updated with all Phase 1 features
// ============================================================================

// --- Unit System ---
export type UnitSystem = 'imperial' | 'metric';

// --- Theme Keys ---
export type ThemeKey = 'sage' | 'ocean' | 'blush' | 'lavender' | 'roseGold' | 'midnight' | 'teddy' | 'cotton' | 'confetti';

// --- Additional Links (Clean Links Section) ---
export interface AdditionalLink {
    label: string;  // e.g., "Photo Album", "Meal Train", "GoFundMe"
    url: string;
}

// --- Baby Guess ---
export interface BabyGuess {
    id: string;
    guesserName: string;
    date: string;
    time: string;
    weightLbs: number;
    weightOz: number;
    length?: number;
    hairColor?: string;
    eyeColor?: string;
    gender: string;
    suggestedName: string;
    customAnswers?: Record<string, string>;
    score?: number;
    submittedAt?: string;
    
    // NEW: For multiples support (future)
    babyIndex?: number; // Which baby in multiples (1, 2, 3...)
}

// --- Name Vote Record ---
export interface NameVote {
    name: string;
    odedBy: string; // guesser ID or anonymous identifier
    votedAt: string;
}

// --- Baby Pool ---
export interface BabyPool {
    poolId: string;
    adminKey?: string;
    babyName: string;
    parentNames?: string;
    dueDate: string;
    theme: ThemeKey | string;
    registryLink: string;
    diaperFundLink?: string;
    
    // Field toggles - controls which inputs are shown to guests
    includeFields?: {
        time: boolean;
        weight: boolean;
        length: boolean;
        hair: boolean;
        eye: boolean;
        gender: boolean;
    };
    
    customQuestions?: string[];
    guesses: BabyGuess[];
    status: 'active' | 'completed';
    
    // Birth result data
    result?: BirthResult;
    
    createdAt: string;
    
    // =========================================================================
    // NEW PHASE 1 FIELDS
    // =========================================================================
    
    // --- Due Date Unknown ---
    dueDateUnknown?: boolean; // If true, dueDate may be empty
    
    // --- International Units ---
    unitSystem?: UnitSystem; // 'imperial' (lbs/in) or 'metric' (kg/cm)
    
    // --- Multiples Support ---
    isMultiples?: boolean;
    multiplesCount?: number; // 2 = twins, 3 = triplets, etc.
    
    // --- Prize/Gift Card ---
    prizeDescription?: string; // e.g., "$25 Amazon gift card", "Bragging rights!"
    
    // --- Guessing Deadline ---
    guessDeadline?: string; // ISO date string - no guesses after this date
    
    // --- Name Poll ---
    enableNamePoll?: boolean;
    nameOptions?: string[]; // List of name options to vote on
    nameVotes?: Record<string, number>; // { "Emma": 5, "Oliver": 3 }
    
    // --- Additional Links (Clean Links Section) ---
    additionalLinks?: AdditionalLink[];
    
    // --- Progress Bar Target ---
    targetGuessCount?: number; // Goal for progress bar (default 25)
    
    // --- Future Phase Fields (reserved) ---
    enableComments?: boolean;
    comments?: Comment[];
    teamMode?: boolean; // Team Boy vs Team Girl
    
    // --- Analytics (admin only) ---
    viewCount?: number;
    shareCount?: number;
    lastActivityAt?: string;
}

// --- Birth Result ---
export interface BirthResult {
    date: string;
    time: string;
    weightLbs: number;
    weightOz: number;
    length?: number;
    hairColor?: string;
    eyeColor?: string;
    gender: string;
    actualName: string;
    photoLink?: string;
    customAnswers?: Record<string, string>;
    
    // NEW: For multiples
    babies?: MultipleBabyResult[];
}

// --- Multiple Baby Result (for twins/triplets) ---
export interface MultipleBabyResult {
    babyNumber: number; // 1, 2, 3...
    name: string;
    date: string;
    time: string;
    weightLbs: number;
    weightOz: number;
    length?: number;
    gender: string;
    hairColor?: string;
    eyeColor?: string;
}

// --- Comment (Phase 2) ---
export interface Comment {
    id: string;
    authorName: string;
    message: string;
    createdAt: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// --- Create Pool Request ---
export interface CreatePoolRequest {
    babyName: string;
    parentNames?: string;
    dueDate: string;
    dueDateUnknown?: boolean;
    theme: ThemeKey | string;
    registryLink?: string;
    diaperFundLink?: string;
    includeFields?: BabyPool['includeFields'];
    customQuestions?: string[];
    
    // New fields
    unitSystem?: UnitSystem;
    isMultiples?: boolean;
    multiplesCount?: number;
    prizeDescription?: string;
    guessDeadline?: string;
    enableNamePoll?: boolean;
    nameOptions?: string[];
    additionalLinks?: AdditionalLink[];
    targetGuessCount?: number;
}

// --- Create Pool Response ---
export interface CreatePoolResponse {
    poolId: string;
    adminKey: string;
    pool: BabyPool;
}

// --- Submit Guess Request ---
export interface SubmitGuessRequest {
    guesserName: string;
    date: string;
    time?: string;
    weightLbs: number;
    weightOz: number;
    length?: number;
    hairColor?: string;
    eyeColor?: string;
    gender: string;
    suggestedName?: string;
    customAnswers?: Record<string, string>;
}

// --- Submit Guess Response ---
export interface SubmitGuessResponse {
    id: string;
    success: boolean;
}

// --- Declare Birth Request ---
export interface DeclareBirthRequest {
    date: string;
    time: string;
    weightLbs: number;
    weightOz: number;
    length?: number;
    hairColor?: string;
    eyeColor?: string;
    gender: string;
    actualName: string;
    photoLink?: string;
    
    // For multiples
    babies?: MultipleBabyResult[];
}

// --- Vote Name Request ---
export interface VoteNameRequest {
    poolId: string;
    name: string;
    oderId?: string; // Optional identifier for the voter
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// --- Pool Statistics (for admin dashboard) ---
export interface PoolStatistics {
    totalGuesses: number;
    genderBreakdown: {
        boy: number;
        girl: number;
        surprise: number;
    };
    mostPopularDate: string;
    averageWeight: { lbs: number; oz: number };
    medianWeight: { lbs: number; oz: number };
    topNameGuess: string | null;
    latestGuesser: string | null;
    latestGuessTime: string | null;
}

// --- Invitee (client-side only, stored in localStorage) ---
export interface Invitee {
    id: string;
    name: string;
    sent?: boolean;
    sentAt?: string;
    method?: 'email' | 'whatsapp' | 'copy' | 'sms';
}

// --- Theme Configuration ---
export interface ThemeConfig {
    name: string;
    bg: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    border: string;
    illustration: string;
}

// --- Amazon Config ---
export interface AmazonConfig {
    link: string;
    benefits: string[];
    welcomeBoxValue: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const HAIR_COLORS = ['Bald/None', 'Blonde', 'Brown', 'Black', 'Red', 'Strawberry Blonde'] as const;
export const EYE_COLORS = ['Blue', 'Brown', 'Green', 'Hazel', 'Grey', 'Violet'] as const;

export const DEFAULT_INCLUDE_FIELDS = {
    time: true,
    weight: true,
    length: true,
    hair: true,
    eye: true,
    gender: true,
};

export const DEFAULT_TARGET_GUESS_COUNT = 25;

export const UNIT_LABELS = {
    imperial: { weight: 'lbs/oz', length: 'inches', weightUnit: 'lb', lengthUnit: 'in' },
    metric: { weight: 'kg/g', length: 'cm', weightUnit: 'kg', lengthUnit: 'cm' }
} as const;