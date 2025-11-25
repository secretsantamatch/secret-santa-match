
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate', // Disable caching
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        const url = new URL(req.url);
        const exchangeId = url.searchParams.get('exchangeId');

        if (!exchangeId) {
            return new Response(JSON.stringify({ error: 'exchangeId parameter is required.' }), { 
                status: 400, 
                headers 
            });
        }

        // Use strong consistency for reads as well
        const store = getStore({ name: "wishlists", consistency: "strong" });
        
        // Get as text to manually parse
        const rawData = await store.get(exchangeId, { type: 'text' });
        
        let data = {};
        if (rawData) {
            try {
                data = JSON.parse(rawData);
            } catch (e) {
                console.error('[get-wishlist] JSON Parse Error:', e);
            }
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers
        });

    } catch (error: any) {
        console.error('[get-wishlist] Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to retrieve wishlist data.' }), {
            status: 500,
            headers
        });
    }
};
