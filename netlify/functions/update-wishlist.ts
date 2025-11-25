
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
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const { exchangeId, participantId, wishlist } = (await req.json()) as UpdatePayload;

        if (!exchangeId || !participantId || !wishlist) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const store = getStore('wishlists');
        
        // FIX: Handle potential missing store gracefully
        // Get the existing wishlists object for this exchange, or create a new one if it doesn't exist
        let allWishlists = {};
        try {
            const existingData = await store.get(exchangeId, { type: 'json' });
            if (existingData) {
                allWishlists = existingData;
            }
        } catch (e) {
            console.log("Store retrieval returned null or failed, creating new entry.", e);
            // Proceed with empty object
        }

        // Update the specific participant's wishlist
        // We cast to any here because we know the shape we want to enforce
        (allWishlists as any)[participantId] = wishlist;

        // Save the entire updated object back to the store
        await store.setJSON(exchangeId, allWishlists);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Update Wishlist Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to save wishlist data.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
};
