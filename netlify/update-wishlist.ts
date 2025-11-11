import admin from './firebase-admin';
import type { Participant } from '../../src/types';

interface UpdatePayload {
    exchangeId: string;
    participantId: string;
    wishlistData: Partial<Pick<Participant, 'interests' | 'likes' | 'dislikes' | 'links' | 'budget'>>;
}

export async function handler(event: any, context: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { exchangeId, participantId, wishlistData }: UpdatePayload = JSON.parse(event.body);

        if (!exchangeId || !participantId || !wishlistData) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields.' }) };
        }

        const db = admin.firestore();
        const exchangeRef = db.collection('exchanges').doc(exchangeId);
        
        // Use a transaction to ensure data consistency
        await db.runTransaction(async (transaction) => {
            const exchangeDoc = await transaction.get(exchangeRef);
            if (!exchangeDoc.exists) {
                throw new Error('Exchange not found');
            }

            const exchangeData = exchangeDoc.data();
            if (!exchangeData || !Array.isArray(exchangeData.p)) {
                 throw new Error('Invalid exchange data format');
            }
            
            const participants = exchangeData.p as Participant[];
            const participantIndex = participants.findIndex(p => p.id === participantId);

            if (participantIndex === -1) {
                throw new Error('Participant not found in this exchange');
            }

            // Securely update only the allowed wishlist fields
            participants[participantIndex] = {
                ...participants[participantIndex],
                interests: wishlistData.interests ?? participants[participantIndex].interests,
                likes: wishlistData.likes ?? participants[participantIndex].likes,
                dislikes: wishlistData.dislikes ?? participants[participantIndex].dislikes,
                links: wishlistData.links ?? participants[participantIndex].links,
                budget: wishlistData.budget ?? participants[participantIndex].budget,
            };

            transaction.update(exchangeRef, { p: participants });
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Wishlist updated successfully.' }),
        };
    } catch (error) {
        console.error('Error updating wishlist:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update wishlist.';
        const statusCode = errorMessage.includes('not found') ? 404 : 500;
        return {
            statusCode,
            body: JSON.stringify({ error: errorMessage }),
        };
    }
}