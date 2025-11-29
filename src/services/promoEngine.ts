import { PARTNERS, Partner, AdCreative } from '../data/adConfig';
import { isEuVisitor } from '../utils/privacy';

interface PromoMatch {
    partner: Partner;
    creative: AdCreative;
    isFallback: boolean;
    matchedKeyword?: string;
}

// Helper: Weighted Random Selection
const selectWeightedCreative = (creatives: AdCreative[]): AdCreative | undefined => {
    if (creatives.length === 0) return undefined;
    if (creatives.length === 1) return creatives[0];

    // Calculate total weight (default to 1 if missing)
    const totalWeight = creatives.reduce((sum, c) => sum + (c.weight || 1), 0);
    
    // Pick random number
    let random = Math.random() * totalWeight;
    
    // Find the creative
    for (const creative of creatives) {
        random -= (creative.weight || 1);
        if (random <= 0) {
            return creative;
        }
    }
    
    return creatives[0]; // Fallback
};

export const getBestPromo = (contextText: string): PromoMatch | null => {
    const isEu = isEuVisitor();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const normalizedText = contextText.toLowerCase();

    // 1. Filter Partners by Geo
    const geoFilteredPartners = PARTNERS.filter(p => {
        if (p.geo === 'US_ONLY' && isEu) return false;
        return true; 
    });

    let bestMatch: PromoMatch | null = null;
    let highestScore = -1;

    for (const partner of geoFilteredPartners) {
        // 2. Score based on Keywords
        let score = 0;
        let currentMatchedKeyword: string | undefined = undefined;
        
        // Direct keyword match
        if (partner.keywords.includes('*')) {
            score = 1; // Base score for fallback
        } else {
            // Find specific keyword matches
            const foundKeyword = partner.keywords.find(k => normalizedText.includes(k.toLowerCase()));
            if (foundKeyword) {
                // Priority heavily weighs the score
                score = partner.priority + 100; 
                currentMatchedKeyword = foundKeyword;
            }
        }

        // If no keywords matched and not a wildcard, skip
        if (score === 0) continue;

        // 3. Find ALL Valid Creatives (Date Check)
        const validCreatives = partner.creatives.filter(c => {
            if (c.startDate && c.startDate > today) return false;
            if (c.endDate && c.endDate < today) return false;
            return true;
        });

        // 4. Creative Selection Strategy
        // Strategy: 
        // - If a creative has `matchKeywords` and one matches: HIGH PRIORITY
        // - If a creative has `matchKeywords` and NONE match: EXCLUDE (Strict matching)
        // - If a creative has NO `matchKeywords`: FALLBACK POOL

        const specificMatches = validCreatives.filter(c => 
            c.matchKeywords && c.matchKeywords.some(k => normalizedText.includes(k.toLowerCase()))
        );

        // Creatives that are allowed to run generally (no specific targeting required)
        const generalPool = validCreatives.filter(c => !c.matchKeywords || c.matchKeywords.length === 0);

        let selectedCreative: AdCreative | undefined;

        if (specificMatches.length > 0) {
            // A specific creative matched the user's text!
            selectedCreative = selectWeightedCreative(specificMatches);
            score += 500; // Massive boost for specific creative match
            
            // Update the matched keyword for the UI headline if possible
            // Find which keyword matched this specific creative
            if (selectedCreative && selectedCreative.matchKeywords) {
                 const creativeKeyword = selectedCreative.matchKeywords.find(k => normalizedText.includes(k.toLowerCase()));
                 if (creativeKeyword) currentMatchedKeyword = creativeKeyword;
            }

        } else if (generalPool.length > 0) {
            // No specific creative matched, pick from the general pool
            selectedCreative = selectWeightedCreative(generalPool);
        }

        // If we found a valid creative and this score is higher than previous best
        if (selectedCreative && score > highestScore) {
            highestScore = score;
            bestMatch = { 
                partner, 
                creative: selectedCreative,
                isFallback: partner.keywords.includes('*'),
                matchedKeyword: currentMatchedKeyword
            };
        }
    }

    return bestMatch;
};

// Helper to get specific partner (e.g. for the Budget section)
export const getPromoById = (id: string): PromoMatch | null => {
    const partner = PARTNERS.find(p => p.id === id);
    if (!partner) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const validCreatives = partner.creatives.filter(c => {
        if (c.startDate && c.startDate > today) return false;
        if (c.endDate && c.endDate < today) return false;
        return true;
    });

    const selectedCreative = selectWeightedCreative(validCreatives);

    if (!selectedCreative) return null;
    return { partner, creative: selectedCreative, isFallback: false };
}