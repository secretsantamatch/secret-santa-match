import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const url = new URL(req.url);
    const exchangeId = url.searchParams.get('exchangeId');
    const participantId = url.searchParams.get('participantId');

    if (!exchangeId || !participantId) {
        return new Response(JSON.stringify({ error: 'Missing exchangeId or participantId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const store = getStore('wishlists');
        const key = `${exchangeId}-${participantId}`;
        const wishlistData = await store.get(key, { type: 'json' });

        if (!wishlistData) {
            return new Response(JSON.stringify({ message: 'No wishlist found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(wishlistData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
