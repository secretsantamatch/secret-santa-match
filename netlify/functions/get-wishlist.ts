import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

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
    
    // Only allow GET requests for this endpoint
    if (req.method !== 'GET') {
         return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const url = new URL(req.url);
    const exchangeId = url.searchParams.get('exchangeId');

    if (!exchangeId) {
        return new Response(JSON.stringify({ error: 'exchangeId parameter is required.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const store = getStore('wishlists');
        const wishlistData = await store.get(exchangeId, { type: 'json' });

        return new Response(JSON.stringify(wishlistData || {}), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching wishlists:', error);
        return new Response(JSON.stringify({ error: 'A server error occurred while fetching the wishlist data.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
};
