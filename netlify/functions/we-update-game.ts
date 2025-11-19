
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';
import type { WEGame } from '../../src/types';

interface UpdatePayload {
    gameId: string;
    organizerKey: string;
    action: 'next_player' | 'log_steal' | 'log_open' | 'undo' | 'start_game' | 'end_game';
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

        // Ensure giftState exists (migration for older games)
        if (!game.giftState) {
            game.giftState = {};
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
                if (game.finalRound && game.currentPlayerIndex === 0) {
                    // End of final round
                    game.isFinished = true;
                    game.history.push('The game has ended! Thanks for playing!');
                } else if (game.currentPlayerIndex < game.turnOrder.length - 1) {
                    game.currentPlayerIndex++;
                    game.history.push(`It's now ${game.turnOrder[game.currentPlayerIndex].name}'s turn.`);
                } else if (!game.finalRound) {
                    // Trigger Final Round for Player 1
                    game.finalRound = true;
                    game.currentPlayerIndex = 0; // Back to Player 1
                    game.history.push(`FINAL ROUND! ${game.turnOrder[0].name} gets one last chance to steal!`);
                } else {
                     game.isFinished = true;
                     game.history.push('The game has ended! Thanks for playing!');
                }
                break;
            case 'log_open':
                if (payload && payload.entry && payload.actorId && payload.gift) {
                    game.history.push(payload.entry);
                    game.giftState[payload.actorId] = payload.gift;
                }
                break;
            case 'log_steal':
                if (payload && payload.entry) {
                    game.history.push(payload.entry);
                    // Update gift ownership
                    if (payload.thiefId && payload.victimId && payload.gift) {
                        game.giftState[payload.thiefId] = payload.gift;
                        delete game.giftState[payload.victimId];
                    }
                }
                break;
            case 'undo':
                // Simple undo: pops the last history entry. 
                // NOTE: Truly undoing state changes (gift ownership) is complex and not implemented here.
                // This just undoes the log message.
                if (game.history.length > 1) { 
                    game.history.pop();
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
