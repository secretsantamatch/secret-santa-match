import type { Participant, GiftPersona } from '../types';

const personaKeywordMap: Record<string, string> = {
    // Tech & Gadgets
    'tech': 'The Techie', 'gadgets': 'The Techie', 'apple': 'The Techie', 'android': 'The Techie', 'coding': 'The Techie', 'computers': 'The Techie', 'gaming': 'The Gamer', 'video games': 'The Gamer', 'nintendo': 'The Gamer', 'playstation': 'The Gamer', 'xbox': 'The Gamer', 'pc gaming': 'The Gamer',
    // Food & Drink
    'foodie': 'The Gourmet', 'cooking': 'The Gourmet', 'baking': 'The Gourmet', 'restaurants': 'The Gourmet', 'wine': 'The Connoisseur', 'beer': 'The Connoisseur', 'cocktails': 'The Connoisseur', 'coffee': 'The Coffee Aficionado', 'tea': 'The Tea Lover',
    // Home & Lifestyle
    'homebody': 'The Cozy Connoisseur', 'cozy': 'The Cozy Connoisseur', 'hygge': 'The Cozy Connoisseur', 'candles': 'The Cozy Connoisseur', 'blankets': 'The Cozy Connoisseur', 'gardening': 'The Green Thumb', 'plants': 'The Green Thumb', 'outdoors': 'The Adventurer', 'hiking': 'The Adventurer', 'camping': 'The Adventurer', 'travel': 'The Globetrotter', 'decor': 'The Interior Decorator', 'home decor': 'The Interior Decorator',
    // Arts & Crafts
    'art': 'The Artist', 'crafts': 'The Crafter', 'diy': 'The Crafter', 'knitting': 'The Crafter', 'sewing': 'The Crafter', 'painting': 'The Artist', 'drawing': 'The Artist', 'photography': 'The Artist',
    // Reading & Writing
    'reading': 'The Bookworm', 'books': 'The Bookworm', 'writer': 'The Bookworm', 'writing': 'The Bookworm', 'journaling': 'The Bookworm',
    // Music & Movies
    'music': 'The Audiophile', 'concerts': 'The Audiophile', 'vinyl': 'The Audiophile', 'movies': 'The Cinephile', 'film': 'The Cinephile', 'tv shows': 'The Binge-Watcher', 'netflix': 'The Binge-Watcher',
    // Sports & Fitness
    'fitness': 'The Fitness Buff', 'gym': 'The Fitness Buff', 'running': 'The Fitness Buff', 'yoga': 'The Zen Master', 'sports': 'The Sports Fan', 'football': 'The Sports Fan', 'basketball': 'The Sports Fan',
    // Fashion & Beauty
    'fashion': 'The Trendsetter', 'style': 'The Trendsetter', 'makeup': 'The Beauty Guru', 'skincare': 'The Beauty Guru',
    // Other
    'animals': 'The Animal Lover', 'pets': 'The Animal Lover', 'dogs': 'The Animal Lover', 'cats': 'The Animal Lover', 'spiritual': 'The Zen Master', 'wellness': 'The Zen Master', 'board games': 'The Gamer',
};

const personas: Record<string, Omit<GiftPersona, 'categories'>> = {
    'The Techie': { name: 'The Techie', description: 'Loves the latest gadgets, sleek designs, and anything that makes life more efficient. They appreciate quality and innovation.' },
    'The Gamer': { name: 'The Gamer', description: 'Passionate about virtual worlds, whether on console, PC, or tabletop. They enjoy immersive experiences and collectibles related to their favorite games.' },
    'The Gourmet': { name: 'The Gourmet', description: 'A true food lover who enjoys cooking, trying new restaurants, and experimenting with flavors. Quality ingredients and unique kitchen tools are always a win.' },
    'The Connoisseur': { name: 'The Connoisseur', description: 'Appreciates the finer things, whether it’s a craft beer, a fine wine, or a perfectly mixed cocktail. They have a refined palate and enjoy the experience of tasting.' },
    'The Coffee Aficionado': { name: 'The Coffee Aficionado', description: 'For them, coffee is a ritual. They love exploring different beans, brewing methods, and accessories that elevate their daily cup.' },
    'The Tea Lover': { name: 'The Tea Lover', description: 'Finds comfort and joy in a perfect cup of tea. They appreciate exotic blends, beautiful teaware, and moments of calm.' },
    'The Cozy Connoisseur': { name: 'The Cozy Connoisseur', description: 'This person loves quiet, comfortable moments. Think rainy days, a great book, a warm drink, and a pet on their lap. The perfect gift enhances this cozy and thoughtful lifestyle.' },
    'The Green Thumb': { name: 'The Green Thumb', description: 'Has a passion for plants and gardening. They love nurturing their green friends and appreciate beautiful pots, useful tools, or unique new plants.' },
    'The Adventurer': { name: 'The Adventurer', description: 'Loves the great outdoors. Hiking, camping, and exploring new places are their passions. Practical, durable gear is always a welcome gift.' },
    'The Globetrotter': { name: 'The Globetrotter', description: 'Always planning their next trip. They value experiences over things and appreciate gifts that make travel easier, more comfortable, or more memorable.' },
    'The Interior Decorator': { name: 'The Interior Decorator', description: 'Has a great eye for style and loves making their space beautiful and unique. Think art prints, stylish home accents, and unique decor pieces.' },
    'The Artist': { name: 'The Artist', description: 'A creative soul who loves to express themselves through visual arts. High-quality supplies, inspirational books, or workshops are perfect for them.' },
    'The Crafter': { name: 'The Crafter', description: 'Loves making things by hand. Whether it’s knitting, sewing, or DIY projects, they appreciate tools and materials that fuel their creativity.' },
    'The Bookworm': { name: 'The Bookworm', description: 'Finds joy in getting lost in a good story. Best-sellers, indie gems, or cozy reading accessories are always a great choice.' },
    'The Audiophile': { name: 'The Audiophile', description: 'Music is their passion. They appreciate high-fidelity sound, discovering new artists, and collecting music in all its forms.' },
    'The Cinephile': { name: 'The Cinephile', description: 'A true film buff who loves everything from classic cinema to modern blockbusters. Movie memorabilia, art books, or a streaming service subscription would be perfect.' },
    'The Binge-Watcher': { name: 'The Binge-Watcher', description: 'Loves getting hooked on a new TV series. Cozy essentials for a marathon viewing session or merchandise from their favorite show are great ideas.' },
    'The Fitness Buff': { name: 'The Fitness Buff', description: 'Dedicated to their health and wellness. They appreciate high-quality workout gear, tech that tracks their progress, and healthy lifestyle products.' },
    'The Zen Master': { name: 'The Zen Master', description: 'Values mindfulness, wellness, and inner peace. Gifts that promote relaxation, meditation, or self-care are ideal for them.' },
    'The Sports Fan': { name: 'The Sports Fan', description: 'Lives and breathes for their favorite team. Team merchandise, memorabilia, or tickets to a game are sure-fire hits.' },
    'The Trendsetter': { name: 'The Trendsetter', description: 'Has a keen sense of style and loves to stay ahead of the latest fashion trends. Unique accessories, clothing from cool brands, or a style magazine subscription would be great.' },
    'The Beauty Guru': { name: 'The Beauty Guru', description: 'Loves all things skincare and makeup. High-quality products, new tools, or a gift set from a popular brand would be a dream come true.' },
    'The Animal Lover': { name: 'The Animal Lover', description: 'Adores their furry (or scaly) friends. A fun gift for their pet, a donation to an animal charity in their name, or cute animal-themed items would make them smile.' },
};

export const getGiftPersona = (receiver: Participant): GiftPersona | null => {
    const keywords = [
        ...(receiver.interests || '').toLowerCase().split(','),
        ...(receiver.likes || '').toLowerCase().split(',')
    ].map(k => k.trim()).filter(Boolean);

    if (keywords.length === 0) {
        return {
            ...personas['The Cozy Connoisseur'],
            categories: {}
        };
    }
    
    const personaCounts: Record<string, number> = {};
    keywords.forEach(keyword => {
        for (const mapKey in personaKeywordMap) {
            if (keyword.includes(mapKey)) {
                const personaName = personaKeywordMap[mapKey];
                personaCounts[personaName] = (personaCounts[personaName] || 0) + 1;
                break; 
            }
        }
    });

    let bestPersonaName = 'The Cozy Connoisseur'; // A nice default
    let maxCount = 0;
    for (const personaName in personaCounts) {
        if (personaCounts[personaName] > maxCount) {
            maxCount = personaCounts[personaName];
            bestPersonaName = personaName;
        }
    }

    const persona = personas[bestPersonaName];
    if (!persona) return null;

    // Build categories based on all keywords, not just the ones that determined the persona
    const categories: Record<string, string[]> = {};
    const addedKeywords = new Set<string>();

    keywords.forEach(kw => {
        if (addedKeywords.has(kw)) return;
        const categoryName = `For Their Love of ${kw.charAt(0).toUpperCase() + kw.slice(1)}`;
        if (!categories[categoryName]) {
            categories[categoryName] = [];
        }
        categories[categoryName].push(kw);
        addedKeywords.add(kw);
    });

    return { ...persona, categories };
};
