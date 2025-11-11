import admin from './firebase-admin';
import type { ExchangeData } from '../../src/types';

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const db = admin.firestore();
        // The data sent from the client doesn't include backgroundOptions
        const data: Omit<ExchangeData, 'backgroundOptions'> = JSON.parse(event.body);
        
        // Add a new document with a generated ID to the 'exchanges' collection.
        const docRef = await db.collection('exchanges').add(data);

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