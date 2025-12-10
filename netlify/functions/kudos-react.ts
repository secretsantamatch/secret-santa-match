
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { publicId, cardId, emoji } = await req.json();

        if (!publicId || !cardId || !emoji) {
            return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
        }
        
        const store = getStore({ name: 'kudos-boards', consistency: 'strong' });
        const board: any = await store.get(publicId, { type: 'json' });

        if (!board) return new Response('Board not found', { status: 404 });

        const card = board.cards.find((c: any) => c.id === cardId);
        if (!card) return new Response('Card not found', { status: 404 });

        if (!card.reactions) card.reactions = {};
        
        // Increment reaction count
        card.reactions[emoji] = (card.reactions[emoji] || 0) + 1;

        await store.setJSON(publicId, board);

        return new Response(JSON.stringify({ success: true, reactions: card.reactions }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to react' }), { status: 500 });
    }
};