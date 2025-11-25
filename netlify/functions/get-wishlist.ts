import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store, no-cache, must-revalidate', // Critical for fresh data
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
                headers: { ...headers, 'Content-Type': 'application/json' },
            });
        }

        // Initialize store with strong consistency
        const store = getStore({ name: 'wishlists', consistency: 'strong' });
        
        const data = await store.get(exchangeId, { type: 'json' });

        return new Response(JSON.stringify(data || {}), {
            status: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Get Wishlist Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to retrieve wishlist data.' }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
        });
    }
};