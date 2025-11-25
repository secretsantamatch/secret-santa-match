import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

// Use a consistent store name across all deploy previews
const getStoreName = () => {
    const context = process.env.CONTEXT;
    console.log('[get-wishlist] Netlify context:', context);
    
    if (context === 'deploy-preview' || context === 'branch-deploy') {
        return 'wishlists-preview';
    }
    return 'wishlists';
};

export default async (req: Request, context: Context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        const url = new URL(req.url);
        const exchangeId = url.searchParams.get('exchangeId');

        console.log('[get-wishlist] Request for exchangeId:', exchangeId);

        if (!exchangeId) {
            console.log('[get-wishlist] ERROR: No exchangeId provided');
            return new Response(JSON.stringify({ error: 'exchangeId parameter is required.' }), { 
                status: 400, 
                headers 
            });
        }

        const storeName = getStoreName();
        console.log('[get-wishlist] Using store:', storeName);

        // Get the store with STRONG consistency
        const store = getStore({
            name: storeName,
            consistency: "strong"
        });
        
        // Get the data
        const data = await store.get(exchangeId, { type: 'json' });
        
        console.log('[get-wishlist] Raw blob data:', JSON.stringify(data));
        console.log('[get-wishlist] Data is null?', data === null);
        
        const responseData = data || {};
        console.log('[get-wishlist] Returning:', JSON.stringify(responseData));

        return new Response(JSON.stringify(responseData), {
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