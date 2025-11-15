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

    try {
        const store = getStore('wishlists');
        const wishlistData = await store.get(exchangeId, { type: 'json' });

        return new Response(JSON.stringify(wishlistData || {}), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    } catch (error) {
        console.error('Error fetching wishlists:', error);
        // Provide a more specific error if blob storage is not enabled
        if (error instanceof Error && (error.message.includes('No blob store') || error.message.includes('404'))) {
             return new Response(JSON.stringify({ error: "Database feature not enabled. The site owner needs to enable 'Blob Storage' in the Netlify site settings." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }
        return new Response(JSON.stringify({ error: 'Failed to fetch wishlists due to a server issue.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
};
