import admin from './firebase-admin';
import type { ExchangeData } from '../../src/types';

interface UpdatePayload {
    exchangeId: string;
    data: Omit<ExchangeData, 'backgroundOptions' | 'id'>;
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
        
        // Use `set` to completely overwrite the document with the new data.
        // This is safer than `update` for this use case, as it ensures the entire state is in sync.
        await exchangeRef.set(data);

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