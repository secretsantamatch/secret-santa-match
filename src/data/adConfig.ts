
import { Globe, Clock, Gift, Star, Gem, Coffee, Sparkles, ShoppingBag, Hammer, Smile, Zap } from 'lucide-react';

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
    linkOverride?: string; // Optional: Specific product deep link
    weight?: number; // Optional: For A/B testing (default 1). Higher = more frequent.
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
    // --- HIGH PRIORITY / SPECIFIC DATE DEALS ---
    {
        id: 'giftcards-cyber-week',
        name: 'GiftCards.com',
        priority: 100, // Top priority during dates
        geo: 'US_ONLY',
        keywords: ['*'], // Matches everyone during the sale
        affiliateLink: "https://click.linksynergy.com/fs-bin/click?id=6AKK8tkf2k4&offerid=1469583.991&subid=0&type=4",
        icon: Zap,
        creatives: [
            {
                id: 'gc-cyber-week-1',
                type: 'urgency',
                headline: 'Cyber Week Sale: Up to 15% Off',
                body: 'The biggest sale of the year. Save on top brands for a limited time.',
                cta: 'Shop Cyber Deals',
                couponCode: 'CYBER15',
                startDate: '2025-12-01',
                endDate: '2025-12-06',
                themeColor: 'violet',
                weight: 100,
                imageUrl: "https://ad.linksynergy.com/fs-bin/show?id=6AKK8tkf2k4&bids=1469583.950&subid=0&type=4&gridnum=14"
            },
            {
                id: 'gc-national-gc-week',
                type: 'urgency',
                headline: 'National Gift Card Week',
                body: 'Celebrate with up to 15% off and 3% rewards on select brands.',
                cta: 'View Offers',
                startDate: '2025-12-07',
                endDate: '2025-12-13',
                themeColor: 'blue',
                weight: 100,
                imageUrl: "https://ad.linksynergy.com/fs-bin/show?id=6AKK8tkf2k4&bids=1469583.941&subid=0&type=4&gridnum=14"
            },
            {
                id: 'gc-lowes-promo',
                type: 'urgency',
                headline: '10% Off Lowe\'s Gift Cards',
                body: 'Perfect for the DIYer. Limit 3 per customer.',
                cta: 'Get Deal',
                couponCode: 'LOWES10',
                startDate: '2025-12-22',
                endDate: '2025-12-31',
                themeColor: 'blue',
                weight: 100,
                imageUrl: "https://ad.linksynergy.com/fs-bin/show?id=6AKK8tkf2k4&bids=1469583.972&subid=0&type=4&gridnum=0"
            }
        ]
    },

    // --- CATEGORY SPECIFIC PARTNERS (VIA GIFTCARDS.COM) ---
    {
        id: 'gc-beauty',
        name: 'Beauty Gifts',
        priority: 85, 
        geo: 'US_ONLY',
        keywords: ['makeup', 'beauty', 'hair', 'skin', 'face', 'cosmetics', 'sephora', 'ulta', 'spa'],
        affiliateLink: "https://click.linksynergy.com/fs-bin/click?id=6AKK8tkf2k4&offerid=1469583.907&subid=0&type=4",
        icon: Sparkles,
        creatives: [
            {
                id: 'gc-sephora-holiday',
                type: 'standard',
                headline: 'Beauty for the Holidays',
                body: 'The perfect gift for beauty lovers. Delivered instantly.',
                cta: 'Shop Sephora Cards',
                themeColor: 'rose',
                startDate: '2025-11-13',
                endDate: '2026-01-06',
                weight: 50,
                imageUrl: "https://ad.linksynergy.com/fs-bin/show?id=6AKK8tkf2k4&bids=1469583.907&subid=0&type=4&gridnum=0"
            },
            {
                id: 'gc-ulta-holiday',
                type: 'standard',
                headline: 'Give the Gift of Glow',
                body: 'Let them choose their favorite products with an Ulta Beauty card.',
                cta: 'Shop Ulta Cards',
                themeColor: 'orange',
                startDate: '2025-11-13',
                endDate: '2026-01-06',
                weight: 50,
                imageUrl: "https://ad.linksynergy.com/fs-bin/show?id=6AKK8tkf2k4&bids=1469583.905&subid=0&type=4&gridnum=0"
            }
        ]
    },

    // --- LUXURY / CUSTOM PRODUCTS ---
    {
        id: 'gc-custom-visa',
        name: 'Custom Visa Gifts',
        priority: 80,
        geo: 'US_ONLY',
        keywords: ['money', 'cash', 'flexible', 'visa', 'mastercard', 'choice', 'anything'],
        affiliateLink: "https://click.linksynergy.com/fs-bin/click?id=6AKK8tkf2k4&offerid=1469583.640&subid=0&type=4",
        icon: Gift,
        creatives: [
            {
                id: 'gc-visa-holiday',
                type: 'luxury',
                headline: 'The Gift of Everywhere',
                body: 'A personalized Visa gift card they can spend anywhere. Choose a festive holiday design.',
                cta: 'Personalize Now',
                weight: 50,
                imageUrl: "https://www.giftcards.com/content/dam/bhn/live/nam/us/en/marketing-assets/predesigns/59d2a1fb9bd4.jpg/jcr:content/renditions/cq5dam.thumbnail.319.319.png"
            },
            {
                id: 'gc-mastercard-tree',
                type: 'luxury',
                headline: 'Make It Personal',
                body: 'Upload a photo or choose a premium holiday design. Funds never expire.',
                cta: 'Create Custom Card',
                weight: 50,
                imageUrl: "https://www.giftcards.com/content/dam/bhn/live/nam/us/en/marketing-assets/predesigns/5627dfdb539a.jpg/jcr:content/renditions/cq5dam.thumbnail.319.319.png"
            }
        ]
    },

    // --- STANDARD PARTNERS ---
    {
        id: 'bonheur',
        name: 'Bonheur Jewelry',
        priority: 90, 
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
                weight: 100,
                imageUrl: "https://www.awin1.com/cshow.php?s=4547920&v=90759&q=554223&r=2612068"
            }
        ]
    },
    {
        id: 'pinetales',
        name: 'PineTales',
        priority: 75,
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
                weight: 100,
                imageUrl: "https://www.awin1.com/cshow.php?s=4169669&v=91239&q=544185&r=2612068"
            }
        ]
    },
    {
        id: 'sugarwish',
        name: 'Sugarwish',
        priority: 80,
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
                themeColor: 'pink',
                weight: 100
            }
        ]
    },
    {
        id: 'teabook',
        name: 'The TeaBook',
        priority: 70,
        geo: 'US_CA',
        keywords: ['tea', 'drink', 'beverage', 'book', 'reading', 'cozy', 'mug', 'chai'],
        affiliateLink: "https://www.awin1.com/cread.php?s=4276843&v=88557&q=557671&r=2612068",
        icon: Coffee,
        creatives: [
            {
                id: 'teabook-bf-1',
                type: 'urgency',
                headline: 'Black Friday Tea Deal',
                body: 'Huge savings on organic teas in fun, collectable packaging.',
                cta: 'Shop The Sale',
                startDate: '2025-11-28',
                endDate: '2025-11-28',
                themeColor: 'emerald',
                weight: 100
            },
            {
                id: 'teabook-general',
                type: 'standard',
                headline: 'For The Tea Lover',
                body: 'Innovative tea books that store tea while looking great on a shelf. Organic and delicious.',
                cta: 'Shop The TeaBook',
                themeColor: 'emerald',
                weight: 100
            }
        ]
    },
    {
        id: 'the-met',
        name: 'The Met Store',
        priority: 60,
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
                themeColor: 'slate',
                weight: 100
            }
        ]
    },
    // --- FALLBACK / GENERAL A/B TEST ---
    {
        id: 'giftcards-com-general',
        name: 'GiftCards.com',
        priority: 10,
        geo: 'US_ONLY',
        keywords: ['*'], // Wildcard
        affiliateLink: "https://click.linksynergy.com/fs-bin/click?id=6AKK8tkf2k4&offerid=1469583.640&subid=0&type=4",
        icon: Gift,
        creatives: [
            // VARIANT A: Personalized Visa (Higher conversion probability)
            {
                id: 'gc-general-smart',
                type: 'standard',
                headline: 'Personalize a Holiday Visa®',
                body: 'Upload a photo or choose a festive design. The perfect gift they can spend anywhere.',
                cta: 'Design for $50',
                themeColor: 'emerald',
                weight: 70, // 70% chance
                linkOverride: "https://click.linksynergy.com/link?id=6AKK8tkf2k4&offerid=1469583.444323918390291691328604&type=2&murl=https%3a%2f%2fwww.giftcards.com%2fus%2fen%2fcatalog%2fproduct-details%2fopen-loop-gift-card%3fmode%3ddesign%26brand%3dvisa%26image-id%3d1de39cec-2760-4aa0-bccf-71b8f59820bb%26amount%3d50",
                imageUrl: "https://www.giftcards.com/content/dam/bhn/live/nam/us/en/marketing-assets/predesigns/636bce53be23.jpg/jcr:content/renditions/cq5dam.thumbnail.319.319.png"
            },
            // VARIANT B: General Holiday (Lower conversion probability, good fallback)
            {
                id: 'gc-share-joy',
                type: 'standard',
                headline: 'Share The Joy',
                body: 'Share the joy of the season with gift cards that fit every style. Instant delivery available.',
                cta: 'Browse All Cards',
                themeColor: 'red',
                weight: 30, // 30% chance
                startDate: '2025-11-26',
                endDate: '2025-12-15',
                imageUrl: "https://ad.linksynergy.com/fs-bin/show?id=6AKK8tkf2k4&bids=1469583.830&subid=0&type=4&gridnum=0"
            }
        ]
    }
];
