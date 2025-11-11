import admin from './firebase-admin';

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (event.queryStringParameters && event.queryStringParameters.id) {
        const exchangeId = event.queryStringParameters.id;
        try {
            const db = admin.firestore();
            const doc = await db.collection('exchanges').doc(exchangeId).get();

            if (!doc.exists) {
                return { statusCode: 404, body: JSON.stringify({ error: 'Exchange not found.' }) };
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: doc.id, ...doc.data() }),
            };
        } catch (error) {
            console.error('Error getting exchange:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to retrieve exchange data.' }),
            };
        }
    }
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing exchange id parameter.' }) };
}