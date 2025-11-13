import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { exchangeId, participantId, wishlistData } = await req.json();

        if (!exchangeId || !participantId || !wishlistData) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // Basic validation
        if (typeof wishlistData.interests !== 'string' || typeof wishlistData.likes !== 'string') {
             return new Response(JSON.stringify({ error: 'Invalid wishlist data format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const store = getStore('wishlists');
        const key = `${exchangeId}-${participantId}`;
        await store.setJSON(key, wishlistData);

        return new Response(JSON.stringify({ success: true, message: 'Wishlist updated' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error updating wishlist:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
