import admin from './firebase-admin';
import type { ExchangeData, Participant, Exclusion, Assignment } from '../../src/types';

// Self-contained UUID generator to avoid Node.js environment issues with crypto module.
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

interface UpdatePayload {
    exchangeId: string;
    data: Partial<Omit<ExchangeData, 'backgroundOptions' | 'id'>>;
}

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing.' }) };
        }
        const { exchangeId, data: clientData }: UpdatePayload = JSON.parse(event.body);

        if (!exchangeId || !clientData) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields.' }) };
        }

        const db = admin.firestore();
        const exchangeRef = db.collection('exchanges').doc(exchangeId);
        
        const doc = await exchangeRef.get();
        if (!doc.exists) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Exchange not found.' }) };
        }

        // DEFINITIVE FIX: Instead of merging, we use the client data as the source of truth
        // and only preserve the necessary fields from the existing data (like 'views').
        // This prevents corrupted old data from being carried over and crashing the function.
        const existingData = doc.data();
        const existingViews = (existingData && typeof existingData.views === 'object' && existingData.views !== null && !Array.isArray(existingData.views)) 
            ? existingData.views 
            : {};

        // Perform the same robust sanitization as the create function.
        const finalData = {
            p: (Array.isArray(clientData.p) ? clientData.p : [])
                .filter(Boolean)
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
                .filter(m => m && m.g && m.r),
            exclusions: (Array.isArray(clientData.exclusions) ? clientData.exclusions : [])
                .filter(Boolean)
                .map((ex: Partial<Exclusion>) => ({
                    p1: ex.p1 ?? '',
                    p2: ex.p2 ?? ''
                })),
            assignments: (Array.isArray(clientData.assignments) ? clientData.assignments : [])
                .filter(Boolean)
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
            lineSpacing: clientData.lineSpacing ?? 1.2,
            greetingText: clientData.greetingText ?? "Hello, {secret_santa}!",
            introText: clientData.introText ?? "You are the Secret Santa for...",
            wishlistLabelText: clientData.wishlistLabelText ?? "Gift Ideas & Notes:",
            views: existingViews, // Preserve the existing views
        };

        await exchangeRef.set(finalData);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Exchange updated successfully.', id: exchangeId }),
        };
    } catch (error) {
        console.error('CRITICAL Error in update-exchange:', error);
        const errorMessage = error instanceof Error ? error.message : 'A server error occurred during update.';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage }),
        };
    }
}