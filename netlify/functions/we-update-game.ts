import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';
import type { WEGame } from '../../src/types';

interface UpdatePayload {
    gameId: string;
    organizerKey: string;
    action: 'next_player' | 'log_steal' | 'undo' | 'start_game' | 'end_game';
    payload?: any;
}

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { gameId, organizerKey, action, payload } = (await req.json()) as UpdatePayload;

        if (!gameId || !organizerKey || !action) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
        }

        const store = getStore('we-games');
        const game = await store.get(gameId, { type: 'json' }) as WEGame | null;

        if (!game) {
            return new Response(JSON.stringify({ error: 'Game not found.' }), { status: 404 });
        }
        
        // Security Check: Only the organizer can update the game
        if (game.organizerKey !== organizerKey) {
            return new Response(JSON.stringify({ error: 'Unauthorized.' }), { status: 403 });
        }

        // --- Game Logic ---
        switch (action) {
            case 'start_game':
                if (!game.isStarted) {
                    game.isStarted = true;
                    game.history.push('The game has started!');
                }
                break;
            case 'next_player':
                if (game.currentPlayerIndex < game.turnOrder.length - 1) {
                    game.currentPlayerIndex++;
                    game.history.push(`It's now ${game.turnOrder[game.currentPlayerIndex].name}'s turn.`);
                } else if (!game.isFinished) {
                    game.isFinished = true;
                    game.history.push('The game has ended! Thanks for playing!');
                }
                break;
            case 'log_steal':
                if (payload && payload.entry) {
                    game.history.push(payload.entry);
                }
                break;
            case 'undo':
                // Simple undo: pops the last history entry. More complex logic could be added.
                if (game.history.length > 1) { // Don't undo the "Game Started" message
                    game.history.pop();
                    // Potentially revert player index if the last action was 'next_player'
                }
                break;
            case 'end_game':
                game.isFinished = true;
                game.history.push('The organizer has ended the game.');
                break;
        }

        await store.setJSON(gameId, game);

        // Return the updated game state, excluding the sensitive key
        const { organizerKey: _, ...publicGameData } = game;

        return new Response(JSON.stringify(publicGameData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Update WE Game Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update game state.' }), { status: 500 });
    }
};
