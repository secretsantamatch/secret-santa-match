
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';
import type { WEGame, WEReaction } from '../../src/types';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { gameId, emoji } = await req.json();

        if (!gameId || !emoji) {
            return new Response(JSON.stringify({ error: 'Missing fields.' }), { status: 400 });
        }

        const store = getStore('we-games');
        const game = await store.get(gameId, { type: 'json' }) as WEGame | null;

        if (!game) {
            return new Response(JSON.stringify({ error: 'Game not found.' }), { status: 404 });
        }

        if (!game.reactions) {
            game.reactions = [];
        }

        const newReaction: WEReaction = {
            id: crypto.randomUUID(),
            emoji: emoji,
            timestamp: Date.now()
        };

        // Keep only last 30 reactions to save space/bandwidth
        const updatedReactions = [...game.reactions, newReaction].slice(-30);
        
        // Optimistic update for consistency not required, just appending
        game.reactions = updatedReactions;

        await store.setJSON(gameId, game);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('WE Reaction Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to send reaction.' }), { status: 500 });
    }
};
