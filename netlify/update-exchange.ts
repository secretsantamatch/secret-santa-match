import admin from './firebase-admin';
import type { ExchangeData, Participant, Exclusion, Assignment } from '../../src/types';

interface UpdatePayload {
    exchangeId: string;
    data: Partial<Omit<ExchangeData, 'backgroundOptions' | 'id'>>;
}

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
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

        // Merge client data over existing data to preserve fields not sent by the client
        const mergedData = { ...existingData, ...clientData };

        // DEFINITIVE FIX: Sanitize the *merged* data to ensure it's a complete and valid object.
        // This handles any fields missing from older documents OR incoming payloads, fixing the root cause of the crash.
        const finalData = {
            p: (Array.isArray(mergedData.p) ? mergedData.p : []).map((p: Partial<Participant>) => ({
                id: p.id ?? crypto.randomUUID(),
                name: p.name ?? '',
                interests: p.interests ?? '',
                likes: p.likes ?? '',
                dislikes: p.dislikes ?? '',
                links: p.links ?? '',
                budget: p.budget ?? '',
            })),
            matches: Array.isArray(mergedData.matches) ? mergedData.matches : [],
            exclusions: (Array.isArray(mergedData.exclusions) ? mergedData.exclusions : []).map((ex: Partial<Exclusion>) => ({
                p1: ex.p1 ?? '',
                p2: ex.p2 ?? ''
            })),
            assignments: (Array.isArray(mergedData.assignments) ? mergedData.assignments : []).map((as: Partial<Assignment>) => ({
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

        // Use `set` with the fully merged and sanitized data to guarantee consistency.
        await exchangeRef.set(finalData);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Exchange updated successfully.', id: exchangeId }),
        };
    } catch (error) {
        console.error('Error updating exchange:', error);
        const errorMessage = error instanceof Error ? error.message : 'A server error occurred during update.';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage }),
        };
    }
}