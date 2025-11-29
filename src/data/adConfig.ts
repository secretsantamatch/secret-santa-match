
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

// --- DATE SPECIFIC MESSAGING ---
export const URGENCY_CONFIG: Record<string, { title: string; template: string; style: 'urgent' | 'info' }> = {
    // Format: MM-DD
    '11-28': { title: '🔥 Black Friday is Here!', template: 'The best {category} deals of the year end soon.', style: 'urgent' },
    '11-29': { title: '🛍️ Black Friday Continues', template: 'Don\'t miss out on top-rated {category} gifts.', style: 'urgent' },
    '11-30': { title: '⏳ Deals Ending Soon', template: 'Last chance to grab premium {category} before prices go up.', style: 'urgent' },
    '12-02': { title: '⚡ Cyber Monday', template: 'Online exclusive {category} deals are live now.', style: 'urgent' },
    '12-24': { title: '🎁 Last Minute!', template: 'Need it now? Send a digital {category} instantly.', style: 'urgent' }
};

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

    // --- LUXURY JEWELRY (BONHEUR) ---
    {
        id: 'bonheur',
        name: 'Bonheur Jewelry',
        priority: 95, // High priority for jewelry keywords
        geo: 'GLOBAL',
        keywords: ['jewelry', 'jewellery', 'gold', 'silver', 'ring', 'necklace', 'earring', 'bracelet', 'fashion', 'wife', 'girlfriend', 'mom', 'luxury', 'sparkle', 'accessories', 'diamond', 'woman', 'women', 'style'],
        affiliateLink: "https://www.awin1.com/cread.php?s=4547931&v=90759&q=554223&r=2612068",
        icon: Gem,
        creatives: [
            {
                id: 'bonheur-milou-bracelet',
                type: 'luxury',
                headline: 'Milou Tennis Bracelet',
                body: 'Available in 18k Yellow Gold or Rose over sustainable brass. Featuring faceted Swarovski Crystals for timeless elegance.',
                cta: 'Shop This Look',
                weight: 80,
                linkOverride: "https://www.awin1.com/cread.php?s=4551138&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4551138&v=90759&q=554223&r=2612068"
            },
            {
                id: 'bonheur-odette-model',
                type: 'luxury',
                headline: 'Odette Drop Earrings',
                body: 'Statement 2.5" drops with Blue, Peridot, Ruby, and White Swarovski Crystals. As seen on celebrities and editorials.',
                cta: 'View Earrings',
                weight: 80,
                linkOverride: "https://www.awin1.com/cread.php?s=4551136&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4551136&v=90759&q=554223&r=2612068"
            },
            {
                id: 'bonheur-rings-model',
                type: 'luxury',
                headline: 'Statement Rings',
                body: 'Bold, eco-friendly designs inspired by the world around us. Created with recycled metals and ethically sourced gemstones.',
                cta: 'Shop Rings',
                weight: 70,
                linkOverride: "https://www.awin1.com/cread.php?s=4547918&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4547918&v=90759&q=554223&r=2612068"
            },
            {
                id: 'bonheur-anik-bracelet',
                type: 'luxury',
                headline: 'Anik Tennis Bracelet',
                body: 'Handset 4.5mm Swarovski stones in a classic tennis chain. A piece designed to be passed down for generations.',
                cta: 'Shop Bracelets',
                weight: 70,
                linkOverride: "https://www.awin1.com/cread.php?s=4547819&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4547819&v=90759&q=554223&r=2612068"
            },
            {
                id: 'bonheur-lilou-charm',
                type: 'luxury',
                headline: 'Lilou Crystal Charm Bracelet',
                body: 'Adjustable charm bracelet featuring White & Green Swarovski Crystals in mixed cuts (Princess, Pear, Baguette).',
                cta: 'View Bracelet',
                weight: 60,
                linkOverride: "https://www.awin1.com/cread.php?s=4547876&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4547876&v=90759&q=554223&r=2612068"
            },
            {
                id: 'bonheur-eugenie-tennis',
                type: 'luxury',
                headline: 'Eugenie Crystal Tennis Bracelet',
                body: 'Classic elegance redefined. 18k Yellow Gold or Rhodium plating with stunning Emerald-Cut and Round crystals.',
                cta: 'Shop Luxury',
                weight: 60,
                linkOverride: "https://www.awin1.com/cread.php?s=4547874&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4547874&v=90759&q=554223&r=2612068"
            },
            {
                id: 'bonheur-taylor-earrings',
                type: 'luxury',
                headline: 'Taylor Beaded Earrings',
                body: 'Delicate, lightweight hollow spheres in a long drop design. Detachable ear jackets for versatile styling.',
                cta: 'Shop Earrings',
                weight: 60,
                linkOverride: "https://www.awin1.com/cread.php?s=4547850&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4547850&v=90759&q=554223&r=2612068"
            },
            {
                id: 'bonheur-astor-hoops',
                type: 'luxury',
                headline: 'Astor Hoop Earrings',
                body: 'The perfect everyday hoop. 19mm diameter with secure latch backs. Made with sustainable brass.',
                cta: 'View Hoops',
                weight: 50,
                linkOverride: "https://www.awin1.com/cread.php?s=4547812&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4547812&v=90759&q=554223&r=2612068"
            },
            {
                id: 'bonheur-odette-product',
                type: 'luxury',
                headline: 'Odette Earrings (Product View)',
                body: 'Exquisite craftsmanship available in 18k Yellow Gold or Rhodium. A stunning gift that tells a story.',
                cta: 'See Details',
                weight: 40,
                linkOverride: "https://www.awin1.com/cread.php?s=4551135&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4551135&v=90759&q=554223&r=2612068"
            },
            {
                id: 'bonheur-general-banner',
                type: 'luxury',
                headline: 'Timeless Eco-Friendly Jewelry',
                body: 'Inspired by family heirlooms, created for the modern woman. Ethical, sustainable, and beautiful.',
                cta: 'Discover Bonheur',
                weight: 50,
                linkOverride: "https://www.awin1.com/cread.php?s=4547931&v=90759&q=554223&r=2612068",
                imageUrl: "https://www.awin1.com/cshow.php?s=4547931&v=90759&q=554223&r=2612068"
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
                cta: 'Personalize & Buy',
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
                cta: 'Personalize & Buy ($50)',
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
