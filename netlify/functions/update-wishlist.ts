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
        const body = await req.json();
        const { exchangeId, participantId, wishlistData } = body;

        if (!exchangeId || !participantId || !wishlistData) {
            return new Response(JSON.stringify({ error: 'Missing required fields (exchangeId, participantId, or wishlistData)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const { interests, likes, dislikes, links, budget } = wishlistData;

        // More robust validation
        if (
            typeof interests !== 'string' ||
            typeof likes !== 'string' ||
            typeof dislikes !== 'string' ||
            typeof budget !== 'string' ||
            !Array.isArray(links) ||
            !links.every(link => typeof link === 'string')
        ) {
            return new Response(JSON.stringify({ error: 'Invalid wishlist data format. All fields must have the correct type.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const store = getStore('wishlists');
        const key = `${exchangeId}-${participantId}`;
        
        // Save a clean object to prevent any extra properties from being stored.
        const cleanWishlistData = { interests, likes, dislikes, links, budget };
        await store.setJSON(key, cleanWishlistData);

        return new Response(JSON.stringify({ success: true, message: 'Wishlist updated' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error updating wishlist:', error);
        return new Response(JSON.stringify({ error: 'An internal server error occurred while saving.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};