// netlify/functions/get-wishlist.ts
import { admin } from './firebase-admin';

export async function handler(event: any) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { id } = event.queryStringParameters;
    if (!id) {
      return { statusCode: 400, body: 'Wishlist ID is required' };
    }

    const doc = await admin.firestore().collection('wishlists').doc(id).get();

    if (!doc.exists) {
      return { statusCode: 404, body: 'Wishlist not found' };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc.data()),
    };
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}
