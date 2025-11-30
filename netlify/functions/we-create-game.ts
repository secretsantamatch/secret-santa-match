
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';
import type { WEGame, WEParticipant, WERules, WETheme } from '../../src/types';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { participants, rules, theme, groupName, eventDetails } = (await req.json()) as { participants: WEParticipant[], rules: WERules, theme: WETheme, groupName?: string, eventDetails?: string };

        if (!participants || participants.length < 2) {
            return new Response(JSON.stringify({ error: 'At least two participants are required.' }), { status: 400 });
        }

        // Generate a random turn order (Fisher-Yates shuffle)
        const turnOrder = [...participants];
        for (let i = turnOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [turnOrder[i], turnOrder[j]] = [turnOrder[j], turnOrder[i]];
        }

        const gameId = crypto.randomUUID();
        const organizerKey = crypto.randomUUID();

        const newGame: WEGame = {
            gameId,
            organizerKey,
            groupName: groupName || '',
            eventDetails: eventDetails || '',
            participants,
            turnOrder,
            rules,
            theme,
            currentPlayerIndex: 0,
            isStarted: false,
            isFinished: false,
            finalRound: false,
            history: [],
            reactions: [], // Initialize empty
            giftState: {}, // Initialize empty gift state
            createdAt: new Date().toISOString(),
        };

        const store = getStore('we-games');
        await store.setJSON(gameId, newGame);

        return new Response(JSON.stringify({ gameId, organizerKey }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Create WE Game Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create game.' }), { status: 500 });
    }
};
