
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

        // Init checks for existing games
        if (!game.giftState) game.giftState = {};
        if (!game.giftStealCounts) game.giftStealCounts = {};
        if (game.displacedPlayerId === undefined) game.displacedPlayerId = null;
        if (game.lastVictimId === undefined) game.lastVictimId = null;

        switch (action) {
            case 'start_game':
                if (!game.isStarted) {
                    game.isStarted = true;
                    game.history.push('The game has started!');
                }
                break;

            case 'log_open':
                // Logic: A player opens a gift. This effectively "ends" the turn/chain and moves the game to the next person in line.
                // Even if it was a displaced player opening, the "chain" of steals resolves here.
                if (payload && payload.entry && payload.actorId && payload.gift) {
                    game.history.push(payload.entry);
                    
                    // Assign gift
                    game.giftState[payload.actorId] = payload.gift;
                    // Initialize steal count for this new gift
                    game.giftStealCounts[payload.gift] = 0;

                    // Clear steal chain state since a new gift was opened
                    game.displacedPlayerId = null;
                    game.lastVictimId = null;

                    // Advance the Turn Order
                    // We only move to the next player index if the game isn't finished
                    if (game.currentPlayerIndex < game.turnOrder.length - 1) {
                        game.currentPlayerIndex++;
                        game.history.push(`It's now ${game.turnOrder[game.currentPlayerIndex].name}'s turn.`);
                    } else {
                        // Everyone has had a chance to open a gift
                        game.isFinished = true;
                        game.history.push('All gifts have been opened! The game is over (unless you want to do a final swap)!');
                    }
                }
                break;

            case 'log_steal':
                // Logic: Player steals a gift. They get the gift, the victim becomes "displaced" and must act next.
                // The main turn counter (currentPlayerIndex) DOES NOT change.
                if (payload && payload.entry) {
                    game.history.push(payload.entry);
                    
                    // Update gift ownership
                    if (payload.thiefId && payload.victimId && payload.gift) {
                        game.giftState[payload.thiefId] = payload.gift;
                        delete game.giftState[payload.victimId];
                        
                        // Increment Steal Count
                        const currentSteals = game.giftStealCounts[payload.gift] || 0;
                        game.giftStealCounts[payload.gift] = currentSteals + 1;

                        // Set the displaced player (the victim)
                        game.displacedPlayerId = payload.victimId;
                        
                        // Track last victim to prevent immediate steal-back rules
                        game.lastVictimId = payload.victimId; 
                    }
                }
                break;

            case 'next_player':
                // Manual override to skip or force next
                game.displacedPlayerId = null;
                if (game.currentPlayerIndex < game.turnOrder.length - 1) {
                    game.currentPlayerIndex++;
                    game.history.push(`Organized forced next turn: ${game.turnOrder[game.currentPlayerIndex].name}`);
                } else {
                     game.isFinished = true;
                     game.history.push('The game has ended!');
                }
                break;

            case 'undo':
                // Simple undo: pops the last history entry. 
                // Note: This simplistic undo doesn't revert complex state perfectly, 
                // but it helps if an organizer just logged a text string wrong.
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
