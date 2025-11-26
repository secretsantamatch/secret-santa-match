import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

interface WishlistData {
    interests: string;
    likes: string;
    dislikes: string;
    links: string[];
}

interface UpdatePayload {
    exchangeId: string;
    participantId: string;
    wishlist: WishlistData;
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

        // CRITICAL: 'consistency: strong' ensures we read the absolute latest data
        // This prevents overwriting data if two people update at the exact same time
        const store = getStore({ name: 'wishlists', consistency: 'strong' });
        
        // Get the existing wishlists object, or initialize a new one
        const rawData = await store.get(exchangeId, { type: 'json' });
        const allWishlists: Record<string, WishlistData> = rawData ? (rawData as Record<string, WishlistData>) : {};

        // Update the specific participant's wishlist
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
