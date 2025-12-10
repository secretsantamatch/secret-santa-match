
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { publicId, card } = await req.json();
        
        const store = getStore({ name: 'kudos-boards', consistency: 'strong' });
        const board: any = await store.get(publicId, { type: 'json' });

        if (!board) return new Response('Board not found', { status: 404 });

        const newCard = {
            id: crypto.randomUUID(),
            ...card,
            reactions: {}, // Initialize reactions
            timestamp: Date.now()
        };

        board.cards.push(newCard);
        await store.setJSON(publicId, board);

        return new Response(JSON.stringify(newCard), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to add card' }), { status: 500 });
    }
};