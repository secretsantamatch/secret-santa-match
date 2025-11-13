import admin from './firebase-admin';
import type { ExchangeData } from '../../src/types';

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const db = admin.firestore();
        const clientData: Omit<ExchangeData, 'backgroundOptions' | 'id'> = JSON.parse(event.body);
        
        const dataToSave = {
            ...clientData,
            views: {}, // Initialize the views object for tracking
        };

        const docRef = await db.collection('exchanges').add(dataToSave);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: docRef.id }),
        };
    } catch (error) {
        console.error('Error creating exchange:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create the gift exchange.' }),
        };
    }
}