
import { Globe, Clock, Gift, Star, Gem, Coffee, Sparkles } from 'lucide-react';

export type AdType = 'luxury' | 'fun' | 'standard' | 'urgency';

export interface AdCreative {
    id: string;
    type: AdType;
    headline: string;
    body: string;
    cta: string;
    imageUrl?: string; // Optional: If not provided, uses icon
    startDate?: string; // ISO Date string YYYY-MM-DD
    endDate?: string;   // ISO Date string YYYY-MM-DD
    couponCode?: string;
    themeColor?: string; // Tailwind color class base (e.g. 'amber', 'rose')
}

export interface Partner {
    id: string;
    name: string;
    priority: number; // Higher number = Higher commission/priority
    keywords: string[]; // Keywords to match user interests
    geo: 'US_CA' | 'US_ONLY' | 'GLOBAL';
    affiliateLink: string;
    icon: any; 
    creatives: AdCreative[];
}

export const PARTNERS: Partner[] = [
    {
        id: 'bonheur',
        name: 'Bonheur Jewelry',
        priority: 90, // 25-40% Commission
        geo: 'GLOBAL',
        keywords: ['jewelry', 'gold', 'silver', 'ring', 'necklace', 'earring', 'fashion', 'wife', 'girlfriend', 'mom', 'luxury', 'sparkle'],
        affiliateLink: "https://www.awin1.com/cread.php?s=4547920&v=90759&q=554223&r=2612068",
        icon: Gem,
        creatives: [
            {
                id: 'bonheur-general',
                type: 'luxury',
                headline: 'A Gift That Sparkles Forever',
                body: 'Eco-friendly, NYC-based luxury jewelry adored by celebrities. Give a gift as unique as they are.',
                cta: 'Shop The Collection',
                imageUrl: "https://www.awin1.com/cshow.php?s=4547920&v=90759&q=554223&r=2612068"
            }
        ]
    },
    {
        id: 'pinetales',
        name: 'PineTales',
        priority: 75, // 20% Commission
        geo: 'US_ONLY',
        keywords: ['sleep', 'pillow', 'bed', 'comfort', 'neck', 'pain', 'relax', 'home', 'cozy'],
        affiliateLink: "https://www.awin1.com/cread.php?s=4169669&v=91239&q=544185&r=2612068",
        icon: Sparkles,
        creatives: [
            {
                id: 'pinetales-pillow',
                type: 'standard',
                headline: 'The Pillow That Fixes Neck Pain',
                body: 'Adjustable organic buckwheat & cool-touch bamboo. The gift of deep, pain-free sleep.',
                cta: 'Shop PineTales',
                themeColor: 'teal',
                imageUrl: "https://www.awin1.com/cshow.php?s=4169669&v=91239&q=544185&r=2612068"
            }
        ]
    },
    {
        id: 'sugarwish',
        name: 'Sugarwish',
        priority: 80, // 18% Commission
        geo: 'US_CA',
        keywords: ['candy', 'sweet', 'chocolate', 'food', 'snack', 'cookie', 'popcorn', 'treat', 'yum'],
        affiliateLink: "https://www.awin1.com/awclick.php?gid=518477&mid=33495&awinaffid=2612068&linkid=3923493&clickref=",
        icon: Gift,
        creatives: [
            {
                id: 'sugarwish-general',
                type: 'fun',
                headline: 'Let Them Choose Their Own Treats!',
                body: 'Send a Sugarwish and let them pick their favorite candies, cookies, or popcorn. Delivered instantly via text or email.',
                cta: 'Send a Sweet Gift',
                themeColor: 'pink'
            }
        ]
    },
    {
        id: 'teabook',
        name: 'The TeaBook',
        priority: 70, // 10% Commission
        geo: 'US_CA',
        keywords: ['tea', 'drink', 'beverage', 'book', 'reading', 'cozy', 'mug', 'chai'],
        affiliateLink: "https://www.awin1.com/cread.php?s=4276843&v=88557&q=557671&r=2612068",
        icon: Coffee,
        creatives: [
            // Date Specific Deals
            {
                id: 'teabook-bf-1',
                type: 'urgency',
                headline: 'Black Friday Tea Deal',
                body: 'Huge savings on organic teas in fun, collectable packaging.',
                cta: 'Shop The Sale',
                startDate: '2025-11-28',
                endDate: '2025-11-28',
                themeColor: 'emerald'
            },
            {
                id: 'teabook-general',
                type: 'standard',
                headline: 'For The Tea Lover',
                body: 'Innovative tea books that store tea while looking great on a shelf. Organic and delicious.',
                cta: 'Shop The TeaBook',
                themeColor: 'emerald'
            }
        ]
    },
    {
        id: 'the-met',
        name: 'The Met Store',
        priority: 60, // 2% Commission
        geo: 'GLOBAL',
        keywords: ['art', 'museum', 'history', 'culture', 'painting', 'draw', 'sketch', 'scarf', 'tie'],
        affiliateLink: "https://click.linksynergy.com/fs-bin/click?id=6AKK8tkf2k4&offerid=1772143.347&type=3&subid=0",
        icon: Globe,
        creatives: [
            {
                id: 'met-general',
                type: 'standard',
                headline: 'Gifts Inspired by 5,000 Years of Art',
                body: 'Unique jewelry, home decor, and prints from The Metropolitan Museum of Art.',
                cta: 'Shop The Met Store',
                themeColor: 'slate'
            }
        ]
    },
    {
        id: 'credit-karma',
        name: 'Credit Karma',
        priority: 50, // $7 CPA - Good for general/budget context
        geo: 'US_ONLY',
        keywords: ['budget', 'money', 'finance', 'saving', 'debt', 'credit'],
        affiliateLink: "https://www.awin1.com/awclick.php?gid=580820&mid=66532&awinaffid=2612068&linkid=4507342&clickref=",
        icon: Star,
        creatives: [
            {
                id: 'ck-general',
                type: 'standard',
                headline: 'Keep Your Holiday Budget in Check',
                body: 'Track your spending and monitor your credit score for free this holiday season.',
                cta: 'Try Credit Karma',
                themeColor: 'indigo'
            }
        ]
    },
    {
        id: 'giftcards-com',
        name: 'GiftCards.com',
        priority: 10, // 5% Commission - The Great Fallback
        geo: 'US_ONLY', // Mostly US brands
        keywords: ['*'], // Wildcard - matches everything if nothing else does
        affiliateLink: "https://click.linksynergy.com/fs-bin/click?id=6AKK8tkf2k4&offerid=1469583.925&subid=0&type=4",
        icon: Gift,
        creatives: [
            {
                id: 'gc-bf',
                type: 'urgency',
                headline: '15% Off Select Brands',
                body: 'Black Friday Special! Save on top brands.',
                couponCode: 'FRIDAY15',
                cta: 'Shop Sale',
                startDate: '2025-11-27',
                endDate: '2025-11-30',
                themeColor: 'red'
            },
            {
                id: 'gc-cm',
                type: 'urgency',
                headline: '10% Off Cyber Week',
                body: 'Cyber Monday Deals are here. Save on digital gifts.',
                couponCode: 'CYBER10',
                cta: 'Shop Cyber Deals',
                startDate: '2025-12-01',
                endDate: '2025-12-06',
                themeColor: 'violet'
            },
            {
                id: 'gc-general',
                type: 'standard',
                headline: 'The Ultimate Safe Bet',
                body: 'Instant delivery on 350+ brands. The perfect last-minute gift that looks planned.',
                cta: 'Browse Gift Cards',
                themeColor: 'blue'
            }
        ]
    }
];
