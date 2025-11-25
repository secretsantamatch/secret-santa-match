
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        const url = new URL(req.url);
        const exchangeId = url.searchParams.get('exchangeId');

        console.log(`[get-wishlist] Invoked for exchangeId: ${exchangeId}`);

        if (!exchangeId) {
            return new Response(JSON.stringify({ error: 'exchangeId parameter is required.' }), { 
                status: 400, 
                headers 
            });
        }

        const store = getStore('wishlists');
        
        // Retrieve the JSON object directly using the SDK helper
        const data = await store.get(exchangeId, { type: 'json' });
        
        console.log(`[get-wishlist] Data retrieved: ${data ? 'Found' : 'Null'}`);

        return new Response(JSON.stringify(data || {}), {
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
