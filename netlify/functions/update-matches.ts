import admin from './firebase-admin';

interface UpdatePayload {
    exchangeId: string;
    matches: { g: string; r: string }[];
}

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { exchangeId, matches }: UpdatePayload = JSON.parse(event.body);

        if (!exchangeId || !matches) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields.' }) };
        }

        const db = admin.firestore();
        const exchangeRef = db.collection('exchanges').doc(exchangeId);
        
        const doc = await exchangeRef.get();
        if (!doc.exists) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Exchange not found.' }) };
        }
        
        await exchangeRef.update({ matches });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Matches updated successfully.' }),
        };
    } catch (error) {
        console.error('Error updating matches:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update matches.';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage }),
        };
    }
}