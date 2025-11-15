import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

interface UpdatePayload {
    exchangeId: string;
    participantId: string;
    wishlist: {
        interests: string;
        likes: string;
        dislikes: string;
        links: string[];
    };
}

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { exchangeId, participantId, wishlist } = (await req.json()) as UpdatePayload;

        if (!exchangeId || !participantId || !wishlist) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
        }

        const store = getStore('wishlists');
        
        // Get the existing wishlists object, or create a new one
        const allWishlists = await store.get(exchangeId, { type: 'json' }) || {};

        // Update the specific participant's wishlist
        const updatedWishlists = {
            ...allWishlists,
            [participantId]: wishlist,
        };

        // Save the entire object back to the blob store
        await store.setJSON(exchangeId, updatedWishlists);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });

    } catch (error) {
        console.error('Error updating wishlist:', error);
        return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
};