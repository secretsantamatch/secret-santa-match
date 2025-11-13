import admin from './firebase-admin';

interface TrackViewPayload {
    exchangeId: string;
    participantId: string;
}

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { exchangeId, participantId }: TrackViewPayload = JSON.parse(event.body);

        if (!exchangeId || !participantId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields.' }) };
        }

        const db = admin.firestore();
        const exchangeRef = db.collection('exchanges').doc(exchangeId);
        
        // Atomically update the views map for the specific participant.
        // This uses dot notation to update a nested field without overwriting the whole map.
        await exchangeRef.update({
            [`views.${participantId}`]: new Date().toISOString()
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'View tracked successfully.' }),
        };
    } catch (error) {
        // Don't log "not found" as a critical server error.
        if (error instanceof Error && error.message.includes('NOT_FOUND')) {
             return { statusCode: 404, body: JSON.stringify({ error: 'Exchange not found.' }) };
        }
        console.error('Error tracking view:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to track view.' }),
        };
    }
}