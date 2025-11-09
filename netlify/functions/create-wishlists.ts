// netlify/functions/create-wishlists.ts
import { admin } from './firebase-admin';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { participants } = JSON.parse(event.body);
    if (!Array.isArray(participants) || participants.length === 0) {
      return { statusCode: 400, body: 'Invalid participants data' };
    }

    const db = admin.firestore();
    const batch = db.batch();
    const wishlistIds: { participantId: string; wishlistId: string }[] = [];

    for (const participant of participants) {
      const wishlistRef = db.collection('wishlists').doc();
      const initialData = {
        interests: participant.interests || '',
        likes: participant.likes || '',
        dislikes: participant.dislikes || '',
        links: participant.links || '',
        budget: participant.budget || '',
      };
      batch.set(wishlistRef, initialData);
      wishlistIds.push({ participantId: participant.id, wishlistId: wishlistRef.id });
    }

    await batch.commit();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlistIds }),
    };
  } catch (error) {
    console.error('Error creating wishlists:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}