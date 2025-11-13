import admin from './firebase-admin';
import type { ExchangeData, Participant, Exclusion, Assignment } from '../../src/types';
import { randomUUID } from 'crypto';


export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing.' }) };
        }
        const clientData: Omit<ExchangeData, 'backgroundOptions' | 'id'> = JSON.parse(event.body);
        
        // Harden new exchanges against any possible malformed client data
        const finalData = {
            p: (Array.isArray(clientData.p) ? clientData.p : [])
                .filter(Boolean)
                .map((p: Partial<Participant>) => ({
                    id: p.id ?? randomUUID(),
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
            views: {}, // Always initialize views
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