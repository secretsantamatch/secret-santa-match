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
        const { exchangeId, participantId, wishlist } = (await req.json()) as UpdatePayload;

        if (!exchangeId || !participantId || !wishlist) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
        }
        
        // Step 2: Read, update, and write data.
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
        console.error('Error processing wishlist update:', error);
        return new Response(JSON.stringify({ error: 'An internal server error occurred while processing the save request.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
};
