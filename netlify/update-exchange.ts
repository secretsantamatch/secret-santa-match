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

        const existingData = doc.data() as ExchangeData;
        const mergedData = { ...existingData, ...clientData };

        const finalData = {
            p: (Array.isArray(mergedData.p) ? mergedData.p : [])
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
            matches: (Array.isArray(mergedData.matches) ? mergedData.matches : [])
                .filter(m => m && m.g && m.r),
            exclusions: (Array.isArray(mergedData.exclusions) ? mergedData.exclusions : [])
                .filter(Boolean)
                .map((ex: Partial<Exclusion>) => ({
                    p1: ex.p1 ?? '',
                    p2: ex.p2 ?? ''
                })),
            assignments: (Array.isArray(mergedData.assignments) ? mergedData.assignments : [])
                .filter(Boolean)
                .map((as: Partial<Assignment>) => ({
                    giverId: as.giverId ?? '',
                    receiverId: as.receiverId ?? ''
                })),
            eventDetails: mergedData.eventDetails ?? '',
            bgId: mergedData.bgId ?? 'gift-border',
            customBackground: mergedData.customBackground ?? null,
            textColor: mergedData.textColor ?? '#FFFFFF',
            useTextOutline: mergedData.useTextOutline ?? false,
            outlineColor: mergedData.outlineColor ?? '#000000',
            outlineSize: mergedData.outlineSize ?? 'normal',
            fontSizeSetting: mergedData.fontSizeSetting ?? 'normal',
            fontTheme: mergedData.fontTheme ?? 'classic',
            lineSpacing: mergedData.lineSpacing ?? 1.2,
            greetingText: mergedData.greetingText ?? "Hello, {secret_santa}!",
            introText: mergedData.introText ?? "You are the Secret Santa for...",
            wishlistLabelText: mergedData.wishlistLabelText ?? "Gift Ideas & Notes:",
            views: (typeof mergedData.views === 'object' && mergedData.views !== null && !Array.isArray(mergedData.views)) ? mergedData.views : {},
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