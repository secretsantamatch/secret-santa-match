
import type { WEParticipant, WERules, WETheme, WEGame } from '../types';

export const createGame = async (
    participants: WEParticipant[], 
    rules: WERules, 
    theme: WETheme,
    groupName?: string,
    eventDetails?: string
): Promise<{ gameId: string; organizerKey: string } | null> => {
    try {
        const response = await fetch('/.netlify/functions/we-create-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants, rules, theme, groupName, eventDetails }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create game on the server.');
        }
        return await response.json();
    } catch (error) {
        console.error("Error in createGame service:", error);
        throw error;
    }
};

export const getGameState = async (gameId: string): Promise<WEGame | null> => {
    try {
        // Add timestamp to prevent browser caching of game state
        const response = await fetch(`/.netlify/functions/we-get-game?gameId=${gameId}&t=${Date.now()}`);
        if (response.status === 404) return null;
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch game state.');
        }
        return await response.json();
    } catch (error) {
        console.error("Error in getGameState service:", error);
        throw error;
    }
};

export const updateGameState = async (
    gameId: string, 
    organizerKey: string, 
    action: 'next_player' | 'log_steal' | 'log_open' | 'undo' | 'start_game' | 'end_game', 
    payload?: any
): Promise<WEGame | null> => {
    try {
        const response = await fetch('/.netlify/functions/we-update-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, organizerKey, action, payload }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update game state on the server.');
        }
        return await response.json();
    } catch (error) {
        console.error("Error in updateGameState service:", error);
        throw error;
    }
};
