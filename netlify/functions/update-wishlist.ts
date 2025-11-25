import { getStore } from "@netlify/blobs";
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
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { ...headers, 'Content-Type': 'application/json' },
        });
    }

    try {
        const { exchangeId, participantId, wishlist } = (await req.json()) as UpdatePayload;

        if (!exchangeId || !participantId || !wishlist) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
            });
        }

        // Initialize store with strong consistency to ensure immediate availability
        const store = getStore({ name: 'wishlists', consistency: 'strong' });
        
        // Get the existing wishlists object for this exchange, or create a new one
        const allWishlists = (await store.get(exchangeId, { type: 'json' })) || {};

        // Update the specific participant's wishlist
        // @ts-ignore - TS might complain about indexing unknown type, but we know it's an object
        allWishlists[participantId] = wishlist;

        // Save the entire updated object back to the store
        await store.setJSON(exchangeId, allWishlists);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Update Wishlist Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to save wishlist data.' }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
        });
    }
};