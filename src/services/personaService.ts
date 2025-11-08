// src/services/personaService.ts
import type { Participant, GiftPersona } from '../types';

const personas: Record<string, GiftPersona> = {
    'cozy-connoisseur': {
        name: 'The Cozy Connoisseur',
        description: "This person loves quiet, comfortable moments. Think rainy days, a great book, a warm drink, and a pet on their lap. The perfect gift enhances this cozy and thoughtful lifestyle.",
        categories: {
            "For Their Reading Nook": ["book lover gifts", "cozy blankets", "reading lights"],
            "For a Warm Drink Ritual": ["artisanal coffee beans", "gourmet tea sampler", "electric mug warmer"],
            "For Ultimate Relaxation": ["scented candles", "bath bombs set", "plush slippers"],
        }
    },
    'adventurous-explorer': {
        name: 'The Adventurous Explorer',
        description: "This person thrives on new experiences and the great outdoors. They're always planning their next trip, hike, or adventure. The best gifts are practical, durable, and fuel their passion for exploration.",
        categories: {
            "For Their Next Hike": ["hiking daypack", "wool hiking socks", "water purification bottle"],
            "For the Campsite": ["camping hammock", "portable lantern", "compact cooking set"],
            "For Travel Planning": ["scratch off world map", "travel journal", "portable power bank"],
        }
    },
    'creative-artisan': {
        name: 'The Creative Artisan',
        description: "This person has a passion for making things. Whether it's painting, crafting, writing, or music, they love the creative process. The ideal gift provides them with new tools or inspiration for their craft.",
        categories: {
            "For the Artist": ["watercolor paint set", "sketchbook and pencils", "calligraphy pen set"],
            "For the Crafter": ["DIY candle making kit", "embroidery starter kit", "polymer clay set"],
            "For Creative Inspiration": ["books on creativity", "a Skillshare membership", "a museum pass"],
        }
    },
    'tech-enthusiast': {
        name: 'The Tech Enthusiast',
        description: "Gadgets, gaming, and the latest tech trends are what excite this person. They appreciate smart design and clever functionality. A great gift is something that's both fun and on the cutting edge.",
        categories: {
            "For Their Desk Setup": ["RGB mousepad", "headphone stand with USB", "smart desk lamp"],
            "For Smart Home Fun": ["smart plugs", "LED light strips", "a mini smart speaker"],
            "For On-the-Go Tech": ["portable bluetooth speaker", "phone grip and stand", "cable organizer case"],
        }
    },
    'home-chef': {
        name: 'The Home Chef & Host',
        description: "This person finds joy in the kitchen and loves entertaining. They're always trying new recipes and appreciate high-quality tools that make cooking and hosting more enjoyable.",
        categories: {
            "For the Kitchen": ["high-quality olive oil", "spice grinder set", "pasta maker"],
            "For Hosting Guests": ["charcuterie board set", "cocktail shaker kit", "unique coasters"],
            "For a Foodie's Bookshelf": ["a popular cookbook", "a food science book", "a food magazine subscription"],
        }
    },
    'wellness-advocate': {
        name: 'The Wellness Advocate',
        description: "Mindfulness, fitness, and self-care are central to this person's life. They value health and balance. The perfect gift supports their physical and mental well-being.",
        categories: {
            "For Fitness": ["yoga mat", "resistance bands set", "foam roller"],
            "For Mindfulness": ["meditation cushion", "aromatherapy diffuser", "a guided journal"],
            "For Healthy Living": ["smart water bottle", "a healthy cookbook", "a wellness app subscription"],
        }
    },
    'sports-fanatic': {
        name: 'The Sports Fanatic',
        description: "Game day is the best day of the week for this person. They are deeply passionate about their favorite teams and players. A great gift helps them show off their team pride or enjoy the game more.",
        categories: {
            "For Game Day at Home": ["team logo blanket", "set of pint glasses", "a book about their team's history"],
            "For Showing Team Pride": ["official team hat", "a vintage-style team t-shirt", "team car decal"],
            "For the Active Fan": ["a basketball or football", "a gift card to a sporting goods store", "tickets to a local game"],
        }
    },
     'fashion-forward': {
        name: 'The Fashion-Forward Trendsetter',
        description: "This person has a keen eye for style and loves expressing themselves through their wardrobe. They appreciate quality, unique accessories, and staying on top of trends.",
        categories: {
            "For Their Wardrobe": ["a silk scarf", "a stylish belt", "a pair of statement socks"],
            "For Accessorizing": ["a minimalist necklace", "a set of unique enamel pins", "a quality beanie"],
            "For Style Inspiration": ["a fashion history book", "a style magazine subscription", "a gift card to their favorite store"],
        }
    },
    'music-lover': {
        name: 'The Music Lover',
        description: "Life has a soundtrack for this person. They love discovering new artists, going to concerts, or just enjoying their favorite tunes. A great gift enhances their listening experience or celebrates their passion.",
        categories: {
            "For Listening": ["high-quality bluetooth speaker", "a vinyl record of a favorite album", "noise-cancelling earbuds"],
            "For the Fan": ["a band t-shirt", "a biography of a musician", "a poster of a favorite artist"],
            "For Making Music": ["a ukulele starter kit", "a harmonica", "a gift card for a local music shop"],
        }
    },
    'pop-culture-aficionado': {
        name: 'The Pop Culture Aficionado',
        description: "This person is fluent in memes and movie quotes. They live and breathe the worlds of their favorite shows, games, and artists. The perfect gift celebrates their fandom and shows you've been paying attention.",
        categories: {
            "For Their Watchlist": ["a streaming service gift card", "a projector for movie nights", "themed snack box"],
            "For Their Game Setup": ["a mechanical keyboard", "a high-quality gaming mouse", "discord nitro subscription"],
            "To Show Off Their Fandom": ["a funko pop figure", "an art book from their favorite series", "a subtle enamel pin"],
        }
    },
    'zen-master': {
        name: 'The Zen Master / Homebody',
        description: "This person's home is their sanctuary. They value peace, mindfulness, and creating a calm, beautiful environment. The best gifts for them are things that promote relaxation, organization, and a sense of well-being.",
        categories: {
            "For Their Zen Space": ["an aromatherapy diffuser", "a bonsai tree kit", "a weighted blanket"],
            "For Their Self-Care Routine": ["a skincare gift set", "a plush bathrobe", "a subscription to a meditation app"],
            "For a Tidy Home & Mind": ["a label maker", "a book on minimalism", "aesthetic storage containers"],
        }
    },
    'classic-hobbyist': {
        name: 'The Classic Hobbyist',
        description: "This person loves hands-on, timeless hobbies. They appreciate quality craftsmanship, the satisfaction of a project well done, and activities that connect them to the world in a tangible way.",
        categories: {
            "For the Garden & Outdoors": ["a high-quality gardening tool set", "a bird feeder and seed", "a book on local plants"],
            "For Their Workshop or Study": ["a leather-bound journal", "a quality fountain pen", "a model building kit"],
            "For a Relaxing Afternoon": ["a complex jigsaw puzzle", "a book of crossword puzzles", "a history biography"],
        }
    },
    'default': {
        name: "The Thoughtful Giver's Choice",
        description: "While they kept their interests a secret, a thoughtful gift is always a winner. Think about shared experiences, inside jokes, or something universally loved that can make their day a little brighter.",
        categories: {
            "Universally Loved Gifts": ["gourmet chocolate box", "a high-quality candle", "a fun party game"],
            "Cozy Comforts": ["a soft throw blanket", "a unique coffee mug", "a pair of fuzzy socks"],
            "The Gift of Choice": ["a gift card to a local coffee shop", "an Amazon gift card", "a movie theater gift card"],
        }
    }
};

// A massively expanded, organized map of keywords to personas.
const keywordMap: Record<string, keyof typeof personas> = {
    // Adventurous Explorer
    'adventure': 'adventurous-explorer', 'biking': 'adventurous-explorer', 'camping': 'adventurous-explorer',
    'climbing': 'adventurous-explorer', 'geocaching': 'adventurous-explorer', 'hiking': 'adventurous-explorer',
    'kayaking': 'adventurous-explorer', 'national parks': 'adventurous-explorer', 'outdoors': 'adventurous-explorer',
    'road trips': 'adventurous-explorer', 'skiing': 'adventurous-explorer',
    'travel': 'adventurous-explorer',

    // Classic Hobbyist
    'bird watching': 'classic-hobbyist', 'biographies': 'classic-hobbyist', 'bridge': 'classic-hobbyist',
    'crossword puzzles': 'classic-hobbyist', 'fishing': 'classic-hobbyist', 'gardening': 'classic-hobbyist',
    'history': 'classic-hobbyist', 'puzzles': 'classic-hobbyist', 'woodworking': 'classic-hobbyist',

    // Cozy Connoisseur
    'audiobooks': 'cozy-connoisseur', 'binge watching': 'cozy-connoisseur', 'books': 'cozy-connoisseur',
    'cats': 'cozy-connoisseur', 'coffee': 'cozy-connoisseur', 'cozy': 'cozy-connoisseur',
    'disney+': 'cozy-connoisseur', 'hulu': 'cozy-connoisseur', 'knitting': 'cozy-connoisseur',
    'movies': 'cozy-connoisseur', 'podcasts': 'cozy-connoisseur', 'reading': 'cozy-connoisseur',
    'streaming': 'cozy-connoisseur', 'tea': 'cozy-connoisseur', 'true crime': 'cozy-connoisseur',

    // Creative Artisan
    'art': 'creative-artisan', 'crafts': 'creative-artisan', 'diy': 'creative-artisan', 'drawing': 'creative-artisan',
    'graphic design': 'creative-artisan', 'painting': 'creative-artisan',
    'photography': 'creative-artisan', 'pottery': 'creative-artisan', 'upcycling': 'creative-artisan',
    'writing': 'creative-artisan',

    // Fashion-Forward Trendsetter
    'accessories': 'fashion-forward', 'clothes': 'fashion-forward', 'fashion': 'fashion-forward',
    'shopping': 'fashion-forward', 'skincare': 'fashion-forward', 'style': 'fashion-forward', 'thrifting': 'fashion-forward',

    // Home Chef & Host
    'air fryer': 'home-chef', 'baking': 'home-chef', 'cocktails': 'home-chef', 'cooking': 'home-chef',
    'craft beer': 'home-chef', 'foodie': 'home-chef', 'hosting': 'home-chef', 'meal prep': 'home-chef',
    'sourdough': 'home-chef', 'whiskey': 'home-chef', 'wine': 'home-chef',

    // Music Lover
    'concerts': 'music-lover', 'guitar': 'music-lover', 'music': 'music-lover', 'singing': 'music-lover',
    'taylor swift': 'music-lover', 'vinyl': 'music-lover',

    // Pop Culture Aficionado
    'anime': 'pop-culture-aficionado', 'd&d': 'pop-culture-aficionado', 'discord': 'pop-culture-aficionado',
    'esports': 'pop-culture-aficionado', 'funko pop': 'pop-culture-aficionado', 'k-pop': 'pop-culture-aficionado',
    'manga': 'pop-culture-aficionado', 'marvel': 'pop-culture-aficionado', 'memes': 'pop-culture-aficionado',
    'netflix': 'pop-culture-aficionado', 'nintendo switch': 'pop-culture-aficionado', 'pc gaming': 'pop-culture-aficionado',
    'star wars': 'pop-culture-aficionado', 'twitch': 'pop-culture-aficionado', 'youtube': 'pop-culture-aficionado',

    // Sports Fanatic
    'baseball': 'sports-fanatic', 'basketball': 'sports-fanatic', 'football': 'sports-fanatic',
    'hockey': 'sports-fanatic', 'soccer': 'sports-fanatic', 'sports': 'sports-fanatic',

    // Tech Enthusiast
    'computers': 'tech-enthusiast', 'gadgets': 'tech-enthusiast', 'gaming': 'tech-enthusiast',
    'smart home': 'tech-enthusiast', 'tech': 'tech-enthusiast', 'video games': 'tech-enthusiast',

    // Zen Master / Homebody
    'astrology': 'zen-master', 'boba tea': 'zen-master', 'journaling': 'zen-master', 'meditation': 'zen-master',
    'minimalism': 'zen-master', 'organization': 'zen-master', 'plants': 'zen-master', 'self-care': 'zen-master',
    'yoga': 'zen-master',

    // Wellness Advocate (overlaps with Zen Master, but more fitness-focused)
    'fitness': 'wellness-advocate', 'gym': 'wellness-advocate', 'health': 'wellness-advocate',
    'running': 'wellness-advocate', 'wellness': 'wellness-advocate',
};


/**
 * Gets the most relevant Gift Persona for a participant based on their interests and likes.
 * This is a client-side, non-AI implementation.
 * @param participant The participant for whom to find a persona.
 * @returns A GiftPersona object.
 */
export const getGiftPersona = (participant: Participant): GiftPersona => {
    const keywords = [
        ...(participant.interests?.split(',') || []),
        ...(participant.likes?.split(',') || [])
    ].map(k => k.trim().toLowerCase()).filter(Boolean);

    if (keywords.length === 0) {
        return personas.default;
    }

    const personaScores: Record<string, number> = {};

    for (const keyword of keywords) {
        // Handle multi-word keywords by checking if they are contained in the map
        let foundMatch = false;
        for (const mapKey in keywordMap) {
            if (keyword.includes(mapKey)) {
                const personaKey = keywordMap[mapKey];
                personaScores[personaKey] = (personaScores[personaKey] || 0) + 1;
                foundMatch = true;
                break; // Stop after first match to avoid over-counting
            }
        }
        if (foundMatch) continue;

        // Fallback for single keywords
        const personaKey = keywordMap[keyword];
        if (personaKey) {
            personaScores[personaKey] = (personaScores[personaKey] || 0) + 1;
        }
    }

    let bestMatch: keyof typeof personas = 'default';
    let maxScore = 0;

    for (const personaKey in personaScores) {
        if (personaScores[personaKey] > maxScore) {
            maxScore = personaScores[personaKey];
            bestMatch = personaKey as keyof typeof personas;
        }
    }
    
    return personas[bestMatch] || personas.default;
};