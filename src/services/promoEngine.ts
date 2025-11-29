
import { PARTNERS, Partner, AdCreative } from '../data/adConfig';
import { isEuVisitor } from '../utils/privacy';

interface PromoMatch {
    partner: Partner;
    creative: AdCreative;
    isFallback: boolean;
    matchedKeyword?: string;
}

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

        // 3. Find Valid Creative (Date Check)
        const validCreative = partner.creatives.find(c => {
            if (c.startDate && c.startDate > today) return false;
            if (c.endDate && c.endDate < today) return false;
            return true;
        });

        // If we found a valid creative and this score is higher than previous best
        if (validCreative && score > highestScore) {
            highestScore = score;
            bestMatch = { 
                partner, 
                creative: validCreative,
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
    
    // Just return the first valid creative found
    const today = new Date().toISOString().split('T')[0];
    const creative = partner.creatives.find(c => {
        if (c.startDate && c.startDate > today) return false;
        if (c.endDate && c.endDate < today) return false;
        return true;
    });

    if (!creative) return null;
    return { partner, creative, isFallback: false };
}
