import admin from './firebase-admin';

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!event.queryStringParameters || !event.queryStringParameters.id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing exchange id parameter.' }) };
    }

    const exchangeId = event.queryStringParameters.id;
    try {
        const db = admin.firestore();
        const docRef = db.collection('exchanges').doc(exchangeId);
        
        let doc;
        // DEFINITIVE FIX: Implement server-side retries to handle Firestore replication delay.
        // This is more robust and efficient than client-side retries.
        for (let i = 0; i < 4; i++) {
            doc = await docRef.get();
            if (doc.exists) {
                break; // Found it, exit the loop.
            }
            // If not found, wait with increasing delay before the next attempt.
            await new Promise(resolve => setTimeout(resolve, 250 * (i + 1))); 
        }

        if (!doc || !doc.exists) {
            console.warn(`Exchange not found after retries: ${exchangeId}`);
            return { statusCode: 404, body: JSON.stringify({ error: 'Exchange not found.' }) };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: doc.id, ...doc.data() }),
        };
    } catch (error) {
        console.error('CRITICAL Error in get-exchange:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to retrieve exchange data.' }),
        };
    }
}
