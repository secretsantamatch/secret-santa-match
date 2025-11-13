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

        // DEFINITIVE FIX: Check payload size to prevent Firestore 1MB document limit crash.
        if (event.body.length > 1024 * 1024) {
             return { 
                statusCode: 413, // Payload Too Large
                body: JSON.stringify({ error: 'The submitted data is too large, likely due to a large custom background image. Please reduce the image size and try again.' }) 
            };
        }

        const clientData: Omit<ExchangeData, 'backgroundOptions' | 'id'> = JSON.parse(event.body);
        
        // DEFINITIVE FIX: Harden new exchanges with an aggressive, multi-layered data scrub.
        const finalData = {
            p: (Array.isArray(clientData.p) ? clientData.p : [])
                .filter(p => p && typeof p === 'object') // Filter out null/invalid entries
                .map((p: Partial<Participant>) => ({
                    id: p.id ?? uuidv4(),
                    name: p.name ?? '',
                    interests: p.interests ?? '',
                    likes: p.likes ?? '',
                    dislikes: p.dislikes ?? '',
                    links: p.links ?? '',
                    budget: p.budget ?? '',
                })),
            matches: (Array.isArray(clientData.matches) ? clientData.matches : [])
                .filter(m => m && m.g && m.r), // SCRUB corrupted match objects
            exclusions: (Array.isArray(clientData.exclusions) ? clientData.exclusions : [])
                .filter(ex => ex && typeof ex === 'object') // Filter out null/invalid entries
                .map((ex: Partial<Exclusion>) => ({
                    p1: ex.p1 ?? '',
                    p2: ex.p2 ?? ''
                })),
            assignments: (Array.isArray(clientData.assignments) ? clientData.assignments : [])
                .filter(as => as && typeof as === 'object') // Filter out null/invalid entries
                .map((as: Partial<Assignment>) => ({
                    giverId: as.giverId ?? '',
                    receiverId: as.receiverId ?? ''
                })),
            eventDetails: clientData.eventDetails ?? '',
            bgId: clientData.bgId ?? 'gift-border',
            customBackground: clientData.customBackground ?? null,
            textColor: clientData.textColor ?? '#FFFFFF',
            useTextOutline: clientData.useTextOutline ?? false,
            outlineColor: clientData.outlineColor ?? '#000000',
            outlineSize: clientData.outlineSize ?? 'normal',
            fontSizeSetting: clientData.fontSizeSetting ?? 'normal',
            fontTheme: clientData.fontTheme ?? 'classic',
            lineSpacing: typeof clientData.lineSpacing === 'number' ? clientData.lineSpacing : 1.2,
            greetingText: clientData.greetingText ?? "Hello, {secret_santa}!",
            introText: clientData.introText ?? "You are the Secret Santa for...",
            wishlistLabelText: clientData.wishlistLabelText ?? "Gift Ideas & Notes:",
            views: {}, // Always initialize an empty views object
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