
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
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
        
        // Retrieve as raw string to match the update logic
        const rawData = await store.get(exchangeId, { type: 'text' });
        
        console.log(`[get-wishlist] Raw data retrieved length: ${rawData ? rawData.length : 0}`);

        let data = {};
        if (rawData) {
            try {
                data = JSON.parse(rawData);
            } catch (e) {
                console.error('[get-wishlist] Failed to parse JSON:', e);
                // Return empty object if corrupt, but log it
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