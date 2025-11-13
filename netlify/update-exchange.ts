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
        const { exchangeId, data }: UpdatePayload = JSON.parse(event.body);

        if (!exchangeId || !data) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields.' }) };
        }

        const db = admin.firestore();
        const exchangeRef = db.collection('exchanges').doc(exchangeId);
        
        // DEFINITIVE FIX: Sanitize the entire data object on the server before setting it in Firestore.
        // This makes the API robust and prevents crashes from `undefined` values sent by any client, old or new.
        const sanitizedData = {
            p: (data.p || []).map((p: Partial<Participant>) => ({
                id: p.id ?? crypto.randomUUID(),
                name: p.name ?? '',
                interests: p.interests ?? '',
                likes: p.likes ?? '',
                dislikes: p.dislikes ?? '',
                links: p.links ?? '',
                budget: p.budget ?? '',
            })),
            matches: data.matches ?? [],
            exclusions: (data.exclusions || []).map((ex: Partial<Exclusion>) => ({
                p1: ex.p1 ?? '',
                p2: ex.p2 ?? ''
            })),
            assignments: (data.assignments || []).map((as: Partial<Assignment>) => ({
                giverId: as.giverId ?? '',
                receiverId: as.receiverId ?? ''
            })),
            eventDetails: data.eventDetails ?? '',
            bgId: data.bgId ?? 'gift-border',
            customBackground: data.customBackground ?? null,
            textColor: data.textColor ?? '#FFFFFF',
            useTextOutline: data.useTextOutline ?? false,
            outlineColor: data.outlineColor ?? '#000000',
            outlineSize: data.outlineSize ?? 'normal',
            fontSizeSetting: data.fontSizeSetting ?? 'normal',
            fontTheme: data.fontTheme ?? 'classic',
            lineSpacing: data.lineSpacing ?? 1.2,
            greetingText: data.greetingText ?? '',
            introText: data.introText ?? '',
            wishlistLabelText: data.wishlistLabelText ?? '',
            views: data.views ?? {},
        };

        // Use `set` with the fully sanitized data to prevent any possible errors.
        await exchangeRef.set(sanitizedData);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Exchange updated successfully.' }),
        };
    } catch (error) {
        console.error('Error updating exchange:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update exchange.';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage }),
        };
    }
}
