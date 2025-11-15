import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

interface UpdatePayload {
    exchangeId: string;
    participantId: string;
    wishlist: {
        interests: string;
        likes: string;
        dislikes: string;
        links: string[];
    };
}

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { exchangeId, participantId, wishlist } = (await req.json()) as UpdatePayload;

        if (!exchangeId || !participantId || !wishlist) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
        }

        const store = getStore('wishlists');
        
        const allWishlists = await store.get(exchangeId, { type: 'json' }) || {};

        const updatedWishlists = {
            ...allWishlists,
            [participantId]: wishlist,
        };

        await store.setJSON(exchangeId, updatedWishlists);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });

    } catch (error) {
        console.error('Error updating wishlist:', error);
        // Provide a more specific error if blob storage is not enabled
        if (error instanceof Error && (error.message.includes('No blob store') || error.message.includes('404'))) {
             return new Response(JSON.stringify({ error: "Database feature not enabled. The site owner needs to enable 'Blob Storage' in the Netlify site settings." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }
        return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
};
