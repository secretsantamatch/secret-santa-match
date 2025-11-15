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
    // Standard CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204, // No Content
            headers: corsHeaders,
        });
    }

    // Only allow POST requests for this endpoint
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
        
        // Read the existing data for the entire exchange
        const allWishlists = (await store.get(exchangeId, { type: 'json' })) || {};

        // Update the data for the specific participant
        const updatedWishlists = {
            ...allWishlists,
            [participantId]: wishlist,
        };

        // Save the entire updated object back
        await store.setJSON(exchangeId, updatedWishlists);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error updating wishlist:', error);
        return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
};
