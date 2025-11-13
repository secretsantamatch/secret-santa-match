import admin from './firebase-admin';
import type { ExchangeData, Participant, Exclusion, Assignment } from '../../src/types';

// Self-contained UUID generator to avoid Node.js environment issues with crypto module.
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing.' }) };
        }

        if (event.body.length > 1024 * 1024) { // 1MB limit
             return { 
                statusCode: 413,
                body: JSON.stringify({ error: 'The submitted data is too large, likely due to a large custom background image. Please reduce the image size and try again.' }) 
            };
        }

        const clientData: Omit<ExchangeData, 'backgroundOptions' | 'id'> = JSON.parse(event.body);
        
        const p = (Array.isArray(clientData.p) ? clientData.p : [])
            // FIX: Corrected the type predicate to `p is Participant` and ensured the filter returns a boolean with `!!p.name`
            .filter((p): p is Participant => p && typeof p === 'object' && !!p.name)
            .map((p) => ({
                id: String(p.id ?? uuidv4()),
                name: String(p.name ?? ''),
                interests: String(p.interests ?? ''),
                likes: String(p.likes ?? ''),
                dislikes: String(p.dislikes ?? ''),
                links: String(p.links ?? ''),
                budget: String(p.budget ?? ''),
            }));

        const matches = (Array.isArray(clientData.matches) ? clientData.matches : [])
            .filter(m => m && typeof m.g === 'string' && typeof m.r === 'string' && m.g && m.r)
            .map(m => ({ g: String(m.g), r: String(m.r) }));

        const exclusions = (Array.isArray(clientData.exclusions) ? clientData.exclusions : [])
            .filter(ex => ex && typeof ex.p1 === 'string' && typeof ex.p2 === 'string')
            .map(ex => ({ p1: String(ex.p1), p2: String(ex.p2) }));

        const assignments = (Array.isArray(clientData.assignments) ? clientData.assignments : [])
            .filter(as => as && typeof as.giverId === 'string' && typeof as.receiverId === 'string')
            .map(as => ({ giverId: String(as.giverId), receiverId: String(as.receiverId) }));

        const finalData: Omit<ExchangeData, 'id' | 'backgroundOptions'> = {
            p,
            matches,
            exclusions,
            assignments,
            eventDetails: String(clientData.eventDetails ?? ''),
            bgId: String(clientData.bgId ?? 'gift-border'),
            customBackground: typeof clientData.customBackground === 'string' ? clientData.customBackground : null,
            textColor: String(clientData.textColor ?? '#FFFFFF'),
            useTextOutline: Boolean(clientData.useTextOutline ?? false),
            outlineColor: String(clientData.outlineColor ?? '#000000'),
            outlineSize: ['thin', 'normal', 'thick'].includes(clientData.outlineSize!) ? clientData.outlineSize! : 'normal',
            fontSizeSetting: ['normal', 'large', 'extra-large'].includes(clientData.fontSizeSetting!) ? clientData.fontSizeSetting! : 'normal',
            fontTheme: ['classic', 'elegant', 'modern', 'whimsical'].includes(clientData.fontTheme!) ? clientData.fontTheme! : 'classic',
            lineSpacing: typeof clientData.lineSpacing === 'number' && !isNaN(clientData.lineSpacing) ? clientData.lineSpacing : 1.2,
            greetingText: String(clientData.greetingText ?? "Hello, {secret_santa}!"),
            introText: String(clientData.introText ?? "You are the Secret Santa for..."),
            wishlistLabelText: String(clientData.wishlistLabelText ?? "Gift Ideas & Notes:"),
            views: {},
        };

        const db = admin.firestore();
        const docRef = await db.collection('exchanges').add(finalData);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: docRef.id }),
        };
    } catch (error) {
        console.error('CRITICAL Error in create-exchange:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create the gift exchange.' }),
        };
    }
}