import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const exchangeId = url.searchParams.get('exchangeId');

        if (!exchangeId) {
            return new Response(JSON.stringify({ error: 'exchangeId parameter is required.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const store = getStore('wishlists');
        const data = await store.get(exchangeId, { type: 'json' });

        return new Response(JSON.stringify(data || {}), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Get Wishlist Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to retrieve wishlist data.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
};