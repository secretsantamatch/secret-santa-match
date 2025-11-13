import admin from './firebase-admin';
import type { ExchangeData, Participant } from '../../src/types';

// Self-contained UUID generator to avoid Node.js environment issues.
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Recursively removes any keys with `undefined` values from an object.
function removeUndefined(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(removeUndefined).filter(v => v !== undefined);
    
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key] = removeUndefined(value);
        }
        return acc;
    }, {} as { [key: string]: any });
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
        if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing.' }) };
        if (event.body.length > 1024 * 1024) return { statusCode: 413, body: JSON.stringify({ error: 'The submitted data is too large. Please reduce the image size.' }) };
        
        const { exchangeId, data: clientData }: UpdatePayload = JSON.parse(event.body);
        if (!exchangeId || !clientData) return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields.' }) };

        const db = admin.firestore();
        const exchangeRef = db.collection('exchanges').doc(exchangeId);
        
        const doc = await exchangeRef.get();
        if (!doc.exists) return { statusCode: 404, body: JSON.stringify({ error: 'Exchange not found.' }) };

        const existingData = doc.data() || {};
        
        const sanitizedViews: { [key: string]: string } = {};
        if (existingData.views && typeof existingData.views === 'object' && !Array.isArray(existingData.views)) {
            for (const key in existingData.views) {
                if (Object.prototype.hasOwnProperty.call(existingData.views, key) && typeof key === 'string' && typeof existingData.views[key] === 'string') {
                    sanitizedViews[key] = existingData.views[key];
                }
            }
        }

        const p = (Array.isArray(clientData.p) ? clientData.p : [])
            .filter((p): p is Participant => p && typeof p === 'object' && typeof p.name === 'string' && !!p.name.trim())
            .map((p) => ({
                id: String(p.id || uuidv4()),
                name: String(p.name || ''),
                interests: String(p.interests || ''),
                likes: String(p.likes || ''),
                dislikes: String(p.dislikes || ''),
                links: String(p.links || ''),
                budget: String(p.budget || ''),
            }));

        const matches = (Array.isArray(clientData.matches) ? clientData.matches : [])
            .filter(m => m && typeof m.g === 'string' && typeof m.r === 'string' && m.g && m.r)
            .map(m => ({ g: String(m.g), r: String(m.r) }));

        const exclusions = (Array.isArray(clientData.exclusions) ? clientData.exclusions : [])
            .filter(ex => ex && typeof ex.p1 === 'string' && typeof ex.p2 === 'string' && ex.p1 && ex.p2)
            .map(ex => ({ p1: String(ex.p1), p2: String(ex.p2) }));

        const assignments = (Array.isArray(clientData.assignments) ? clientData.assignments : [])
            .filter(as => as && typeof as.giverId === 'string' && typeof as.receiverId === 'string' && as.giverId && as.receiverId)
            .map(as => ({ giverId: String(as.giverId), receiverId: String(as.receiverId) }));

        const finalData = {
            p,
            matches,
            exclusions,
            assignments,
            eventDetails: String(clientData.eventDetails || ''),
            bgId: String(clientData.bgId || 'gift-border'),
            customBackground: typeof clientData.customBackground === 'string' ? clientData.customBackground : null,
            textColor: String(clientData.textColor || '#FFFFFF'),
            useTextOutline: Boolean(clientData.useTextOutline || false),
            outlineColor: String(clientData.outlineColor || '#000000'),
            outlineSize: ['thin', 'normal', 'thick'].includes(clientData.outlineSize!) ? clientData.outlineSize! : 'normal',
            fontSizeSetting: ['normal', 'large', 'extra-large'].includes(clientData.fontSizeSetting!) ? clientData.fontSizeSetting! : 'normal',
            fontTheme: ['classic', 'elegant', 'modern', 'whimsical'].includes(clientData.fontTheme!) ? clientData.fontTheme! : 'classic',
            lineSpacing: typeof clientData.lineSpacing === 'number' && !isNaN(clientData.lineSpacing) ? clientData.lineSpacing : 1.2,
            greetingText: String(clientData.greetingText || "Hello, {secret_santa}!"),
            introText: String(clientData.introText || "You are the Secret Santa for..."),
            wishlistLabelText: String(clientData.wishlistLabelText || "Gift Ideas & Notes:"),
            views: sanitizedViews,
        };
        
        const cleanData = removeUndefined(finalData);
        
        await exchangeRef.set(cleanData);

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
