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

    // Handle Preflight
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

        // 1. Validation
        if (!exchangeId || !participantId || !wishlist) {
            console.error("Missing fields:", { exchangeId, participantId, wishlist });
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Get Store
        const store = getStore('wishlists');
        
        // 3. Retrieve Existing Data (Safely)
        let allWishlists: Record<string, any> = {};
        try {
            const existingData = await store.get(exchangeId, { type: 'json' });
            if (existingData) {
                allWishlists = existingData as Record<string, any>;
            }
        } catch (readError) {
            console.warn("Could not read existing store (might be new):", readError);
            // We continue with an empty object, essentially creating the store
        }

        // 4. Merge New Data
        allWishlists[participantId] = wishlist;

        // 5. Write Back to Store
        await store.setJSON(exchangeId, allWishlists);

        return new Response(JSON.stringify({ success: true, savedData: wishlist }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('FATAL Update Wishlist Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error during save.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
};