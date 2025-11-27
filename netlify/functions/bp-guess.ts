
import { getStore } from "@netlify/blobs";
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const { poolId, guess } = await req.json();
        if (!poolId || !guess) return new Response('Missing data', { status: 400 });

        const store = getStore({ name: 'baby-pools', consistency: 'strong' });
        const pool: any = await store.get(poolId, { type: 'json' });

        if (!pool) return new Response('Pool not found', { status: 404 });
        if (pool.status === 'completed') return new Response('Pool is closed', { status: 403 });

        // Add ID and Timestamp to guess
        // We explicitly allow the new fields (length, hair, eye, customAnswers) to pass through via ...guess
        const newGuess = {
            ...guess,
            id: crypto.randomUUID(),
            submittedAt: new Date().toISOString()
        };

        pool.guesses.push(newGuess);
        
        await store.setJSON(poolId, pool);

        return new Response(JSON.stringify({ success: true, guess: newGuess }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to submit guess' }), { status: 500 });
    }
};