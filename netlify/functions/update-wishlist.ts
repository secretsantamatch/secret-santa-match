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
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }
        
        const { interests, likes, dislikes, links } = wishlistData;
        if (
            typeof interests !== 'string' || typeof likes !== 'string' || typeof dislikes !== 'string' ||
            !Array.isArray(links) || !links.every(link => typeof link === 'string')
        ) {
            return new Response(JSON.stringify({ error: 'Invalid wishlist data format.' }), { status: 400 });
        }

        const store = getStore('wishlists-v2');
        const key = exchangeId;

        // Fetch the existing wishlists object for the entire exchange
        let allWishlists: Record<string, any> = await store.get(key, { type: 'json' }) || {};

        // Update the data for the specific participant
        allWishlists[participantId] = { interests, likes, dislikes, links };

        // Save the entire updated object back to the blob
        await store.setJSON(key, allWishlists);

        return new Response(JSON.stringify({ success: true, message: 'Wishlist updated' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error updating wishlist:', error);
        return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
    }
};