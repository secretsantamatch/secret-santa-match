import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const url = new URL(req.url);
    const exchangeId = url.searchParams.get('exchangeId');

    if (!exchangeId) {
        return new Response(JSON.stringify({ error: 'exchangeId parameter is required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    let store;
    try {
        // Step 1: Attempt to connect to the database.
        store = getStore('wishlists');
    } catch (error) {
        console.error('Critical Error: Failed to connect to the blob store.', error);
        return new Response(JSON.stringify({ error: "Critical Error: Failed to connect to the database. Ensure Netlify Blob Storage is activated for this site." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
    
    try {
        // Step 2: Attempt to read data from the store.
        const wishlistData = await store.get(exchangeId, { type: 'json' });

        return new Response(JSON.stringify(wishlistData || {}), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    } catch (error) {
        console.error('Error fetching wishlists from store:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch wishlists due to a server issue.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
};
