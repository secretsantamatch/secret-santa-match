import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';
import type { WEGame } from '../../src/types';

export default async (req: Request, context: Context) => {
    try {
        const url = new URL(req.url);
        const gameId = url.searchParams.get('gameId');

        if (!gameId) {
            return new Response(JSON.stringify({ error: 'gameId parameter is required.' }), { status: 400 });
        }

        const store = getStore('we-games');
        const gameData = await store.get(gameId, { type: 'json' }) as WEGame | null;

        if (!gameData) {
            return new Response(JSON.stringify({ error: 'Game not found.' }), { status: 404 });
        }

        // IMPORTANT: Never send the organizerKey to the public getter
        const { organizerKey, ...publicGameData } = gameData;

        return new Response(JSON.stringify(publicGameData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Get WE Game Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to retrieve game data.' }), { status: 500 });
    }
};
