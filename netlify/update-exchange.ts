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

        // DEFINITIVE FIX: Check payload size to prevent Firestore 1MB document limit crash.
        // The limit is 1,048,576 bytes. We check against 1MB to be safe.
        if (event.body.length > 1024 * 1024) {
             return { 
                statusCode: 413, // Payload Too Large
                body: JSON.stringify({ error: 'The submitted data is too large, likely due to a large custom background image. Please reduce the image size (under 3MB) and try again.' }) 
            };
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

        const existingData = doc.data();
        const existingViews = (existingData && typeof existingData.views === 'object' && existingData.views !== null && !Array.isArray(existingData.views)) 
            ? existingData.views 
            : {};
            
        // Aggressively sanitize the 'views' object to remove any non-string values.
        const sanitizedViews: { [key: string]: string } = {};
        if (existingViews) {
            for (const key in existingViews) {
                if (Object.prototype.hasOwnProperty.call(existingViews, key) && typeof existingViews[key] === 'string') {
                    sanitizedViews[key] = existingViews[key];
                }
            }
        }

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
            views: sanitizedViews, // Use the fully sanitized views object
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