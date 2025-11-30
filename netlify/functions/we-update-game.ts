import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';
import type { WEGame } from '../../src/types';

interface UpdatePayload {
    gameId: string;
    organizerKey: string;
    action: 'next_player' | 'log_steal' | 'log_open' | 'log_keep' | 'undo' | 'start_game' | 'end_game';
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
        if (game.finalRound === undefined) game.finalRound = false;

        switch (action) {
            case 'start_game':
                if (!game.isStarted) {
                    game.isStarted = true;
                    game.history.push('The game has started!');
                }
                break;

            case 'log_open':
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
                    if (game.currentPlayerIndex < game.turnOrder.length - 1) {
                        game.currentPlayerIndex++;
                        game.history.push(`It's now ${game.turnOrder[game.currentPlayerIndex].name}'s turn.`);
                    } else {
                        // Everyone has opened. Enter Final Round.
                        // Player #1 (index 0) gets to go again.
                        game.finalRound = true;
                        game.displacedPlayerId = game.turnOrder[0].id; // Force Player 1 to act
                        game.history.push('All gifts have been opened! Player 1 gets the final turn to Keep or Swap.');
                    }
                }
                break;

            case 'log_steal':
                if (payload && payload.entry) {
                    game.history.push(payload.entry);
                    
                    // Update gift ownership
                    if (payload.thiefId && payload.victimId && payload.gift) {
                        // Logic: Thief takes Victim's gift.
                        // Victim loses gift.
                        // Thief's OLD gift (if any) is now floating? 
                        // In standard rules, if you steal, you swap. Or if you have nothing (start of turn), you take.
                        
                        // Scenario A: Standard Steal (Thief has no gift, takes from Victim)
                        // Scenario B: Swap (Thief has gift, swaps with Victim). 
                        
                        const thiefGift = game.giftState[payload.thiefId]; // Does thief have a gift?
                        
                        game.giftState[payload.thiefId] = payload.gift;
                        
                        if (thiefGift) {
                            // It was a SWAP (likely Final Round)
                            game.giftState[payload.victimId] = thiefGift;
                        } else {
                            // It was a STEAL (Victim has nothing now)
                            delete game.giftState[payload.victimId];
                        }
                        
                        // Increment Steal Count for the gift being taken
                        const currentSteals = game.giftStealCounts[payload.gift] || 0;
                        game.giftStealCounts[payload.gift] = currentSteals + 1;

                        if (game.finalRound) {
                            // If it's the final round, the game ends after Player 1 acts
                            game.isFinished = true;
                            game.displacedPlayerId = null;
                            game.history.push('The Final Swap is complete! The game is over.');
                        } else {
                            // Set the displaced player (the victim)
                            game.displacedPlayerId = payload.victimId;
                            // Track last victim to prevent immediate steal-back rules
                            game.lastVictimId = payload.victimId; 
                        }
                    }
                }
                break;
            
            case 'log_keep':
                // Used in Final Round if Player 1 decides to keep their gift
                if (game.finalRound) {
                    game.history.push('Player 1 chose to keep their gift. The game is over!');
                    game.isFinished = true;
                    game.displacedPlayerId = null;
                }
                break;

            case 'next_player':
                // Manual override
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