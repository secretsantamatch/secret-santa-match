// netlify/functions/update-wishlist.ts
import { admin } from './firebase-admin';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { id } = event.queryStringParameters;
    const data = JSON.parse(event.body);

    if (!id) {
      return { statusCode: 400, body: 'Wishlist ID is required' };
    }
    
    // Basic validation
    const validData = {
        interests: data.interests || '',
        likes: data.likes || '',
        dislikes: data.dislikes || '',
        links: data.links || '',
        budget: data.budget || '',
    };

    await admin.firestore().collection('wishlists').doc(id).set(validData, { merge: true });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Wishlist updated successfully' }),
    };
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}