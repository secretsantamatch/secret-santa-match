
// List of timezones corresponding to GDPR/ePrivacy countries (EU + UK + Switzerland)
const EU_TIMEZONES = [
    'Europe/Vienna', 'Europe/Brussels', 'Europe/Sofia', 'Europe/Zagreb', 'Asia/Nicosia', 'Europe/Prague',
    'Europe/Copenhagen', 'Europe/Tallinn', 'Europe/Helsinki', 'Europe/Paris', 'Europe/Berlin', 'Europe/Athens',
    'Europe/Budapest', 'Europe/Dublin', 'Europe/Rome', 'Europe/Riga', 'Europe/Vilnius', 'Europe/Luxembourg',
    'Europe/Malta', 'Europe/Amsterdam', 'Europe/Warsaw', 'Europe/Lisbon', 'Europe/Bucharest', 'Europe/Bratislava',
    'Europe/Ljubljana', 'Europe/Madrid', 'Europe/Stockholm', 'Europe/London', 'Europe/Zurich', 'Atlantic/Reykjavik'
];

export const isEuVisitor = (): boolean => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!timeZone) return false; // Default to non-EU if unknown
        
        // Check if the timezone is in our list or starts with specific European prefixes
        // This isn't 100% perfect (geo-ip is better), but it's a very strong, free frontend indicator.
        return EU_TIMEZONES.includes(timeZone) || 
               (timeZone.startsWith('Europe/') && !timeZone.includes('Moscow')); 
    } catch (e) {
        return false; // Default to permissible (US-style) if detection fails
    }
};

export const shouldTrackByDefault = (): boolean => {
    const consent = localStorage.getItem('cookie_consent');
    
    // 1. If user explicitly declined, NEVER track
    if (consent === 'false') return false;
    
    // 2. If user explicitly accepted, ALWAYS track
    if (consent === 'true') return true;
    
    // 3. If no choice made yet:
    //    - If EU visitor: DO NOT track (Strict GDPR)
    //    - If US/Other visitor: TRACK (Opt-Out model)
    return !isEuVisitor();
};
